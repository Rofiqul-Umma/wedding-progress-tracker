import type {
  SeserahanItem,
  ShoppingItem,
  Task,
  Vendor,
} from '@domain/entities/types';
import type { SeserahanStatus } from '@domain/value-objects/status';

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
