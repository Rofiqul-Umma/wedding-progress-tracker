import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  documentId,
} from 'firebase/firestore';
import { db, signInAnon } from './config';
import { migrate } from '@infrastructure/persistence/migrate';
import { diffPlan, ROOM_COLLECTIONS, type PlanDiff } from '@application/use-cases/roomDiff';
import type { PlanState, PlanCollectionKey } from '@domain/entities/types';
import type {
  RoomRepository,
  RoomConnection,
  RoomHandlers,
  Me,
  Peer,
} from '@domain/repositories/RoomRepository';

// The firebase SDK is `any` here (loaded lazily; typed by the real package once
// installed). These aliases give the batch/ref locals a name without the `any`
// keyword, and the structural snapshot types cover only the fields we read.
type Batch = ReturnType<typeof writeBatch>;
type Ref = ReturnType<typeof doc>;
interface DocSnap {
  id: string;
  exists(): boolean;
  data(): Record<string, unknown> | undefined;
}
interface QuerySnap {
  docs: DocSnap[];
}

/** Firestore batches accept at most this many operations. */
const MAX_BATCH_OPS = 500;
/** Route items above this serialized size to individual (non-batched) writes. */
const SAFE_DOC_BYTES = 900 * 1024;
/** Firestore's hard per-document limit (~1 MiB) with a small safety margin. */
const HARD_DOC_BYTES = 1_040_000;
/** Presence heartbeat interval and staleness window. */
const HEARTBEAT_MS = 20_000;
const STALE_MS = 60_000;

/** The attachment-bearing field per collection (stripped when oversized). */
const ATTACHMENT_FIELD: Partial<Record<PlanCollectionKey, string>> = {
  tasks: 'attachment',
  shopping: 'image',
};

const roomsCol = () => collection(db, 'rooms');
const roomDoc = (roomId: string) => doc(db, 'rooms', roomId);
const itemRef = (roomId: string, coll: string, id: string) =>
  doc(db, 'rooms', roomId, coll, id);

function byteLength(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Translate a {@link PlanDiff} into batched Firestore writes. Normal items ride
 * in ≤500-op batches; oversized attachment items are written individually so one
 * of them can never poison a whole batch, and are stripped (with a notice) if
 * they exceed the hard per-doc limit.
 */
async function applyDiff(
  roomId: string,
  diff: PlanDiff,
  onTooLarge?: () => void,
): Promise<void> {
  const batchOps: Array<(b: Batch) => void> = [];
  const bigWrites: Array<() => Promise<void>> = [];

  for (const coll of ROOM_COLLECTIONS) {
    const delta = diff.collections[coll];
    for (const item of delta.upserts) {
      const ref = itemRef(roomId, coll, item.id);
      if (byteLength(item) <= SAFE_DOC_BYTES) {
        batchOps.push((b) => b.set(ref, item));
      } else {
        bigWrites.push(() => writeBigItem(ref, item, coll, onTooLarge));
      }
    }
    for (const id of delta.deletes) {
      const ref = itemRef(roomId, coll, id);
      batchOps.push((b) => b.delete(ref));
    }
  }

  if (diff.settings) {
    const s = diff.settings;
    batchOps.push((b) => b.set(roomDoc(roomId), { settings: s }, { merge: true }));
  }
  if (diff.wedding) {
    const w = diff.wedding;
    batchOps.push((b) => b.set(roomDoc(roomId), { wedding: w }, { merge: true }));
  }

  for (const group of chunk(batchOps, MAX_BATCH_OPS)) {
    const batch = writeBatch(db);
    for (const op of group) op(batch);
    await batch.commit();
  }
  for (const write of bigWrites) await write();
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

export class FirestoreRoomRepository implements RoomRepository {
  async create(seed: PlanState): Promise<string> {
    await signInAnon();
    const roomId = doc(roomsCol()).id;
    await runTransaction(db, async (tx: { get(r: Ref): Promise<DocSnap>; set(r: Ref, data: unknown): void }) => {
      const snap = await tx.get(roomDoc(roomId));
      if (snap.exists()) return;
      tx.set(roomDoc(roomId), {
        settings: seed.settings,
        wedding: seed.wedding,
        createdAt: serverTimestamp(),
      });
    });
    await applyDiff(roomId, diffPlan(migrate({}), seed));
    return roomId;
  }

  async exists(roomId: string): Promise<boolean> {
    const snap: DocSnap = await getDoc(roomDoc(roomId));
    return snap.exists();
  }

  async connect(roomId: string, handlers: RoomHandlers, me: Me): Promise<RoomConnection> {
    await signInAnon();

    // Single remote cache: every subscription updates only its own slice, then
    // we re-assemble the whole plan once so partial snapshots never surface.
    const cache: {
      settings?: unknown;
      wedding?: unknown;
      collections: Record<string, unknown[]>;
    } = { collections: {} };
    for (const coll of ROOM_COLLECTIONS) cache.collections[coll] = [];

    let baseline: PlanState | null = null;
    let hydrated = false;
    let docSeen = false;

    const emit = () => {
      // Wait for the room doc so we never assemble default settings/wedding.
      if (!docSeen) return;
      const assembled = migrate({
        settings: cache.settings,
        wedding: cache.wedding,
        ...cache.collections,
      });
      baseline = assembled; // set BEFORE onState so the echo diff is empty
      hydrated = true;
      handlers.onState(assembled);
    };

    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        roomDoc(roomId),
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

    for (const coll of ROOM_COLLECTIONS) {
      const q = query(collection(db, 'rooms', roomId, coll), orderBy(documentId()));
      unsubs.push(
        onSnapshot(
          q,
          (snap: QuerySnap) => {
            cache.collections[coll] = snap.docs.map((d) => d.data() ?? {});
            emit();
          },
          handlers.onError,
        ),
      );
    }

    // Presence: heartbeat + live peer list filtered to recent heartbeats.
    const presenceRef = doc(db, 'rooms', roomId, 'presence', me.clientId);
    const beat = () =>
      void setDoc(
        presenceRef,
        { name: me.name, color: me.color, lastSeen: serverTimestamp() },
        { merge: true },
      ).catch(handlers.onError);
    beat();
    const heartbeat = setInterval(beat, HEARTBEAT_MS);

    unsubs.push(
      onSnapshot(
        collection(db, 'rooms', roomId, 'presence'),
        (snap: QuerySnap) => {
          const now = Date.now();
          const peers: Peer[] = snap.docs
            .map((d) => {
              const data = d.data() ?? {};
              const ts = data.lastSeen as { toMillis?: () => number } | null;
              const lastSeen = ts?.toMillis ? ts.toMillis() : now;
              return {
                clientId: d.id,
                name: typeof data.name === 'string' ? data.name : 'Guest',
                color: typeof data.color === 'string' ? data.color : '#888',
                lastSeen,
              };
            })
            .filter((p) => now - p.lastSeen < STALE_MS);
          handlers.onPeers(peers);
        },
        handlers.onError,
      ),
    );

    const onUnload = () => void deleteDoc(presenceRef);
    window.addEventListener('beforeunload', onUnload);

    const save = (next: PlanState) => {
      if (!hydrated || !baseline) return;
      const diff = diffPlan(baseline, next);
      if (diff.isEmpty) return;
      baseline = next; // advance before the async write to suppress echoes
      void applyDiff(roomId, diff, handlers.onAttachmentTooLarge).catch(handlers.onError);
    };

    const disconnect = () => {
      for (const u of unsubs) u();
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', onUnload);
      void deleteDoc(presenceRef).catch(() => {});
    };

    return { save, disconnect };
  }
}
