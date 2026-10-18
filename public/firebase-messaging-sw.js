/* eslint-disable no-undef */
/**
 * Service Worker for Firebase Cloud Messaging (Web Push).
 *
 * Registered at `/firebase-cloud-messaging-push-scope` so it coexists cleanly
 * alongside VitePWA's root Workbox service worker (`/sw.js`).
 * Speaks the @firebase/messaging window postMessage protocol (`FCM_MSG` /
 * `isFirebaseMessaging`) without requiring external CDN scripts or hardcoded keys.
 */

const FCM_MSG = 'FCM_MSG';

function parsePayload(event) {
  if (!event.data) return null;
  try {
    return event.data.json();
  } catch {
    return null;
  }
}

async function getWindowClients() {
  return self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
}

function hasVisibleClient(clientList) {
  return clientList.some(
    (client) =>
      client.visibilityState === 'visible' &&
      !client.url.startsWith('chrome-extension://'),
  );
}

self.addEventListener('push', (event) => {
  const internalPayload = parsePayload(event);
  if (!internalPayload) return;

  event.waitUntil(
    (async () => {
      const clientList = await getWindowClients();
      if (hasVisibleClient(clientList)) {
        const message = {
          ...internalPayload,
          isFirebaseMessaging: true,
          messageType: 'push-received',
        };
        for (const client of clientList) {
          client.postMessage(message);
        }
        return;
      }

      const notification = internalPayload.notification || {};
      const data = internalPayload.data || {};
      const title = notification.title || data.title || 'Evermore';
      const options = {
        body: notification.body || data.body || '',
        icon: notification.icon || '/icon.svg',
        badge: notification.badge || '/icon.svg',
        tag: notification.tag || data.tag || 'evermore-push',
        data: {
          ...data,
          [FCM_MSG]: internalPayload,
        },
      };

      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawData = event.notification.data || {};
  const internalPayload = rawData[FCM_MSG] || {};
  const data = internalPayload.data || rawData;
  const page = typeof data.page === 'string' ? data.page : '';
  const targetPath =
    data.url ||
    internalPayload.fcmOptions?.link ||
    (page ? `/?page=${encodeURIComponent(page)}` : '/');

  event.waitUntil(
    (async () => {
      const targetUrl = new URL(targetPath, self.location.origin);
      if (targetUrl.origin !== self.location.origin) return;

      const clientList = await getWindowClients();
      for (const client of clientList) {
        const clientUrl = new URL(client.url, self.location.origin);
        if (clientUrl.origin === self.location.origin) {
          await client.focus();
          client.postMessage({
            ...internalPayload,
            type: 'evermore:navigate',
            page: page || undefined,
            isFirebaseMessaging: true,
            messageType: 'notification-clicked',
          });
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl.href);
      }
    })(),
  );
});
