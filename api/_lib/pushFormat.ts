import { getNotifications, type Notification } from '../../src/domain/services/schedule';
import { formatMoney } from '../../src/infrastructure/format/money';
import type { BudgetItem, Lang, Task } from '../../src/domain/entities/types';

/**
 * Construct a Date whose local calendar year/month/day matches the subscriber's
 * current calendar date (given `Date.prototype.getTimezoneOffset()` minutes).
 */
export function subscriberLocalDate(tzOffsetMin: number, now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() - tzOffsetMin * 60_000);
  return new Date(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    12,
    0,
    0,
  );
}

function formatSingleMessage(
  msg: Notification['message'],
  lang: Lang,
  currency: string,
): string {
  if (msg.key === 'notif.overdue') {
    const count = msg.count ?? 1;
    if (lang === 'id') return `terlambat ${count} hari`;
    return count === 1 ? '1 day overdue' : `${count} days overdue`;
  }
  if (msg.key === 'notif.dueToday') {
    return lang === 'id' ? 'Jatuh tempo hari ini' : 'Due today';
  }
  if (msg.key === 'notif.dueIn') {
    const count = msg.count ?? 1;
    if (lang === 'id') return `Jatuh tempo dalam ${count} hari`;
    return count === 1 ? 'Due in 1 day' : `Due in ${count} days`;
  }
  if (msg.key === 'notif.outstanding') {
    const amount = formatMoney(msg.amount ?? 0, currency, lang);
    return lang === 'id'
      ? `Pembayaran ${amount} tertunggak`
      : `${amount} payment outstanding`;
  }
  return '';
}

export interface FormattedPushContent {
  title: string;
  body: string;
  page: 'tasks' | 'budget';
}

/** Build a localized daily reminder push notification from a plan's tasks and budget. */
export function buildReminderPush(
  state: { tasks: Task[]; budget: BudgetItem[] },
  lang: Lang,
  currency: string,
  tzOffsetMin: number,
  now: Date = new Date(),
): FormattedPushContent | null {
  const list = getNotifications(state, subscriberLocalDate(tzOffsetMin, now));
  if (list.length === 0) return null;

  const first = list[0];
  const firstDetail = formatSingleMessage(first.message, lang, currency);
  const remaining = list.length - 1;

  const title =
    lang === 'id'
      ? `Evermore · ${list.length} pengingat rencana pernikahan`
      : `Evermore · ${list.length} wedding plan reminder${list.length === 1 ? '' : 's'}`;

  const moreSuffix =
    remaining > 0
      ? lang === 'id'
        ? ` (+${remaining} lainnya)`
        : ` (+${remaining} more)`
      : '';

  return {
    title,
    body: `${first.title} — ${firstDetail}${moreSuffix}`,
    page: first.page,
  };
}

const COLLECTION_LABELS: Record<string, { en: string; id: string }> = {
  tasks: { en: 'Tasks', id: 'Tugas' },
  budget: { en: 'Budget', id: 'Anggaran' },
  vendors: { en: 'Vendors', id: 'Vendor' },
  shopping: { en: 'Shopping', id: 'Belanja' },
  seserahan: { en: 'Gift Trays', id: 'Seserahan' },
  contacts: { en: 'Contacts', id: 'Kontak' },
  guests: { en: 'Guest List', id: 'Daftar Tamu' },
  plan: { en: 'Wedding Plan', id: 'Rencana Pernikahan' },
};

export interface RoomEventInput {
  actorName: string;
  collection: string;
  itemTitle: string;
  page: string;
}

/** Build a localized push notification for a real-time collaborative room update. */
export function buildRoomEventPush(
  event: RoomEventInput,
  lang: Lang,
): { title: string; body: string } {
  const actor = event.actorName.trim() || (lang === 'id' ? 'Pasangan' : 'Partner');
  const section =
    COLLECTION_LABELS[event.collection]?.[lang] ??
    COLLECTION_LABELS.plan[lang];

  const title =
    lang === 'id'
      ? `${actor} memperbarui ${section}`
      : `${actor} updated ${section}`;

  const body =
    event.itemTitle.trim() ||
    (lang === 'id'
      ? 'Ketuk untuk melihat perubahan terbaru di ruang bersama.'
      : 'Tap to view the latest changes in your shared room.');

  return { title, body };
}

/** Minimal Node-style request/response shape for Vercel Node runtime compatibility. */
export interface VercelNodeReq {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelNodeRes {
  status(code: number): VercelNodeRes;
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

/** Adapt a standard Web `Request => Promise<Response>` handler to both Web and Node Vercel runtimes. */
export function createDualHandler(webHandler: (req: Request) => Promise<Response>) {
  return async function handler(
    reqOrWeb: Request | VercelNodeReq,
    maybeRes?: VercelNodeRes,
  ): Promise<Response | void> {
    if (typeof Request !== 'undefined' && reqOrWeb instanceof Request && !maybeRes) {
      return webHandler(reqOrWeb);
    }
    const nodeReq = reqOrWeb as VercelNodeReq;
    const headers = new Headers();
    for (const [k, v] of Object.entries(nodeReq.headers ?? {})) {
      if (typeof v === 'string') headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(', '));
    }
    const method = nodeReq.method ?? 'GET';
    const hasBody = method !== 'GET' && method !== 'HEAD' && nodeReq.body != null;
    const bodyStr =
      typeof nodeReq.body === 'string'
        ? nodeReq.body
        : hasBody
          ? JSON.stringify(nodeReq.body)
          : undefined;

    const webReq = new Request(`https://localhost${nodeReq.url ?? '/'}`, {
      method,
      headers,
      body: bodyStr,
    });

    const webRes = await webHandler(webReq);
    if (maybeRes && typeof maybeRes.status === 'function') {
      webRes.headers.forEach((value, key) => maybeRes.setHeader(key, value));
      const text = await webRes.text();
      maybeRes.status(webRes.status).send(text);
      return;
    }
    return webRes;
  };
}
