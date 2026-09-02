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
});
