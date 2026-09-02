import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, signInAnon } from './config';
import {
  connectPlanSpace,
  createPlanSpace,
  planSpaceExists,
  type PlanSpacePaths,
} from './FirestorePlanSpace';
import type { PlanState, PlanCollectionKey } from '@domain/entities/types';
import type {
  RoomRepository,
  RoomConnection,
  RoomHandlers,
  Me,
  Peer,
} from '@domain/repositories/RoomRepository';

const HEARTBEAT_MS = 20_000;
const STALE_MS = 60_000;

function roomPaths(roomId: string): PlanSpacePaths {
  const root = doc(db, 'rooms', roomId);
  return {
    root,
    collection: (key: PlanCollectionKey) => collection(root, key),
    item: (key: PlanCollectionKey, id: string) => doc(root, key, id),
  };
}

/** Firebase implementation for link-shared collaborative plan rooms. */
export class FirestoreRoomRepository implements RoomRepository {
  async create(seed: PlanState): Promise<string> {
    await signInAnon();
    const roomId = doc(collection(db, 'rooms')).id;
    await createPlanSpace(roomPaths(roomId), seed);
    return roomId;
  }

  async exists(roomId: string): Promise<boolean> {
    return planSpaceExists(roomPaths(roomId));
  }

  async connect(roomId: string, handlers: RoomHandlers, me: Me): Promise<RoomConnection> {
    await signInAnon();

    const plan = await connectPlanSpace(roomPaths(roomId), handlers);
    const presenceRef = doc(db, 'rooms', roomId, 'presence', me.clientId);
    const beat = () =>
      void setDoc(
        presenceRef,
        { name: me.name, color: me.color, lastSeen: serverTimestamp() },
        { merge: true },
      ).catch(handlers.onError);
    beat();
    const heartbeat = window.setInterval(beat, HEARTBEAT_MS);

    const unsubscribePresence = onSnapshot(
      collection(db, 'rooms', roomId, 'presence'),
      (snapshot) => {
        const now = Date.now();
        const peers: Peer[] = snapshot.docs
          .map((entry) => {
            const data = entry.data();
            const ts = data.lastSeen as { toMillis?: () => number } | null;
            const lastSeen = ts?.toMillis ? ts.toMillis() : now;
            return {
              clientId: entry.id,
              name: typeof data.name === 'string' ? data.name : 'Guest',
              color: typeof data.color === 'string' ? data.color : '#888',
              lastSeen,
            };
          })
          .filter((peer) => now - peer.lastSeen < STALE_MS);
        handlers.onPeers(peers);
      },
      handlers.onError,
    );

    const onUnload = () => void deleteDoc(presenceRef);
    window.addEventListener('beforeunload', onUnload);

    return {
      save: plan.save,
      disconnect() {
        plan.disconnect();
        unsubscribePresence();
        window.clearInterval(heartbeat);
        window.removeEventListener('beforeunload', onUnload);
        void deleteDoc(presenceRef).catch(() => {});
      },
    };
  }
}
