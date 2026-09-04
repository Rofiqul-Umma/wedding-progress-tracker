import { describe, it, expect } from 'vitest';
import { migrate } from './migrate';

describe('migrate', () => {
  it('fills defaults for a completely empty input', () => {
    const s = migrate(undefined);
    expect(s.settings).toEqual({ currency: 'USD', lang: 'en' });
    expect(s.wedding).toEqual({ p1: '', p2: '', date: '', venue: '', budget: 0 });
    expect(s.vendors).toEqual([]);
    expect(s.budget).toEqual([]);
    expect(s.tasks).toEqual([]);
    expect(s.seserahan).toEqual([]);
    expect(s.shopping).toEqual([]);
    expect(s.contacts).toEqual([]);
  });

  it('never throws on garbage input', () => {
    expect(() => migrate('not an object')).not.toThrow();
    expect(() => migrate(42)).not.toThrow();
    expect(() => migrate(null)).not.toThrow();
    expect(migrate('x').vendors).toEqual([]);
  });

  it('defaults language to en unless explicitly id', () => {
    expect(migrate({ settings: { lang: 'id' } }).settings.lang).toBe('id');
    expect(migrate({ settings: { lang: 'fr' } }).settings.lang).toBe('en');
    expect(migrate({ settings: {} }).settings.lang).toBe('en');
  });

  it('supplies a missing seserahan collection (legacy backups)', () => {
    const legacy = {
      wedding: { p1: 'A', p2: 'B', date: '', venue: '', budget: 1000 },
      vendors: [],
      budget: [],
      tasks: [],
      contacts: [],
      // no seserahan, no settings
    };
    const s = migrate(legacy);
    expect(s.seserahan).toEqual([]);
    expect(s.settings).toEqual({ currency: 'USD', lang: 'en' });
  });

  it('backfills seserahan bundle contents on legacy items', () => {
    const s = migrate({
      seserahan: [{ id: 'a', name: 'Kebaya', status: 'pending' }],
    });
    expect(s.seserahan[0].contents).toEqual([]);
  });

  it('sanitizes seserahan bundle contents', () => {
    const s = migrate({
      seserahan: [
        {
          id: 'a',
          name: 'Alat sholat',
          status: 'pending',
          contents: [
            { id: 'c1', name: 'Mukena', qty: 0, done: true },
            { name: 'Sajadah', qty: 3 },
            { name: '   ' },
            'nonsense',
          ],
        },
      ],
    });
    const contents = s.seserahan[0].contents;
    expect(contents).toHaveLength(2);
    expect(contents[0]).toEqual({ id: 'c1', name: 'Mukena', qty: 1, done: true });
    expect(contents[1].id).toBeTruthy();
    expect(contents[1]).toMatchObject({ name: 'Sajadah', qty: 3, done: false });
  });

  it('replaces non-array seserahan contents with an empty list', () => {
    const s = migrate({
      seserahan: [{ id: 'a', name: 'X', status: 'pending', contents: 'Mukena, sajadah' }],
    });
    expect(s.seserahan[0].contents).toEqual([]);
  });

  it('backfills vendor line items on legacy vendors', () => {
    const s = migrate({
      vendors: [{ id: 'a', name: 'Ivy Barn', cost: 14500, status: 'paid' }],
    });
    expect(s.vendors[0].items).toEqual([]);
  });

  it('sanitizes vendor line items', () => {
    const s = migrate({
      vendors: [
        {
          id: 'a',
          name: 'Copper Spoon',
          cost: 9600,
          status: 'inquiry',
          items: [
            { id: 'i1', name: 'Dinner', qty: 0, price: 105 },
            { name: 'Staff', qty: 4, price: -300 },
            { name: '   ', qty: 1, price: 10 },
            'nonsense',
          ],
        },
      ],
    });
    const items = s.vendors[0].items;
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ id: 'i1', name: 'Dinner', qty: 1, price: 105 });
    expect(items[1].id).toBeTruthy();
    expect(items[1]).toMatchObject({ name: 'Staff', qty: 4, price: 0 });
  });

  it('replaces non-array vendor line items with an empty list', () => {
    const s = migrate({
      vendors: [{ id: 'a', name: 'X', cost: 0, status: 'inquiry', items: 'dinner, staff' }],
    });
    expect(s.vendors[0].items).toEqual([]);
  });

  it('coerces wedding fields to their expected types', () => {
    const s = migrate({
      wedding: { p1: 'A', p2: 5, date: null, venue: undefined, budget: '42000' },
    });
    expect(s.wedding.p1).toBe('A');
    expect(s.wedding.p2).toBe('');
    expect(s.wedding.date).toBe('');
    expect(s.wedding.venue).toBe('');
    expect(s.wedding.budget).toBe(42000);
  });

  it('replaces a non-array collection with an empty array', () => {
    const s = migrate({ wedding: {}, vendors: 'nope' });
    expect(s.vendors).toEqual([]);
  });

  it('preserves a valid currency', () => {
    expect(migrate({ settings: { currency: 'IDR' } }).settings.currency).toBe('IDR');
  });

  it('supplies a missing or garbage shopping collection', () => {
    expect(migrate({ wedding: {} }).shopping).toEqual([]);
    expect(migrate({ wedding: {}, shopping: 'nope' }).shopping).toEqual([]);
  });

  it('carries a legacy vendor email forward as social', () => {
    const s = migrate({
      wedding: {},
      vendors: [
        { id: 'v1', name: 'Ivy', category: 'Venue', contact: '', phone: '', email: 'ivy@ex.com', cost: 0, status: 'inquiry', notes: '' },
      ],
    });
    expect(s.vendors[0].social).toBe('ivy@ex.com');
  });

  it('prefers an existing social over a legacy email', () => {
    const s = migrate({
      wedding: {},
      vendors: [
        { id: 'v1', name: 'Ivy', category: 'Venue', contact: '', phone: '', social: 'instagram.com/ivy', email: 'ivy@ex.com', cost: 0, status: 'inquiry', notes: '' },
      ],
    });
    expect(s.vendors[0].social).toBe('instagram.com/ivy');
  });

  it('carries a legacy contact email forward as social', () => {
    const s = migrate({
      wedding: {},
      contacts: [
        { id: 'c1', name: 'Renee', role: '', phone: '', email: 'renee@ex.com', notes: '' },
      ],
    });
    expect(s.contacts[0].social).toBe('renee@ex.com');
  });

  it('preserves a vendor down-payment amount', () => {
    const s = migrate({
      wedding: {},
      vendors: [
        { id: 'v1', name: 'Ivy', category: 'Venue', contact: '', phone: '', social: '', cost: 1000, status: 'deposit', deposit: 250, notes: '' },
      ],
    });
    expect(s.vendors[0].deposit).toBe(250);
    expect(s.vendors[0].status).toBe('deposit');
  });

  it('round-trips a task url and attachment', () => {
    const attachment = { name: 'quote.pdf', type: 'application/pdf', data: 'data:application/pdf;base64,AA==' };
    const s = migrate({
      wedding: {},
      tasks: [
        { id: 't1', title: 'Order bands', done: false, created: '', due: '', cat: '', url: 'https://ex.com', attachment },
      ],
    });
    expect(s.tasks[0].url).toBe('https://ex.com');
    expect(s.tasks[0].attachment).toEqual(attachment);
  });

  it('keeps a chosen icon on every entity that can carry one', () => {
    const s = migrate({
      vendors: [{ id: 'v1', name: 'Ivy', icon: 'church' }],
      tasks: [{ id: 't1', title: 'Bands', icon: 'music_note' }],
      seserahan: [{ id: 'e1', name: 'Tray', icon: 'card_giftcard' }],
      shopping: [{ id: 's1', name: 'Lights', icon: 'lightbulb' }],
    });
    expect(s.vendors[0].icon).toBe('church');
    expect(s.tasks[0].icon).toBe('music_note');
    expect(s.seserahan[0].icon).toBe('card_giftcard');
    expect(s.shopping[0].icon).toBe('lightbulb');
  });

  it('coerces a non-string icon to empty, so it falls back to the category', () => {
    const s = migrate({
      vendors: [{ id: 'v1', name: 'Ivy', icon: 42 }],
      tasks: [{ id: 't1', title: 'Bands', icon: { name: 'x' } }],
      seserahan: [{ id: 'e1', name: 'Tray' }],
      shopping: [{ id: 's1', name: 'Lights', icon: null }],
    });
    expect(s.vendors[0].icon).toBe('');
    expect(s.tasks[0].icon).toBe('');
    expect(s.seserahan[0].icon).toBe('');
    expect(s.shopping[0].icon).toBe('');
  });
});
