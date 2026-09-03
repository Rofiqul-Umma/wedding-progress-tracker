import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PlanState } from '@domain/entities/types';
import type {
  AccountConnection,
  AccountHandlers,
  AccountUser,
} from '@domain/repositories/AccountRepository';
import { decideAccountMigration } from '@application/use-cases/accountMigration';
import { firebaseEnabled } from '@infrastructure/firebase/env';
import {
  PlanBackupRepository,
  type PlanBackupMeta,
} from '@infrastructure/persistence/PlanBackupRepository';
import { usePlan } from '@presentation/state/PlanStore';

export type AccountStatus =
  | 'loading'
  | 'signedOut'
  | 'signingIn'
  | 'migrating'
  | 'connected'
  | 'paused'
  | 'error';

export type AccountError =
  | 'popupCancelled'
  | 'popupBlocked'
  | 'network'
  | 'backupFailed'
  | 'cloudIncomplete'
  | 'permission'
  | 'configuration'
  | 'generic';

interface AccountContextValue {
  enabled: boolean;
  status: AccountStatus;
  user: AccountUser | null;
  error: AccountError | null;
  connection: AccountConnection | null;
  backups: PlanBackupMeta[];
  signIn(local: PlanState): Promise<void>;
  signOut(): Promise<void>;
  retry(local: PlanState): Promise<void>;
  pause(): void;
  resume(local: PlanState): Promise<void>;
  registerRemoteState(fn: ((state: PlanState) => void) | null): void;
  restoreBackup(key: string): PlanState | null;
}

const AccountContext = createContext<AccountContextValue | null>(null);
const backups = new PlanBackupRepository();

async function loadAccount() {
  const [firebase, repository] = await Promise.all([
    import('@infrastructure/firebase/config'),
    import('@infrastructure/firebase/FirestoreAccountRepository'),
  ]);
  return { firebase, repo: new repository.FirestoreAccountRepository() };
}

function errorType(error: unknown): AccountError {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'popupCancelled';
  if (code.includes('popup-blocked')) return 'popupBlocked';
  if (code.includes('network')) return 'network';
  if (code.includes('permission-denied')) return 'permission';
  // Without this branch a project misconfiguration (unauthorized domain,
  // disabled provider, bad key) is indistinguishable from a transient failure,
  // so the user retries forever on an error only they can fix.
  const configuration =
    code.includes('unauthorized-domain') ||
    code.includes('operation-not-allowed') ||
    code.includes('argument-error') ||
    code.includes('invalid-api-key') ||
    code.includes('configuration-not-found');
  // The provider code never reaches the UI, so log it once for diagnosis.
  console.error('[account]', code || error);
  return configuration ? 'configuration' : 'generic';
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { state: localState } = usePlan();
  const localStateRef = useRef(localState);
  localStateRef.current = localState;
  const [status, setStatus] = useState<AccountStatus>(firebaseEnabled ? 'loading' : 'signedOut');
  const [user, setUser] = useState<AccountUser | null>(null);
  const [error, setError] = useState<AccountError | null>(null);
  const [connection, setConnection] = useState<AccountConnection | null>(null);
  const [backupList, setBackupList] = useState(() => backups.list());

  const remoteHandlerRef = useRef<((state: PlanState) => void) | null>(null);
  const lastRemoteRef = useRef<PlanState | null>(null);
  const connectionRef = useRef<AccountConnection | null>(null);
  const userRef = useRef<AccountUser | null>(null);
  const generationRef = useRef(0);
  const pausedRef = useRef(false);
  const initializingRef = useRef<string | null>(null);

  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    lastRemoteRef.current = null;
    setConnection(null);
  }, []);

  const connect = useCallback(
    async (
      account: AccountUser,
      shouldHydrate: boolean,
      generation: number,
    ): Promise<void> => {
      const { repo } = await loadAccount();
      if (generation !== generationRef.current || pausedRef.current) return;

      let firstSnapshot = true;
      let pendingState: PlanState | null = null;
      let connected: AccountConnection | null = null;
      const applySnapshot = (state: PlanState) => {
        if (generation !== generationRef.current || pausedRef.current) return;
        const isFirst = firstSnapshot;
        if (isFirst) {
          firstSnapshot = false;
          if (!backups.setProvenance(account.uid, state)) {
            connected?.disconnect();
            setError('backupFailed');
            setStatus('error');
            return;
          }
        }
        if (shouldHydrate || !isFirst) {
          lastRemoteRef.current = state;
          remoteHandlerRef.current?.(state);
        }
        setStatus('connected');
      };
      const handlers: AccountHandlers = {
        onState: (state) => {
          if (!connected) {
            pendingState = state;
            return;
          }
          applySnapshot(state);
        },
        onError: (reason) => {
          if (generation !== generationRef.current) return;
          setError(errorType(reason));
          setStatus('error');
        },
      };
      connected = await repo.connect(account.uid, handlers);
      if (generation !== generationRef.current || pausedRef.current) {
        connected.disconnect();
        return;
      }
      connectionRef.current = connected;
      setConnection(connected);
      if (pendingState) {
        const state = pendingState;
        pendingState = null;
        applySnapshot(state);
      }
    },
    [],
  );

  const initialize = useCallback(
    async (account: AccountUser, local: PlanState): Promise<void> => {
      if (initializingRef.current === account.uid) return;
      initializingRef.current = account.uid;
      const generation = ++generationRef.current;
      disconnect();
      setUser(account);
      userRef.current = account;
      setStatus(pausedRef.current ? 'paused' : 'migrating');
      setError(null);

      try {
        const { repo } = await loadAccount();
        if (generation !== generationRef.current) return;

        const knownLocalMirror = backups.matchesProvenance(account.uid, local);
        let cloudStatus = await repo.status(account.uid);
        if (generation !== generationRef.current) return;
        let decision = decideAccountMigration(cloudStatus, knownLocalMirror);

        if (decision === 'seed') {
          const outcome = await repo.create(account.uid, local);
          if (generation !== generationRef.current) return;
          if (outcome === 'created') {
            // Provenance is committed after the first complete remote snapshot,
            // so a failed/partial seed is never marked as safely synchronized.
            if (!pausedRef.current) await connect(account, false, generation);
            else setStatus('paused');
            return;
          }

          // Another client won the create transaction. Re-read readiness rather
          // than assuming its asynchronous collection seed already completed.
          cloudStatus = await repo.status(account.uid);
          if (generation !== generationRef.current) return;
          decision = decideAccountMigration(cloudStatus, knownLocalMirror);
        }

        if (decision === 'waitForInitialization') {
          setError('cloudIncomplete');
          setStatus('error');
          return;
        }

        if (decision === 'backupThenHydrate') {
          const result = backups.saveBeforeCloud(account.uid, local);
          setBackupList(backups.list());
          if (!result.ok) {
            setError('backupFailed');
            setStatus('error');
            return;
          }
        }

        if (!pausedRef.current) await connect(account, true, generation);
        else setStatus('paused');
      } catch (reason) {
        if (generation !== generationRef.current) return;
        setError(errorType(reason));
        setStatus('error');
      } finally {
        if (initializingRef.current === account.uid) initializingRef.current = null;
      }
    },
    [connect, disconnect],
  );

  useEffect(() => {
    if (!firebaseEnabled) return;
    let unsubscribe: (() => void) | undefined;
    let alive = true;
    void loadAccount()
      .then(({ firebase }) => {
        if (!alive) return;
        // A redirect sign-in reports its failure (unauthorized domain, cancelled
        // consent) only here — the auth subscription just stays signed out.
        if (firebase.hasPendingRedirect()) {
          void firebase.getGoogleRedirectResult().catch((reason) => {
            if (!alive || userRef.current) return;
            setError(errorType(reason));
            setStatus('signedOut');
          });
        }
        unsubscribe = firebase.subscribeAuth((account) => {
          if (!alive) return;
          if (!account) {
            ++generationRef.current;
            initializingRef.current = null;
            disconnect();
            userRef.current = null;
            setUser(null);
            setError(null);
            setStatus('signedOut');
            return;
          }
          if (userRef.current?.uid === account.uid && connectionRef.current) return;
          void initialize(account, localStateRef.current);
        });
      })
      .catch((reason) => {
        if (!alive) return;
        setError(errorType(reason));
        setStatus('error');
      });
    const generation = generationRef;
    return () => {
      alive = false;
      unsubscribe?.();
      ++generation.current;
      disconnect();
    };
  }, [disconnect, initialize]);

  const signIn = useCallback(
    async (local: PlanState) => {
      if (!firebaseEnabled || status === 'signingIn' || status === 'migrating') return;
      setStatus('signingIn');
      setError(null);
      try {
        const { firebase } = await loadAccount();
        const account = await firebase.signInWithGoogle();
        // `null` means the browser refused a popup and a full-page redirect is
        // underway. Stay in `signingIn`; this document is about to be unloaded
        // and the redirect result is resolved on the way back.
        if (!account) return;
        // The auth subscription usually owns initialization. This call is a safe
        // fallback for environments that delay the callback after popup resolve.
        if (!connectionRef.current && initializingRef.current !== account.uid) {
          await initialize(account, local);
        }
      } catch (reason) {
        setError(errorType(reason));
        setStatus(userRef.current ? 'error' : 'signedOut');
      }
    },
    [initialize, status],
  );

  const signOutAccount = useCallback(async () => {
    ++generationRef.current;
    initializingRef.current = null;
    disconnect();
    backups.clearProvenance();
    try {
      const { firebase } = await loadAccount();
      await firebase.signOutUser();
    } finally {
      userRef.current = null;
      setUser(null);
      setError(null);
      setStatus('signedOut');
    }
  }, [disconnect]);

  const retry = useCallback(
    async (local: PlanState) => {
      if (!userRef.current) {
        await signIn(local);
        return;
      }
      await initialize(userRef.current, local);
    },
    [initialize, signIn],
  );

  const pause = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    ++generationRef.current;
    initializingRef.current = null;
    disconnect();
    if (userRef.current) setStatus('paused');
  }, [disconnect]);

  const resume = useCallback(
    async (local: PlanState) => {
      pausedRef.current = false;
      if (!userRef.current) return;
      // The local state may currently be a room snapshot. Provenance tells the
      // initializer to reconnect directly and hydrate cloud, never upload local.
      await initialize(userRef.current, local);
    },
    [initialize],
  );

  const registerRemoteState = useCallback((fn: ((state: PlanState) => void) | null) => {
    remoteHandlerRef.current = fn;
    if (fn && lastRemoteRef.current) fn(lastRemoteRef.current);
  }, []);

  const restoreBackup = useCallback((key: string) => backups.load(key), []);

  return (
    <AccountContext.Provider
      value={{
        enabled: firebaseEnabled,
        status,
        user,
        error,
        connection,
        backups: backupList,
        signIn,
        signOut: signOutAccount,
        retry,
        pause,
        resume,
        registerRemoteState,
        restoreBackup,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used within an AccountProvider');
  return value;
}
