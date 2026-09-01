/**
 * Firebase configuration read from Vite env vars. This module deliberately does
 * NOT import the firebase SDK, so it is safe in the eager import graph (tests,
 * dev, the idle app). When the six vars are absent, {@link firebaseEnabled} is
 * false, the room UI is hidden, and firebase is never loaded.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True only when the minimum required config is present. */
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);
