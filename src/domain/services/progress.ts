import type {
  SeserahanItem,
  ShoppingItem,
  Task,
  Vendor,
} from '@domain/entities/types';

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
export function sesDone(items: SeserahanItem[]): number {
  return items.filter((i) => i.status === 'finished').length;
}
export function sesOpen(items: SeserahanItem[]): number {
  return items.filter((i) => i.status !== 'finished').length;
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
