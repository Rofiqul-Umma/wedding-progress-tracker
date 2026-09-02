import type { PlanState } from '@domain/entities/types';

/** The non-sensitive profile fields used by account UI. */
export interface AccountUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface AccountHandlers {
  onState(state: PlanState): void;
  onError(err: unknown): void;
  onAttachmentTooLarge?(): void;
}

export interface AccountConnection {
  save(next: PlanState): void;
  disconnect(): void;
}

export type AccountPlanStatus = 'missing' | 'pending' | 'ready';

/** Private per-user cloud-plan port. */
export interface AccountRepository {
  status(uid: string): Promise<AccountPlanStatus>;
  create(uid: string, seed: PlanState): Promise<'created' | 'exists'>;
  connect(uid: string, handlers: AccountHandlers): Promise<AccountConnection>;
}
