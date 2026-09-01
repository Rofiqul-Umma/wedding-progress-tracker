import type { PlanState } from '@domain/entities/types';

/**
 * Trigger a browser download of `content` as `filename`. Uses the Blob +
 * temporary anchor idiom and cleans up the object URL afterwards.
 */
export function downloadBlob(
  content: BlobPart,
  filename: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** A filesystem-safe `p1-p2` slug for backup/report filenames. */
export function planFileSlug(state: PlanState): string {
  return `${state.wedding.p1 || 'wedding'}-${state.wedding.p2 || 'plan'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
