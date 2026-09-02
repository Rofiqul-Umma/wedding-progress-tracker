import type {
  PlanState,
  PlanCollectionKey,
  Settings,
  Wedding,
} from '@domain/entities/types';

/** The plan arrays that sync as per-item documents in any remote plan space. */
export const PLAN_COLLECTIONS: PlanCollectionKey[] = [
  'vendors',
  'budget',
  'tasks',
  'seserahan',
  'shopping',
  'contacts',
];

/** Backward-compatible room name; rooms and personal accounts sync the same data. */
export const ROOM_COLLECTIONS = PLAN_COLLECTIONS;

/** The upserts and deletes for a single collection between two plan states. */
export interface CollectionDelta {
  /** Full entity objects to write (docId = `id`); covers both new and changed. */
  upserts: ({ id: string } & Record<string, unknown>)[];
  /** Ids present in `prev` but absent in `next`. */
  deletes: string[];
}

/** The minimal set of Firestore changes between two whole plan states. */
export interface PlanDiff {
  collections: Record<PlanCollectionKey, CollectionDelta>;
  /** Present only when the settings singleton changed. */
  settings?: Settings;
  /** Present only when the wedding singleton changed. */
  wedding?: Wedding;
  /** True when nothing changed — callers skip all writes. */
  isEmpty: boolean;
}

function diffCollection<T extends { id: string }>(
  prev: T[],
  next: T[],
): CollectionDelta {
  const prevById = new Map(prev.map((i) => [i.id, i]));
  const nextIds = new Set<string>();
  const upserts: ({ id: string } & Record<string, unknown>)[] = [];

  for (const item of next) {
    nextIds.add(item.id);
    const before = prevById.get(item.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(item)) {
      upserts.push(item as unknown as { id: string } & Record<string, unknown>);
    }
  }

  const deletes: string[] = [];
  for (const item of prev) {
    if (!nextIds.has(item.id)) deletes.push(item.id);
  }

  return { upserts, deletes };
}

/**
 * Compute the minimal per-item writes/deletes to turn `prev` into `next`.
 * Pure and side-effect free: the room layer translates the result into batched
 * Firestore operations. Concurrent edits to different items produce disjoint
 * diffs, so they merge without clobbering each other.
 */
export function diffPlan(prev: PlanState, next: PlanState): PlanDiff {
  const collections = {} as Record<PlanCollectionKey, CollectionDelta>;
  let isEmpty = true;

  for (const key of ROOM_COLLECTIONS) {
    // Each `prev[key]`/`next[key]` is a distinct entity array; the diff only
    // relies on the shared `id`, so widen to that common shape.
    const delta = diffCollection(
      prev[key] as { id: string }[],
      next[key] as { id: string }[],
    );
    collections[key] = delta;
    if (delta.upserts.length || delta.deletes.length) isEmpty = false;
  }

  const diff: PlanDiff = { collections, isEmpty };

  if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) {
    diff.settings = next.settings;
    isEmpty = false;
  }
  if (JSON.stringify(prev.wedding) !== JSON.stringify(next.wedding)) {
    diff.wedding = next.wedding;
    isEmpty = false;
  }

  diff.isEmpty = isEmpty;
  return diff;
}
