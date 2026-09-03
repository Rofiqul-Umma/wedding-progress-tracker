import { describe, it, expect } from 'vitest';
import { serializeContents, parseContents, parseContentsDraft } from './checklist';

describe('checklist serialization', () => {
  it('round-trips a list', () => {
    const items = [
      { id: 'a', name: 'Mukena', qty: 1, done: true },
      { id: 'b', name: 'Sajadah', qty: 2, done: false },
    ];
    expect(parseContents(serializeContents(items))).toEqual(items);
  });

  it('serializes an empty or missing list to an empty string', () => {
    expect(serializeContents([])).toBe('');
    expect(serializeContents(undefined)).toBe('');
  });

  it('parses empty and corrupt input to an empty list', () => {
    expect(parseContents('')).toEqual([]);
    expect(parseContents(null)).toEqual([]);
    expect(parseContents('not json')).toEqual([]);
    expect(parseContents('{"name":"x"}')).toEqual([]);
  });

  it('drops blank names on save but keeps them while drafting', () => {
    const raw = JSON.stringify([
      { id: 'a', name: '  ', qty: 1, done: false },
      { id: 'b', name: ' Mukena ', qty: 1, done: false },
    ]);
    expect(parseContentsDraft(raw)).toHaveLength(2);
    expect(parseContents(raw)).toEqual([{ id: 'b', name: 'Mukena', qty: 1, done: false }]);
  });

  it('clamps quantity to at least one', () => {
    const raw = JSON.stringify([
      { id: 'a', name: 'x', qty: 0, done: false },
      { id: 'b', name: 'y', qty: -4, done: false },
      { id: 'c', name: 'z', qty: 2.6, done: false },
    ]);
    expect(parseContents(raw).map((c) => c.qty)).toEqual([1, 1, 3]);
  });

  it('mints an id for entries that lack one', () => {
    const parsed = parseContents(JSON.stringify([{ name: 'x', qty: 1, done: false }]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBeTruthy();
  });

  it('treats a missing done flag as not done', () => {
    expect(parseContents(JSON.stringify([{ id: 'a', name: 'x', qty: 1 }]))[0].done).toBe(
      false,
    );
  });
});
