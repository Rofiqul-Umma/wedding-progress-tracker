import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from './env';

/**
 * Firebase singletons. This module statically imports the firebase SDK, so it is
 * only ever loaded via a dynamic `import()` from the room layer — keeping the
 * SDK out of the main bundle and out of the test/dev graph entirely.
 */
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

/** Sign in anonymously (idempotent) and resolve to the client's uid. */
export async function signInAnon(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}
