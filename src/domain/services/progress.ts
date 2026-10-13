import type {
  Guest,
  SeserahanItem,
  ShoppingItem,
  Task,
  Vendor,
} from '@domain/entities/types';
import type { RsvpStatus, SeserahanStatus } from '@domain/value-objects/status';

/* ---- Tasks ---- */
export function tasksDone(tasks: Task[]): number {
  return tasks.filter((t) => t.done).length;
}
export function openTasks(tasks: Task[]): number {
  return tasks.filter((t) => !t.done).length;
}
export function taskPct(tasks: Task[]): number {
  return tasks.length ? Math.round((tasksDone(tasks) / tasks.length) * 100) : 0;
}

/* ---- Seserahan ---- */

/** How many of a tray's contents are ready, or null when it is not a bundle. */
export function contentsProgress(
  item: SeserahanItem,
): { done: number; total: number } | null {
  const contents = item.contents ?? [];
  if (!contents.length) return null;
  return { done: contents.filter((c) => c.done).length, total: contents.length };
}

/**
 * The status to display and count. A bundle derives it from its checklist, so
 * the chip can never contradict the items inside; a plain tray keeps the
 * hand-set value it cycles through on click.
 */
export function effectiveSeserahanStatus(item: SeserahanItem): SeserahanStatus {
  const progress = contentsProgress(item);
  if (!progress) return item.status;
  if (progress.done === progress.total) return 'finished';
  return progress.done === 0 ? 'pending' : 'onProgress';
}

export function sesDone(items: SeserahanItem[]): number {
  return items.filter((i) => effectiveSeserahanStatus(i) === 'finished').length;
}
export function sesOpen(items: SeserahanItem[]): number {
  return items.filter((i) => effectiveSeserahanStatus(i) !== 'finished').length;
}
export function sesPct(items: SeserahanItem[]): number {
  return items.length ? Math.round((sesDone(items) / items.length) * 100) : 0;
}

/* ---- Shopping ---- */
export function shopBought(items: ShoppingItem[]): number {
  return items.filter((i) => i.status === 'purchased').length;
}
export function shopPct(items: ShoppingItem[]): number {
  return items.length ? Math.round((shopBought(items) / items.length) * 100) : 0;
}

/* ---- Vendors ---- */
/** Vendors that are past the inquiry stage (booked or paid). */
export function vendorsBooked(vendors: Vendor[]): number {
  return vendors.filter((v) => v.status !== 'inquiry').length;
}
/** Number of distinct vendor categories. */
export function vendorCategories(vendors: Vendor[]): number {
  return new Set(vendors.map((v) => v.category)).size;
}

/* ---- Guests ---- */
export function guestsTotalPax(guests: Guest[]): number {
  return guests.reduce((sum, g) => sum + (g.pax || 1), 0);
}
export function attendingPax(guests: Guest[]): number {
  return guests
    .filter((g) => g.rsvp === 'attending')
    .reduce((sum, g) => sum + (g.pax || 1), 0);
}
export function pendingPax(guests: Guest[]): number {
  return guests
    .filter((g) => g.rsvp === 'pending')
    .reduce((sum, g) => sum + (g.pax || 1), 0);
}
export function declinedPax(guests: Guest[]): number {
  return guests
    .filter((g) => g.rsvp === 'declined')
    .reduce((sum, g) => sum + (g.pax || 1), 0);
}
export function guestsCountByRsvp(
  guests: Guest[],
): Record<RsvpStatus, number> {
  return {
    pending: guests.filter((g) => g.rsvp === 'pending').length,
    attending: guests.filter((g) => g.rsvp === 'attending').length,
    declined: guests.filter((g) => g.rsvp === 'declined').length,
  };
}
export function guestsAttendingCount(guests: Guest[]): number {
  return guests.filter((g) => g.rsvp === 'attending').length;
}
export function guestsPendingCount(guests: Guest[]): number {
  return guests.filter((g) => g.rsvp === 'pending').length;
}
export function guestsDeclinedCount(guests: Guest[]): number {
  return guests.filter((g) => g.rsvp === 'declined').length;
}
