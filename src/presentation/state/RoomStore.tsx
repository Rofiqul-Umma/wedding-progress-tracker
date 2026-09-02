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
  RoomConnection,
  RoomHandlers,
  Me,
  Peer,
} from '@domain/repositories/RoomRepository';
import { firebaseEnabled } from '@infrastructure/firebase/env';

export type RoomStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type RoomError = 'notFound' | 'generic';

interface RoomContextValue {
  /** Whether firebase is configured — gates all room UI. */
  enabled: boolean;
  status: RoomStatus;
  roomId: string | null;
  peers: Peer[];
  error: RoomError | null;
  createRoom: (seed: PlanState, beforeConnect?: () => void) => Promise<void>;
  join: (roomId: string, beforeConnect?: () => void) => Promise<void>;
  leave: () => void;
  /** Copy the shareable room URL to the clipboard. */
  copyLink: () => Promise<boolean>;
  /** The live connection, or null when not in a room (used by the sync bridge). */
  connection: RoomConnection | null;
  /** Register the bridge's remote-state sink (or null to unregister). */
  registerRemoteState: (fn: ((s: PlanState) => void) | null) => void;
  /** Increments when an attachment was too large to sync (for a toast). */
  attachmentNotice: number;
}

const RoomContext = createContext<RoomContextValue | null>(null);

const NAMES = ['Rose', 'Ivy', 'Sky', 'Fern', 'Wren', 'Sol', 'Bay', 'Dove', 'Jun', 'Lux'];
const COLORS = [
  '#B24C63', '#3A7CA5', '#C08A2E', '#4C956C',
  '#8E5572', '#2A9D8F', '#E76F51', '#5B7DB1',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function identity(uid: string): Me {
  const h = hash(uid);
  return { clientId: uid, name: NAMES[h % NAMES.length], color: COLORS[h % COLORS.length] };
}

function setRoomParam(roomId: string | null): void {
  const url = new URL(window.location.href);
  if (roomId) url.searchParams.set('room', roomId);
  else url.searchParams.delete('room');
  window.history.replaceState(null, '', url.toString());
}

/** Loads the firebase-backed room modules (kept out of the main bundle). */
async function loadRoom() {
  const [{ signInAnon }, { FirestoreRoomRepository }] = await Promise.all([
    import('@infrastructure/firebase/config'),
    import('@infrastructure/firebase/FirestoreRoomRepository'),
  ]);
  return { signInAnon, repo: new FirestoreRoomRepository() };
}

/**
 * Owns the collaborative-room lifecycle: anonymous identity, connection,
 * presence, and the `?room=` URL. It never touches PlanState — the RoomSync
 * bridge relays remote snapshots into the plan store and local edits back out.
 */
export function RoomProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [error, setError] = useState<RoomError | null>(null);
  const [connection, setConnection] = useState<RoomConnection | null>(null);
  const [attachmentNotice, setAttachmentNotice] = useState(0);

  const remoteHandlerRef = useRef<((s: PlanState) => void) | null>(null);
  const lastRemoteRef = useRef<PlanState | null>(null);
  const connectionRef = useRef<RoomConnection | null>(null);
  const busyRef = useRef(false);

  const registerRemoteState = useCallback((fn: ((s: PlanState) => void) | null) => {
    remoteHandlerRef.current = fn;
    if (fn && lastRemoteRef.current) fn(lastRemoteRef.current);
  }, []);

  const handlers = useCallback(
    (): RoomHandlers => ({
      onState: (s) => {
        lastRemoteRef.current = s;
        remoteHandlerRef.current?.(s);
      },
      onPeers: setPeers,
      onError: (e) => console.error('[room]', e),
      onAttachmentTooLarge: () => setAttachmentNotice((n) => n + 1),
    }),
    [],
  );

  const beginConnection = useCallback(
    (conn: RoomConnection, id: string) => {
      connectionRef.current = conn;
      setConnection(conn);
      setRoomId(id);
      setRoomParam(id);
      setStatus('connected');
      setError(null);
    },
    [],
  );

  const createRoom = useCallback(
    async (seed: PlanState, beforeConnect?: () => void) => {
      if (!firebaseEnabled || busyRef.current) return;
      busyRef.current = true;
      beforeConnect?.();
      setStatus('connecting');
      setError(null);
      try {
        const { signInAnon, repo } = await loadRoom();
        const uid = await signInAnon();
        const id = await repo.create(seed);
        const conn = await repo.connect(id, handlers(), identity(uid));
        beginConnection(conn, id);
      } catch (e) {
        console.error('[room] create failed', e);
        setStatus('error');
        setError('generic');
      } finally {
        busyRef.current = false;
      }
    },
    [beginConnection, handlers],
  );

  const join = useCallback(
    async (id: string, beforeConnect?: () => void) => {
      if (!firebaseEnabled || busyRef.current) return;
      busyRef.current = true;
      beforeConnect?.();
      setStatus('connecting');
      setError(null);
      try {
        const { signInAnon, repo } = await loadRoom();
        const uid = await signInAnon();
        if (!(await repo.exists(id))) {
          setStatus('error');
          setError('notFound');
          setRoomParam(null);
          return;
        }
        const conn = await repo.connect(id, handlers(), identity(uid));
        beginConnection(conn, id);
      } catch (e) {
        console.error('[room] join failed', e);
        setStatus('error');
        setError('generic');
      } finally {
        busyRef.current = false;
      }
    },
    [beginConnection, handlers],
  );

  const leave = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    setConnection(null);
    setRoomId(null);
    setPeers([]);
    setStatus('idle');
    setError(null);
    setRoomParam(null);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Auto-join a shared link on first load (StrictMode-guarded).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (!firebaseEnabled) return;
    const shared = new URLSearchParams(window.location.search).get('room');
    if (shared) void join(shared);
  }, [join]);

  // Disconnect on unmount.
  useEffect(() => () => connectionRef.current?.disconnect(), []);

  return (
    <RoomContext.Provider
      value={{
        enabled: firebaseEnabled,
        status,
        roomId,
        peers,
        error,
        createRoom,
        join,
        leave,
        copyLink,
        connection,
        registerRemoteState,
        attachmentNotice,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
}
