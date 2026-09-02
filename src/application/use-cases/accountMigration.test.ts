import { describe, expect, it } from 'vitest';
import { decideAccountMigration } from './accountMigration';

describe('decideAccountMigration', () => {
  it('seeds a missing cloud plan from local data', () => {
    expect(decideAccountMigration('missing', false)).toBe('seed');
  });

  it('never hydrates a claimed but incompletely seeded plan', () => {
    expect(decideAccountMigration('pending', false)).toBe('waitForInitialization');
    expect(decideAccountMigration('pending', true)).toBe('waitForInitialization');
  });

  it('requires a backup before adopting an existing ready cloud plan', () => {
    expect(decideAccountMigration('ready', false)).toBe('backupThenHydrate');
  });

  it('reconnects directly when local data is a verified mirror', () => {
    expect(decideAccountMigration('ready', true)).toBe('hydrate');
  });
});
