import type { PlanState } from '@domain/entities/types';

/**
 * Port for persisting the plan. Implemented in the infrastructure layer
 * (e.g. LocalStoragePlanRepository). The domain/application layers depend
 * only on this interface, never on a concrete storage mechanism.
 */
export interface PlanRepository {
  /** Load persisted state, seeding + migrating as needed. Never throws. */
  load(): PlanState;
  /** Persist the given state. Never throws. */
  save(state: PlanState): void;
}
