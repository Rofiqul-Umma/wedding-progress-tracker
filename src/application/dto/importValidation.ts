import type { PlanState } from '@domain/entities/types';

const ARRAY_KEYS = [
  'vendors',
  'budget',
  'tasks',
  'seserahan',
  'shopping',
  'contacts',
] as const;

/**
 * Guard a parsed backup before it is migrated into app state. Mirrors the
 * legacy import check: must be an object with a non-null `wedding` object, and
 * any present collection key must be an array.
 */
export function isValidImport(data: unknown): data is Partial<PlanState> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.wedding !== 'object' || d.wedding === null) return false;
  for (const k of ARRAY_KEYS) {
    if (k in d && !Array.isArray(d[k])) return false;
  }
  return true;
}
