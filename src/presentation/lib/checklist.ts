import type { SeserahanContent } from '@domain/entities/types';
import { uid } from '@application/use-cases/id';

/**
 * Seserahan bundle contents travel through the form layer as a string, because
 * `FormValues` is `Record<string, string>` and a repeatable sub-list has no
 * place in it. This mirrors how attachments are serialized in `attachments.ts`:
 * one structured value encoded into a single field. Every direction is total —
 * malformed input yields an empty list rather than throwing into a render.
 */

/** Encode bundle contents for storage in a form field. */
export function serializeContents(items: SeserahanContent[] | undefined): string {
  if (!items?.length) return '';
  return JSON.stringify(items);
}

/**
 * Decode for editing, keeping rows whose name is still blank. A row the user
 * just added has no name yet; dropping it here would delete it as fast as it
 * appeared.
 */
export function parseContentsDraft(raw: string | null | undefined): SeserahanContent[] {
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
        done: entry.done === true,
      }));
  } catch {
    return [];
  }
}

/** Decode for saving: trimmed, with unnamed rows discarded. */
export function parseContents(raw: string | null | undefined): SeserahanContent[] {
  return parseContentsDraft(raw)
    .map((entry) => ({ ...entry, name: entry.name.trim() }))
    .filter((entry) => entry.name !== '');
}
