import type { BudgetItem, Task, Wedding } from '@domain/entities/types';

/**
 * Whole days from today (local midnight) until an ISO `YYYY-MM-DD` date.
 * Negative = in the past, 0 = today, null = no date.
 *
 * `now` is injectable so the logic stays pure and testable.
 */
export function daysUntil(dateStr: string, now: Date = new Date()): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr + 'T00:00:00');
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - n.getTime()) / 86400000);
}

export type CountdownKind = 'done' | 'none' | 'overdue' | 'today' | 'upcoming';

export interface CountdownNote {
  kind: 'before' | 'onDay' | 'after';
  gap: number;
}

export interface CountdownInfo {
  kind: CountdownKind;
  /** Absolute day count to display (null for done/none). */
  days: number | null;
  /** Whether an upcoming task is within the 14-day "soon" window. */
  soon: boolean;
  /** Bar fill 0–100. */
  urgency: number;
  /** Relationship to the wedding date, when both are known. */
  note: CountdownNote | null;
}

/** Derive the detail-panel countdown descriptor for a task. */
export function taskCountdown(
  task: Task,
  wedding: Wedding,
  now: Date = new Date(),
): CountdownInfo {
  if (task.done) {
    return { kind: 'done', days: null, soon: false, urgency: 100, note: null };
  }
  const dd = task.due ? daysUntil(task.due, now) : null;
  if (dd === null) {
    return { kind: 'none', days: null, soon: false, urgency: 0, note: null };
  }

  const dWed = daysUntil(wedding.date, now);
  let note: CountdownNote | null = null;
  if (dWed !== null) {
    const gap = dWed - dd;
    note = { kind: gap > 0 ? 'before' : gap === 0 ? 'onDay' : 'after', gap };
  }

  if (dd < 0) {
    return { kind: 'overdue', days: Math.abs(dd), soon: false, urgency: 100, note };
  }
  if (dd === 0) {
    return { kind: 'today', days: 0, soon: true, urgency: 100, note };
  }
  const urgency = Math.max(6, Math.min(100, Math.round((1 - dd / 90) * 100)));
  return { kind: 'upcoming', days: dd, soon: dd <= 14, urgency, note };
}

export type NotificationKind = 'bad' | 'warn' | 'info';

export interface Notification {
  kind: NotificationKind;
  icon: string;
  /** Raw entity title (not translated). */
  title: string;
  page: 'tasks' | 'budget';
  sort: number;
  /** i18n message descriptor resolved in the presentation layer. */
  message: { key: string; count?: number; amount?: number };
}

/** Derive the notification list (overdue/soon tasks + outstanding payments). */
export function getNotifications(
  state: { tasks: Task[]; budget: BudgetItem[] },
  now: Date = new Date(),
): Notification[] {
  const out: Notification[] = [];

  for (const t of state.tasks) {
    if (t.done || !t.due) continue;
    const dd = daysUntil(t.due, now);
    if (dd === null) continue;
    if (dd < 0) {
      out.push({
        kind: 'bad',
        icon: 'event_busy',
        title: t.title,
        page: 'tasks',
        sort: dd,
        message: { key: 'notif.overdue', count: Math.abs(dd) },
      });
    } else if (dd <= 14) {
      out.push({
        kind: 'warn',
        icon: 'schedule',
        title: t.title,
        page: 'tasks',
        sort: dd + 0.5,
        message:
          dd === 0
            ? { key: 'notif.dueToday' }
            : { key: 'notif.dueIn', count: dd },
      });
    }
  }

  for (const b of state.budget) {
    if (b.paid || (+b.actual || 0) <= 0) continue;
    out.push({
      kind: 'info',
      icon: 'account_balance_wallet',
      title: b.item,
      page: 'budget',
      sort: 1000,
      message: { key: 'notif.outstanding', amount: b.actual },
    });
  }

  return out.sort((a, b) => a.sort - b.sort);
}
