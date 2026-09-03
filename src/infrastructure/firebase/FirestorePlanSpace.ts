import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  documentId,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import { migrate } from '@infrastructure/persistence/migrate';
import { diffPlan, PLAN_COLLECTIONS, type PlanDiff } from '@application/use-cases/roomDiff';
import type { PlanState, PlanCollectionKey } from '@domain/entities/types';

const MAX_BATCH_OPS = 500;
const SAFE_DOC_BYTES = 900 * 1024;
const HARD_DOC_BYTES = 1_040_000;

const ATTACHMENT_FIELD: Partial<Record<PlanCollectionKey, string>> = {
  tasks: 'attachment',
  shopping: 'image',
  seserahan: 'image',
};

type Batch = ReturnType<typeof writeBatch>;
type Ref = DocumentReference;

interface DocSnap {
  id: string;
  exists(): boolean;
  data(): Record<string, unknown> | undefined;
}

interface QuerySnap {
  docs: DocSnap[];
}

export interface PlanSpacePaths {
  root: Ref;
  collection(key: PlanCollectionKey): CollectionReference;
  item(key: PlanCollectionKey, id: string): Ref;
}

export interface PlanSpaceHandlers {
  onState(state: PlanState): void;
  onError(err: unknown): void;
  onAttachmentTooLarge?(): void;
}

export interface PlanSpaceConnection {
  save(next: PlanState): void;
  disconnect(): void;
}

function byteLength(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function writeBigItem(
  ref: Ref,
  item: { id: string } & Record<string, unknown>,
  coll: PlanCollectionKey,
  onTooLarge?: () => void,
): Promise<void> {
  if (byteLength(item) <= HARD_DOC_BYTES) {
    await setDoc(ref, item);
    return;
  }
  const field = ATTACHMENT_FIELD[coll];
  const stripped = field ? { ...item, [field]: field === 'attachment' ? null : '' } : item;
  await setDoc(ref, stripped);
  onTooLarge?.();
}

/** Translate a plan diff into bounded Firestore writes for any plan-space path. */
export async function applyPlanDiff(
  paths: PlanSpacePaths,
  diff: PlanDiff,
  onTooLarge?: () => void,
): Promise<void> {
  const batchOps: Array<(batch: Batch) => void> = [];
  const bigWrites: Array<() => Promise<void>> = [];

  for (const coll of PLAN_COLLECTIONS) {
    const delta = diff.collections[coll];
    for (const item of delta.upserts) {
      const ref = paths.item(coll, item.id);
      if (byteLength(item) <= SAFE_DOC_BYTES) {
        batchOps.push((batch) => batch.set(ref, item));
      } else {
        bigWrites.push(() => writeBigItem(ref, item, coll, onTooLarge));
      }
    }
    for (const id of delta.deletes) {
      batchOps.push((batch) => batch.delete(paths.item(coll, id)));
    }
  }

  if (diff.settings) {
    batchOps.push((batch) => batch.set(paths.root, { settings: diff.settings }, { merge: true }));
  }
  if (diff.wedding) {
    batchOps.push((batch) => batch.set(paths.root, { wedding: diff.wedding }, { merge: true }));
  }

  for (const group of chunk(batchOps, MAX_BATCH_OPS)) {
    const batch = writeBatch(db);
    for (const operation of group) operation(batch);
    await batch.commit();
  }
  for (const write of bigWrites) await write();
}

export type PlanSpaceStatus = 'missing' | 'pending' | 'ready';

/** Distinguish a missing plan from a claimed but incompletely seeded plan. */
export async function planSpaceStatus(paths: PlanSpacePaths): Promise<PlanSpaceStatus> {
  const snap = await getDoc(paths.root);
  if (!snap.exists()) return 'missing';
  return snap.data()?.initializedAt ? 'ready' : 'pending';
}

export async function planSpaceExists(paths: PlanSpacePaths): Promise<boolean> {
  return (await planSpaceStatus(paths)) !== 'missing';
}

/** Whether first-time seeding completed; used to avoid adopting partial data. */
export async function planSpaceIsReady(paths: PlanSpacePaths): Promise<boolean> {
  return (await planSpaceStatus(paths)) === 'ready';
}

/**
 * Create a root document exactly once, then seed all plan collections. The
 * transaction winner is the only client allowed to seed, so a concurrent first
 * sign-in cannot overwrite another device's just-created plan.
 */
export async function createPlanSpace(
  paths: PlanSpacePaths,
  seed: PlanState,
): Promise<'created' | 'exists'> {
  const created = await runTransaction(db, async (tx) => {
    const snap = await tx.get(paths.root);
    if (snap.exists()) return false;
    tx.set(paths.root, {
      settings: seed.settings,
      wedding: seed.wedding,
      schemaVersion: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  });
  if (!created) return 'exists';
  // `initializedAt` is written last. If seeding fails, the non-ready root remains
  // a claim rather than being mistaken for a complete cloud plan.
  await applyPlanDiff(paths, diffPlan(migrate({}), seed));
  await setDoc(
    paths.root,
    { initializedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
  return 'created';
}

/** Subscribe to and diff-save one complete remote plan space. */
export async function connectPlanSpace(
  paths: PlanSpacePaths,
  handlers: PlanSpaceHandlers,
): Promise<PlanSpaceConnection> {
  const cache: {
    settings?: unknown;
    wedding?: unknown;
    collections: Record<string, unknown[]>;
  } = { collections: {} };
  for (const coll of PLAN_COLLECTIONS) cache.collections[coll] = [];

  let baseline: PlanState | null = null;
  let hydrated = false;
  let docSeen = false;
  const seenCollections = new Set<PlanCollectionKey>();

  const emit = () => {
    if (!docSeen || seenCollections.size !== PLAN_COLLECTIONS.length) return;
    const assembled = migrate({
      settings: cache.settings,
      wedding: cache.wedding,
      ...cache.collections,
    });
    baseline = assembled;
    hydrated = true;
    handlers.onState(assembled);
  };

  const unsubs: Array<() => void> = [];
  unsubs.push(
    onSnapshot(
      paths.root,
      (snap: DocSnap) => {
        const data = snap.data() ?? {};
        cache.settings = data.settings;
        cache.wedding = data.wedding;
        docSeen = true;
        emit();
      },
      handlers.onError,
    ),
  );

  for (const coll of PLAN_COLLECTIONS) {
    const q = query(paths.collection(coll), orderBy(documentId()));
    unsubs.push(
      onSnapshot(
        q,
        (snap: QuerySnap) => {
          cache.collections[coll] = snap.docs.map((entry) => entry.data() ?? {});
          seenCollections.add(coll);
          emit();
        },
        handlers.onError,
      ),
    );
  }

  return {
    save(next) {
      if (!hydrated || !baseline) return;
      const diff = diffPlan(baseline, next);
      if (diff.isEmpty) return;
      baseline = next;
      void applyPlanDiff(paths, diff, handlers.onAttachmentTooLarge).catch(handlers.onError);
    },
    disconnect() {
      for (const unsubscribe of unsubs) unsubscribe();
    },
  };
}

/** Convenience path factory for the private per-user plan tree. */
export function userPlanPaths(uid: string): PlanSpacePaths {
  const root = doc(db, 'users', uid);
  return {
    root,
    collection: (key) => collection(root, key),
    item: (key, id) => doc(root, key, id),
  };
}
