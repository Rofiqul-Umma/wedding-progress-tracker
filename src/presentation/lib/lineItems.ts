import type { VendorItem } from '@domain/entities/types';
import { uid } from '@application/use-cases/id';

/**
 * Vendor quote line items travel through the form layer as a string, because
 * `FormValues` is `Record<string, string>` and a repeatable sub-list has no
 * place in it. Same shape as `checklist.ts` for seserahan contents: one
 * structured value encoded into a single field. Every direction is total —
 * malformed input yields an empty list rather than throwing into a render.
 */

/** Encode line items for storage in a form field. */
export function serializeLineItems(items: VendorItem[] | undefined): string {
  if (!items?.length) return '';
  return JSON.stringify(items);
}

/**
 * Decode for editing, keeping rows whose name is still blank. A row the user
 * just added has no name yet; dropping it here would delete it as fast as it
 * appeared.
 */
export function parseLineItemsDraft(raw: string | null | undefined): VendorItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === 'object',
      )
      .filter((entry) => typeof entry.name === 'string')
      .map((entry) => ({
        id: typeof entry.id === 'string' && entry.id ? entry.id : uid(),
        name: String(entry.name),
        qty: Math.max(1, Math.round(Number(entry.qty)) || 1),
        price: Math.max(0, Number(entry.price) || 0),
      }));
  } catch {
    return [];
  }
}

/** Decode for saving: trimmed, with unnamed rows discarded. */
export function parseLineItems(raw: string | null | undefined): VendorItem[] {
  return parseLineItemsDraft(raw)
    .map((entry) => ({ ...entry, name: entry.name.trim() }))
    .filter((entry) => entry.name !== '');
}

/** What the lines add up to: unit price × quantity, summed. */
export function lineItemsSum(items: VendorItem[]): number {
  return items.reduce((a, i) => a + (+i.price || 0) * Math.max(1, +i.qty || 1), 0);
}
