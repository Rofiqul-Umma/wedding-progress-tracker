import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from './migrate';
import { PlanBackupRepository } from './PlanBackupRepository';

const plan = () =>
  migrate({
    wedding: { p1: 'Local partner', p2: '', date: '', venue: '', budget: 0 },
    contacts: [
      { id: 'c1', name: 'Renee', role: '', phone: '', social: '', notes: '' },
    ],
  });

describe('PlanBackupRepository', () => {
  beforeEach(() => localStorage.clear());

  it('writes, verifies, lists and restores an exact pre-cloud snapshot', () => {
    const repo = new PlanBackupRepository(localStorage, () => 1234);
    const state = plan();

    const result = repo.saveBeforeCloud('user-1', state);

    expect(result.ok).toBe(true);
    expect(repo.list()).toEqual([
      {
        key: 'evermore.v2.backup.user-1.1234',
        version: 1,
        createdAt: 1234,
        uid: 'user-1',
        reason: 'cloud-existing',
      },
    ]);
    expect(repo.load('evermore.v2.backup.user-1.1234')).toEqual(state);
  });

  it('keeps colliding timestamps as separate backups', () => {
    const repo = new PlanBackupRepository(localStorage, () => 1234);

    expect(repo.saveBeforeCloud('user-1', plan()).ok).toBe(true);
    expect(repo.saveBeforeCloud('user-1', plan()).ok).toBe(true);

    expect(repo.list().map((entry) => entry.key)).toEqual([
      'evermore.v2.backup.user-1.1235',
      'evermore.v2.backup.user-1.1234',
    ]);
  });

  it('recovers valid backups even when the index is corrupt', () => {
    const repo = new PlanBackupRepository(localStorage, () => 1234);
    expect(repo.saveBeforeCloud('user-1', plan()).ok).toBe(true);
    localStorage.setItem('evermore.v2.backups', '{bad');

    expect(repo.list()).toHaveLength(1);
    expect(repo.list()[0].key).toBe('evermore.v2.backup.user-1.1234');
  });

  it('returns storage failure and removes a partial backup when indexing fails', () => {
    const values = new Map<string, string>();
    let writes = 0;
    const storage: Storage = {
      get length() {
        return values.size;
      },
      clear: vi.fn(() => values.clear()),
      getItem: vi.fn((key) => values.get(key) ?? null),
      key: vi.fn((index) => [...values.keys()][index] ?? null),
      removeItem: vi.fn((key) => values.delete(key)),
      setItem: vi.fn((key, value) => {
        writes += 1;
        if (writes === 2) throw new DOMException('full', 'QuotaExceededError');
        values.set(key, value);
      }),
    };
    const repo = new PlanBackupRepository(storage, () => 1234);

    expect(repo.saveBeforeCloud('user-1', plan())).toEqual({
      ok: false,
      reason: 'storage',
    });
    expect(values.has('evermore.v2.backup.user-1.1234')).toBe(false);
  });

  it('rejects a backup that cannot be read back exactly', () => {
    const values = new Map<string, string>();
    const storage: Storage = {
      get length() {
        return values.size;
      },
      clear: vi.fn(() => values.clear()),
      getItem: vi.fn((key) => {
        const value = values.get(key) ?? null;
        return key.startsWith('evermore.v2.backup.') && value ? `${value}x` : value;
      }),
      key: vi.fn((index) => [...values.keys()][index] ?? null),
      removeItem: vi.fn((key) => values.delete(key)),
      setItem: vi.fn((key, value) => values.set(key, value)),
    };
    const repo = new PlanBackupRepository(storage, () => 1234);

    expect(repo.saveBeforeCloud('user-1', plan())).toEqual({
      ok: false,
      reason: 'verification',
    });
  });

  it('round-trips account provenance without touching plan data', () => {
    const repo = new PlanBackupRepository();
    localStorage.setItem('evermore.v2', 'keep me');

    const state = plan();
    expect(repo.setProvenance('user-1', state)).toBe(true);
    expect(repo.getProvenance()).toMatchObject({ version: 1, uid: 'user-1' });
    expect(repo.matchesProvenance('user-1', state)).toBe(true);
    expect(repo.matchesProvenance('user-1', migrate({}))).toBe(false);
    repo.clearProvenance();

    expect(repo.getProvenance()).toBeNull();
    expect(localStorage.getItem('evermore.v2')).toBe('keep me');
  });
});
