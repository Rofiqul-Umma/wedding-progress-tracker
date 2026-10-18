import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { pushEnabled } from '@infrastructure/firebase/env';
import { getNotifications } from '@domain/services/schedule';
import { usePlan } from '@presentation/state/PlanStore';
import { useAccount } from '@presentation/state/AccountStore';
import { useRoom } from '@presentation/state/RoomStore';
import { useNav, type PageId } from '@presentation/state/NavStore';
import { useToast } from '@presentation/hooks/useToast';
import { useFormat } from '@presentation/hooks/useFormat';

export type PushStatus = 'idle' | 'enabling' | 'enabled' | 'denied' | 'error';

export interface PushContextValue {
  /** Whether the current browser supports Web Notifications. */
  supported: boolean;
  /** Whether Firebase Cloud Messaging (VAPID + project config) is configured. */
  fcmConfigured: boolean;
  status: PushStatus;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
}

const PushContext = createContext<PushContextValue | null>(null);

const PUSH_PREF_KEY = 'evermore.v2.pushEnabled';
const PUSH_TOKEN_KEY = 'evermore.v2.pushToken';
const LOCAL_NOTIF_DATE_KEY = 'evermore.v2.lastLocalPushDate';

const VALID_PAGES = new Set<PageId>([
  'dashboard',
  'vendors',
  'budget',
  'tasks',
  'shopping',
  'seserahan',
  'contacts',
  'guests',
  'reports',
]);

function isPageId(value: unknown): value is PageId {
  return typeof value === 'string' && VALID_PAGES.has(value as PageId);
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in restricted webviews.
  }
}

function browserSupportsNotification(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function initialStatus(): PushStatus {
  if (!browserSupportsNotification()) return 'idle';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted' && readStorage(PUSH_PREF_KEY) === '1') {
    return 'enabled';
  }
  return 'idle';
}

export function PushProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { state } = usePlan();
  const account = useAccount();
  const room = useRoom();
  const { go } = useNav();
  const toast = useToast();
  const { money } = useFormat();

  const [supported] = useState<boolean>(browserSupportsNotification);
  const [status, setStatus] = useState<PushStatus>(initialStatus);
  const [token, setToken] = useState<string | null>(() => readStorage(PUSH_TOKEN_KEY));

  const accountUid = account.status === 'connected' ? account.user?.uid ?? null : null;
  const activeRoomId = room.status === 'connected' ? room.roomId : null;
  const prevRoomIdRef = useRef<string | null>(null);

  // Refresh FCM token on cold load if the user previously enabled push notifications.
  useEffect(() => {
    if (status !== 'enabled' || !pushEnabled) return;
    let alive = true;
    void import('@infrastructure/firebase/messaging')
      .then(({ requestPushToken }) => requestPushToken())
      .then(({ permission, token: nextToken }) => {
        if (!alive) return;
        if (permission === 'denied') {
          setStatus('denied');
          writeStorage(PUSH_PREF_KEY, null);
          writeStorage(PUSH_TOKEN_KEY, null);
          return;
        }
        if (nextToken) {
          setToken(nextToken);
          writeStorage(PUSH_TOKEN_KEY, nextToken);
        }
      })
      .catch((err) => {
        console.warn('[push] Token refresh skipped:', err);
      });
    return () => {
      alive = false;
    };
  }, [status]);

  // Sync the active FCM token + locale/currency metadata to Firestore whenever targets change.
  useEffect(() => {
    if (status !== 'enabled' || !token || !pushEnabled) return;
    if (!accountUid && !activeRoomId) return;

    void import('@infrastructure/firebase/messaging')
      .then(({ syncPushTokenToFirestore }) =>
        syncPushTokenToFirestore(
          token,
          {
            lang: state.settings.lang,
            currency: state.settings.currency,
          },
          {
            accountUid,
            roomId: activeRoomId,
          },
        ),
      )
      .catch((err) => {
        console.warn('[push] Failed to sync token to Firestore:', err);
      });
  }, [
    accountUid,
    activeRoomId,
    state.settings.currency,
    state.settings.lang,
    status,
    token,
  ]);

  // Clean up room push token subscription when the user leaves a room.
  useEffect(() => {
    const prevRoomId = prevRoomIdRef.current;
    prevRoomIdRef.current = activeRoomId;
    if (prevRoomId && !activeRoomId && pushEnabled) {
      void import('@infrastructure/firebase/messaging')
        .then(({ unregisterPushToken }) =>
          unregisterPushToken(null, { roomId: prevRoomId }, false),
        )
        .catch(() => {});
    }
  }, [activeRoomId]);

  // Subscribe to foreground FCM messages and display an in-app toast.
  useEffect(() => {
    if (status !== 'enabled' || !pushEnabled) return;
    let unsubscribe: (() => void) | undefined;
    let alive = true;

    void import('@infrastructure/firebase/messaging')
      .then(({ subscribeForegroundMessages }) =>
        subscribeForegroundMessages((payload) => {
          const title = payload.notification?.title ?? payload.data?.title ?? '';
          const body = payload.notification?.body ?? payload.data?.body ?? '';
          const text = [title, body].filter(Boolean).join(' — ');
          if (text) toast(text);
        }),
      )
      .then((unsub) => {
        if (!alive) unsub();
        else unsubscribe = unsub;
      })
      .catch(() => {});

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [status, toast]);

  // Handle Service Worker notification click messages and URL `?page=` deep links.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('page');
    if (isPageId(initialPage)) {
      go(initialPage);
      params.delete('page');
      const cleanQuery = params.toString();
      const nextUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`;
      window.history.replaceState(window.history.state, '', nextUrl);
    }

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    function onSwMessage(event: MessageEvent) {
      const data = event.data as Record<string, unknown> | null;
      if (!data) return;
      const targetPage =
        data.page ??
        (data.data && typeof data.data === 'object'
          ? (data.data as Record<string, unknown>).page
          : undefined);
      if (isPageId(targetPage)) {
        go(targetPage);
      }
    }

    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [go]);

  // Local daily browser notification fallback when notifications are enabled.
  useEffect(() => {
    if (status !== 'enabled' || !supported || Notification.permission !== 'granted') return;
    const todayIso = new Date().toISOString().slice(0, 10);
    if (readStorage(LOCAL_NOTIF_DATE_KEY) === todayIso) return;

    const list = getNotifications(state);
    if (list.length === 0) return;

    writeStorage(LOCAL_NOTIF_DATE_KEY, todayIso);
    const first = list[0];
    const msg =
      first.message.amount != null
        ? t(first.message.key, { amount: money(first.message.amount) })
        : first.message.count != null
          ? t(first.message.key, { count: first.message.count })
          : t(first.message.key);

    try {
      const n = new Notification(`${first.title}`, {
        body: msg,
        icon: '/icon.svg',
        tag: `evermore-local-${todayIso}`,
      });
      n.onclick = () => {
        window.focus();
        go(first.page);
        n.close();
      };
    } catch {
      // Some mobile browsers only allow showNotification on a ServiceWorkerRegistration.
    }
  }, [go, money, state, status, supported, t]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    setStatus('enabling');
    try {
      if (!pushEnabled) {
        const perm =
          Notification.permission === 'granted'
            ? 'granted'
            : await Notification.requestPermission();
        if (perm !== 'granted') {
          setStatus(perm === 'denied' ? 'denied' : 'idle');
          return false;
        }
        writeStorage(PUSH_PREF_KEY, '1');
        setStatus('enabled');
        toast(t('notif.pushEnabledToast'));
        return true;
      }

      const { requestPushToken, syncPushTokenToFirestore } = await import(
        '@infrastructure/firebase/messaging'
      );
      const { permission, token: fcmToken } = await requestPushToken();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return false;
      }

      writeStorage(PUSH_PREF_KEY, '1');
      if (fcmToken) {
        setToken(fcmToken);
        writeStorage(PUSH_TOKEN_KEY, fcmToken);
        if (accountUid || activeRoomId) {
          await syncPushTokenToFirestore(
            fcmToken,
            {
              lang: state.settings.lang,
              currency: state.settings.currency,
            },
            {
              accountUid,
              roomId: activeRoomId,
            },
          ).catch((err) => console.warn('[push] Initial Firestore token sync failed:', err));
        }
      }

      setStatus('enabled');
      toast(t('notif.pushEnabledToast'));
      return true;
    } catch (err) {
      console.error('[push] Enable failed:', err);
      setStatus('error');
      return false;
    }
  }, [
    accountUid,
    activeRoomId,
    state.settings.currency,
    state.settings.lang,
    supported,
    t,
    toast,
  ]);

  const disable = useCallback(async (): Promise<void> => {
    const currentToken = token;
    writeStorage(PUSH_PREF_KEY, null);
    writeStorage(PUSH_TOKEN_KEY, null);
    setToken(null);
    setStatus('idle');

    if (pushEnabled) {
      try {
        const { unregisterPushToken } = await import('@infrastructure/firebase/messaging');
        await unregisterPushToken(currentToken, {
          accountUid,
          roomId: activeRoomId,
        });
      } catch (err) {
        console.warn('[push] Disable cleanup warning:', err);
      }
    }
    toast(t('notif.pushDisabledToast'));
  }, [accountUid, activeRoomId, t, toast, token]);

  return (
    <PushContext.Provider
      value={{
        supported,
        fcmConfigured: pushEnabled,
        status,
        enable,
        disable,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePush(): PushContextValue {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error('usePush must be used within a PushProvider');
  return ctx;
}
