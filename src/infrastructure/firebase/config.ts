import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  getAuth,
  getRedirectResult,
  initializeAuth,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
  type User,
} from 'firebase/auth';
import { firebaseConfig } from './env';
import type { AccountUser } from '@domain/repositories/AccountRepository';

/**
 * Firebase singletons. This module statically imports the firebase SDK, so it is
 * only ever loaded via a dynamic `import()` from the room layer — keeping the
 * SDK out of the main bundle and out of the test/dev graph entirely.
 */
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

/**
 * Explicit persistence fallback chain. In-app browsers (WhatsApp / Instagram /
 * etc.) and privacy-restricted webviews often block or hang on IndexedDB, which
 * makes the default `getAuth()` sign-in stall forever — leaving a shared link
 * stuck on "connecting" with a blank screen. Listing in-memory last guarantees
 * anonymous sign-in still completes there (session lasts the page's lifetime,
 * which is all a read-only guest needs).
 */
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      // No `popupRedirectResolver` here on purpose: registering it eagerly makes
      // `initializeAuth` touch browser-only APIs, which breaks non-DOM runtimes.
      // Popup/redirect calls pass the resolver explicitly instead.
    });
  } catch {
    // A second evaluation of this module (dev HMR, or a duplicated chunk)
    // throws `auth/already-initialized`. Reuse the configured instance rather
    // than leaving `auth` undefined and breaking every sign-in afterwards.
    return getAuth(app);
  }
}

export const auth = createAuth();

/** Sign in anonymously (idempotent) and resolve to the client's uid. */
export async function signInAnon(): Promise<string> {
  // Wait for the persisted session to be restored before deciding whether to
  // create a new one — otherwise `currentUser` is null on every cold load and
  // we mint a fresh anonymous user each time instead of reusing the stored one.
  await auth.authStateReady();
  // A Google user is also a valid room identity. Never replace them with an
  // anonymous credential when they create or join a shared room.
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

function accountUser(user: User | null): AccountUser | null {
  if (!user || user.isAnonymous) return null;
  return {
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    photoURL: user.photoURL ?? '',
  };
}

function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/** Codes meaning "this browser will not give us a popup", not "sign-in failed". */
function popupUnavailable(code: string): boolean {
  return (
    code.includes('popup-blocked') ||
    code.includes('operation-not-supported-in-this-environment') ||
    code.includes('web-storage-unsupported')
  );
}

/**
 * Open Google's account chooser and return the authenticated profile, or `null`
 * when the browser refused a popup and a full-page redirect was started instead
 * (this document is being unloaded; `getGoogleRedirectResult` resumes on return).
 * In-app webviews (WhatsApp / Instagram) routinely block popups, so without this
 * fallback sign-in is simply impossible for a large share of real visitors.
 */
export async function signInWithGoogle(): Promise<AccountUser | null> {
  try {
    // `initializeAuth` registers no default resolver (unlike `getAuth`), so this
    // argument is required — without it the popup rejects with `argument-error`.
    const credential = await signInWithPopup(
      auth,
      googleProvider(),
      browserPopupRedirectResolver,
    );
    return accountUser(credential.user);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (!popupUnavailable(code)) throw error;
    markRedirectPending();
    await signInWithRedirect(auth, googleProvider(), browserPopupRedirectResolver);
    return null;
  }
}

const REDIRECT_KEY = 'evermore.v2.authRedirect';

function markRedirectPending(): void {
  try {
    sessionStorage.setItem(REDIRECT_KEY, '1');
  } catch {
    // Storage-restricted browsers still complete the redirect; we just cannot
    // pre-announce it, and `getRedirectResult` is skipped on return.
  }
}

/** Whether this load is the return leg of a redirect sign-in we started. */
export function hasPendingRedirect(): boolean {
  try {
    return sessionStorage.getItem(REDIRECT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Resolve a pending redirect sign-in after the browser navigates back. */
export async function getGoogleRedirectResult(): Promise<AccountUser | null> {
  try {
    const credential = await getRedirectResult(auth, browserPopupRedirectResolver);
    return accountUser(credential?.user ?? null);
  } finally {
    try {
      sessionStorage.removeItem(REDIRECT_KEY);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  }
}

/** Sign out without touching local plan storage. */
export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/** Subscribe to persisted non-anonymous account state. */
export function subscribeAuth(listener: (user: AccountUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => listener(accountUser(user)));
}
