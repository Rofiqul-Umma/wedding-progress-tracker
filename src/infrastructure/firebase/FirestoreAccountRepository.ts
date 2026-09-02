import {
  connectPlanSpace,
  createPlanSpace,
  planSpaceStatus,
  userPlanPaths,
} from './FirestorePlanSpace';
import type {
  AccountConnection,
  AccountHandlers,
  AccountPlanStatus,
  AccountRepository,
} from '@domain/repositories/AccountRepository';
import type { PlanState } from '@domain/entities/types';

/** Firestore-backed private plan at `users/{uid}`. */
export class FirestoreAccountRepository implements AccountRepository {
  status(uid: string): Promise<AccountPlanStatus> {
    return planSpaceStatus(userPlanPaths(uid));
  }

  create(uid: string, seed: PlanState): Promise<'created' | 'exists'> {
    return createPlanSpace(userPlanPaths(uid), seed);
  }

  connect(uid: string, handlers: AccountHandlers): Promise<AccountConnection> {
    return connectPlanSpace(userPlanPaths(uid), handlers);
  }
}
