import { describe, it, expect } from 'vitest';
import {
  serializeLineItems,
  parseLineItems,
  parseLineItemsDraft,
  lineItemsSum,
} from './lineItems';

describe('vendor line item serialization', () => {
  it('round-trips a list', () => {
    const items = [
      { id: 'a', name: 'Family-style dinner', qty: 80, price: 105 },
      { id: 'b', name: 'Service staff', qty: 4, price: 300 },
    ];
    expect(parseLineItems(serializeLineItems(items))).toEqual(items);
  });

  it('serializes an empty or missing list to an empty string', () => {
    expect(serializeLineItems([])).toBe('');
    expect(serializeLineItems(undefined)).toBe('');
  });

  it('parses empty and corrupt input to an empty list', () => {
    expect(parseLineItems('')).toEqual([]);
    expect(parseLineItems(null)).toEqual([]);
    expect(parseLineItems('not json')).toEqual([]);
    expect(parseLineItems('{"name":"x"}')).toEqual([]);
  });

  it('drops blank names on save but keeps them while drafting', () => {
    const raw = JSON.stringify([
      { id: 'a', name: '  ', qty: 1, price: 0 },
      { id: 'b', name: ' Cake ', qty: 1, price: 40 },
    ]);
    expect(parseLineItemsDraft(raw)).toHaveLength(2);
    expect(parseLineItems(raw)).toEqual([{ id: 'b', name: 'Cake', qty: 1, price: 40 }]);
  });

  it('clamps quantity to at least one and rounds it', () => {
    const raw = JSON.stringify([
      { id: 'a', name: 'x', qty: 0, price: 1 },
      { id: 'b', name: 'y', qty: -4, price: 1 },
      { id: 'c', name: 'z', qty: 2.6, price: 1 },
    ]);
    expect(parseLineItems(raw).map((i) => i.qty)).toEqual([1, 1, 3]);
  });

  it('floors a negative or unparseable price at zero', () => {
    const raw = JSON.stringify([
      { id: 'a', name: 'x', qty: 1, price: -50 },
      { id: 'b', name: 'y', qty: 1, price: 'abc' },
      { id: 'c', name: 'z', qty: 1 },
    ]);
    expect(parseLineItems(raw).map((i) => i.price)).toEqual([0, 0, 0]);
  });

  it('mints an id for entries that lack one', () => {
    const parsed = parseLineItems(JSON.stringify([{ name: 'x', qty: 1, price: 5 }]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBeTruthy();
  });

  it('sums unit price times quantity', () => {
    expect(
      lineItemsSum([
        { id: 'a', name: 'Dinner', qty: 80, price: 105 },
        { id: 'b', name: 'Staff', qty: 4, price: 300 },
      ]),
    ).toBe(9600);
    expect(lineItemsSum([])).toBe(0);
  });
});
