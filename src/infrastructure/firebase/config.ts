import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  GoogleAuthProvider,
  initializeAuth,
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
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
export const auth = initializeAuth(app, {
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
  ],
});

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

/** Open Google's account chooser and return the authenticated profile. */
export async function signInWithGoogle(): Promise<AccountUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  return accountUser(credential.user)!;
}

/** Sign out without touching local plan storage. */
export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/** Subscribe to persisted non-anonymous account state. */
export function subscribeAuth(listener: (user: AccountUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => listener(accountUser(user)));
}
