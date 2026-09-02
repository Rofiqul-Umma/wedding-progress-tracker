import type { AccountPlanStatus } from '@domain/repositories/AccountRepository';

export type AccountMigrationDecision =
  | 'seed'
  | 'hydrate'
  | 'backupThenHydrate'
  | 'waitForInitialization';

/** Pure migration decision so no incomplete cloud tree can become plan truth. */
export function decideAccountMigration(
  cloud: AccountPlanStatus,
  knownLocalMirror: boolean,
): AccountMigrationDecision {
  if (cloud === 'missing') return 'seed';
  if (cloud === 'pending') return 'waitForInitialization';
  return knownLocalMirror ? 'hydrate' : 'backupThenHydrate';
}
