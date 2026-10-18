import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from 'firebase/messaging';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { app, db, getCurrentIdToken, getCurrentUid, signInAnon } from './config';
import { pushEnabled, vapidKey } from './env';
import type { Lang } from '@domain/entities/types';
import type { PageId } from '@presentation/state/NavStore';

const SW_URL = '/firebase-messaging-sw.js';
const SW_SCOPE = '/firebase-cloud-messaging-push-scope';

let messagingInstance: Messaging | null = null;

async function resolveMessaging(): Promise<Messaging | null> {
  if (!pushEnabled) return null;
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/** Deterministic, Firestore-safe document ID derived from an FCM token. */
export function tokenDocId(token: string): string {
  let h1 = 0xdeadbeef ^ token.length;
  let h2 = 0x41c6ce57 ^ token.length;
  for (let i = 0; i < token.length; i++) {
    const ch = token.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `tok_${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

async function getPushServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
  } catch (err) {
    console.warn('[push] Could not register dedicated FCM service worker, falling back', err);
    return navigator.serviceWorker.ready;
  }
}

/** Check whether the current browser supports Web Push / FCM. */
export async function checkPushSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (!pushEnabled) return true; // Local browser notifications still work when Firebase push is unconfigured.
  return isSupported().catch(() => false);
}

/** Request browser permission and obtain an FCM registration token (when FCM is configured). */
export async function requestPushToken(): Promise<{
  permission: NotificationPermission;
  token: string | null;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { permission: 'denied', token: null };
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

  if (permission !== 'granted') {
    return { permission, token: null };
  }

  const messaging = await resolveMessaging();
  if (!messaging || !vapidKey) {
    return { permission, token: null };
  }

  const swReg = await getPushServiceWorker();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: swReg,
  });

  return { permission, token: token || null };
}

export interface PushSubscriberMeta {
  lang: Lang;
  currency: string;
  tzOffsetMin?: number;
}

/** Save the current device's FCM token to a user's personal plan and/or shared room in Firestore. */
export async function syncPushTokenToFirestore(
  token: string,
  meta: PushSubscriberMeta,
  targets: { accountUid?: string | null; roomId?: string | null },
): Promise<void> {
  const payload = {
    token,
    lang: meta.lang === 'id' ? 'id' : 'en',
    currency: (meta.currency || 'USD').slice(0, 8),
    tzOffsetMin: Math.max(-840, Math.min(840, Math.round(meta.tzOffsetMin ?? new Date().getTimezoneOffset()))),
    updatedAt: serverTimestamp(),
  };

  const writes: Promise<void>[] = [];

  if (targets.accountUid) {
    const ref = doc(db, 'users', targets.accountUid, 'pushTokens', tokenDocId(token));
    writes.push(setDoc(ref, payload));
  }

  if (targets.roomId) {
    const uid = getCurrentUid() ?? (await signInAnon());
    const ref = doc(db, 'rooms', targets.roomId, 'pushTokens', uid);
    writes.push(setDoc(ref, payload));
  }

  await Promise.all(writes);
}

/** Remove the device's FCM token from Firestore and revoke it in FCM. */
export async function unregisterPushToken(
  token: string | null,
  targets: { accountUid?: string | null; roomId?: string | null },
  revokeFcmToken = true,
): Promise<void> {
  const deletes: Promise<void>[] = [];

  if (token && targets.accountUid) {
    const ref = doc(db, 'users', targets.accountUid, 'pushTokens', tokenDocId(token));
    deletes.push(deleteDoc(ref).catch(() => {}));
  }

  if (targets.roomId) {
    const uid = getCurrentUid();
    if (uid) {
      const ref = doc(db, 'rooms', targets.roomId, 'pushTokens', uid);
      deletes.push(deleteDoc(ref).catch(() => {}));
    }
  }

  if (revokeFcmToken) {
    const messaging = await resolveMessaging();
    if (messaging) {
      deletes.push(
        deleteToken(messaging)
          .then(() => {})
          .catch(() => {}),
      );
    }
  }

  await Promise.all(deletes);
}

/** Subscribe to foreground FCM messages while the app tab is visible. */
export async function subscribeForegroundMessages(
  handler: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await resolveMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}

export interface RoomPushEvent {
  roomId: string;
  actorName: string;
  page: PageId;
  itemTitle: string;
  collection: string;
}

/** Trigger the Vercel API endpoint to notify other room members of a collaborative edit. */
export async function sendRoomPushNotification(event: RoomPushEvent): Promise<void> {
  const idToken = await getCurrentIdToken();
  const actorUid = getCurrentUid();
  if (!idToken || !actorUid) return;

  await fetch('/api/room-notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      roomId: event.roomId,
      actorUid,
      actorName: event.actorName,
      page: event.page,
      itemTitle: event.itemTitle,
      collection: event.collection,
    }),
  }).catch((err) => {
    console.warn('[push] Room notification dispatch skipped:', err);
  });
}
