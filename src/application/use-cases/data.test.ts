import { describe, it, expect } from 'vitest';
import type { PlanState } from '@domain/entities/types';
import { serializePlan, blankState, clearData } from './data';

function sample(): PlanState {
  return {
    settings: { currency: 'IDR', lang: 'id' },
    wedding: { p1: 'Amara', p2: 'Julian', date: '2026-09-14', venue: 'Barn', budget: 42000 },
    vendors: [
      {
        id: 'v1',
        name: 'Ivy',
        category: 'Venue',
        contact: '',
        phone: '',
        email: '',
        cost: 100,
        status: 'paid',
        notes: '',
      },
    ],
    budget: [],
    tasks: [],
    seserahan: [],
    shopping: [],
    contacts: [],
  };
}

describe('serializePlan', () => {
  it('produces pretty-printed JSON that round-trips', () => {
    const json = serializePlan(sample());
    expect(json).toContain('\n');
    expect(JSON.parse(json)).toEqual(sample());
  });
});

describe('blankState', () => {
  it('keeps currency and language preferences', () => {
    const s = blankState({ currency: 'IDR', lang: 'id' });
    expect(s.settings).toEqual({ currency: 'IDR', lang: 'id' });
    expect(s.vendors).toEqual([]);
    expect(s.wedding.budget).toBe(0);
  });

  it('falls back to USD/en when preferences are empty', () => {
    const s = blankState({ currency: '', lang: '' as 'en' });
    expect(s.settings.currency).toBe('USD');
    expect(s.settings.lang).toBe('en');
  });
});

describe('clearData', () => {
  it('empties collections but preserves preferences', () => {
    const cleared = clearData(sample());
    expect(cleared.vendors).toEqual([]);
    expect(cleared.settings).toEqual({ currency: 'IDR', lang: 'id' });
    expect(cleared.wedding.p1).toBe('Partner 1');
  });
});
