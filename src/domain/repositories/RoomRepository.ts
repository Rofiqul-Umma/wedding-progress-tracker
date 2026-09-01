import type { PlanState } from '@domain/entities/types';

/** A collaborator currently present in a room. */
export interface Peer {
  /** Anonymous auth uid — unique per browser session. */
  clientId: string;
  name: string;
  /** Hex color for the presence avatar. */
  color: string;
  /** Epoch ms of the last heartbeat (used to filter out stale peers). */
  lastSeen: number;
}

/** The local client's identity, written to its own presence doc. */
export interface Me {
  clientId: string;
  name: string;
  color: string;
}

/** Callbacks the room connection invokes as remote state changes. */
export interface RoomHandlers {
  /** A fully assembled + migrated snapshot of the shared plan. */
  onState(state: PlanState): void;
  /** The live collaborator list, already filtered to recent heartbeats. */
  onPeers(peers: Peer[]): void;
  onError(err: unknown): void;
  /** An attachment was too large to sync and was dropped from the shared doc. */
  onAttachmentTooLarge?(): void;
}

/** A live connection to one room. */
export interface RoomConnection {
  /** Diff `next` against the last synced baseline and push minimal writes. */
  save(next: PlanState): void;
  /** Unsubscribe everything, stop the heartbeat, and remove presence. */
  disconnect(): void;
}

/**
 * Port for the realtime room backend. The Firestore implementation lives in the
 * infrastructure layer and is loaded lazily so the app runs without firebase.
 */
export interface RoomRepository {
  /** Seed a brand-new room from the current plan; returns the room id. */
  create(seed: PlanState): Promise<string>;
  /** Whether a room with this id exists. */
  exists(roomId: string): Promise<boolean>;
  /** Subscribe to a room and begin syncing. */
  connect(roomId: string, handlers: RoomHandlers, me: Me): Promise<RoomConnection>;
}
