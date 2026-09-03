import { describe, it, expect } from 'vitest';
import type { PlanState } from '@domain/entities/types';
import { diffPlan, ROOM_COLLECTIONS } from './roomDiff';

function base(): PlanState {
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
        social: '',
        cost: 100,
        items: [],
        status: 'paid',
        notes: '',
      },
    ],
    budget: [],
    tasks: [
      { id: 't1', title: 'Cake', due: '', done: false, cat: '', created: '09:00 AM' },
    ],
    seserahan: [],
    shopping: [],
    contacts: [],
  };
}

describe('diffPlan', () => {
  it('reports an empty diff for identical states', () => {
    const d = diffPlan(base(), base());
    expect(d.isEmpty).toBe(true);
    expect(d.settings).toBeUndefined();
    expect(d.wedding).toBeUndefined();
    for (const k of ROOM_COLLECTIONS) {
      expect(d.collections[k].upserts).toEqual([]);
      expect(d.collections[k].deletes).toEqual([]);
    }
  });

  it('detects an added item', () => {
    const next = base();
    next.shopping.push({
      id: 's1',
      name: 'Lights',
      category: 'Decor',
      store: '',
      price: 10,
      qty: 1,
      status: 'toBuy',
      url: '',
      image: '',
      notes: '',
    });
    const d = diffPlan(base(), next);
    expect(d.isEmpty).toBe(false);
    expect(d.collections.shopping.upserts).toHaveLength(1);
    expect(d.collections.shopping.upserts[0].id).toBe('s1');
    expect(d.collections.shopping.deletes).toEqual([]);
  });

  it('detects an updated item', () => {
    const next = base();
    next.vendors[0] = { ...next.vendors[0], cost: 999 };
    const d = diffPlan(base(), next);
    expect(d.collections.vendors.upserts).toHaveLength(1);
    expect(d.collections.vendors.upserts[0].cost).toBe(999);
    expect(d.collections.vendors.deletes).toEqual([]);
  });

  it('detects a deleted item', () => {
    const next = base();
    next.tasks = [];
    const d = diffPlan(base(), next);
    expect(d.collections.tasks.upserts).toEqual([]);
    expect(d.collections.tasks.deletes).toEqual(['t1']);
  });

  it('detects a settings-only change', () => {
    const next = base();
    next.settings = { currency: 'USD', lang: 'en' };
    const d = diffPlan(base(), next);
    expect(d.isEmpty).toBe(false);
    expect(d.settings).toEqual({ currency: 'USD', lang: 'en' });
    expect(d.wedding).toBeUndefined();
    for (const k of ROOM_COLLECTIONS) {
      expect(d.collections[k].upserts).toEqual([]);
      expect(d.collections[k].deletes).toEqual([]);
    }
  });

  it('detects a wedding-only change', () => {
    const next = base();
    next.wedding = { ...next.wedding, venue: 'Beach' };
    const d = diffPlan(base(), next);
    expect(d.wedding?.venue).toBe('Beach');
    expect(d.settings).toBeUndefined();
  });

  it('detects simultaneous changes across collections', () => {
    const next = base();
    next.vendors[0] = { ...next.vendors[0], name: 'Rose' };
    next.tasks = [];
    next.budget.push({ id: 'b1', category: 'Cake', item: 'Cake', estimated: 5, actual: 0, paid: false });
    const d = diffPlan(base(), next);
    expect(d.collections.vendors.upserts).toHaveLength(1);
    expect(d.collections.tasks.deletes).toEqual(['t1']);
    expect(d.collections.budget.upserts).toHaveLength(1);
    expect(d.isEmpty).toBe(false);
  });

  it('produces enough ops to exercise the >500 chunk boundary', () => {
    const prev = base();
    const next = base();
    next.contacts = Array.from({ length: 600 }, (_, i) => ({
      id: `c${i}`,
      name: `Person ${i}`,
      role: '',
      phone: '',
      social: '',
      notes: '',
    }));
    const d = diffPlan(prev, next);
    expect(d.collections.contacts.upserts).toHaveLength(600);
    // A batch caps at 500 ops, so applying this diff must span >1 chunk.
    const chunks = Math.ceil(d.collections.contacts.upserts.length / 500);
    expect(chunks).toBeGreaterThan(1);
  });
});
