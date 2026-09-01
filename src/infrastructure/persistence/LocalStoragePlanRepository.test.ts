import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStoragePlanRepository } from './LocalStoragePlanRepository';
import { STORE_KEY } from './storeKey';

describe('LocalStoragePlanRepository', () => {
  beforeEach(() => localStorage.clear());

  it('starts with an empty plan when storage is empty and persists it', () => {
    const repo = new LocalStoragePlanRepository();
    const state = repo.load();
    expect(state.vendors).toHaveLength(0);
    expect(state.tasks).toHaveLength(0);
    // the first load writes the blank plan back to storage
    expect(localStorage.getItem(STORE_KEY)).toBeTruthy();
  });

  it('round-trips a saved plan through migrate on load', () => {
    const repo = new LocalStoragePlanRepository();
    const seeded = repo.load();
    seeded.wedding.p1 = 'Zola';
    repo.save(seeded);

    const reloaded = new LocalStoragePlanRepository().load();
    expect(reloaded.wedding.p1).toBe('Zola');
  });

  it('recovers with an empty plan when stored JSON is corrupt', () => {
    localStorage.setItem(STORE_KEY, '{not valid json');
    const state = new LocalStoragePlanRepository().load();
    expect(state.vendors).toHaveLength(0);
    expect(state.tasks).toHaveLength(0);
  });
});
