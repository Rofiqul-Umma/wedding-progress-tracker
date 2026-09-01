import { describe, it, expect } from 'vitest';
import {
  SES_ORDER,
  nextSeserahanStatus,
  SHOP_ORDER,
  nextShoppingStatus,
  iconForCategory,
  categoryColor,
  CAT_COLORS,
} from './status';

describe('nextSeserahanStatus', () => {
  it('advances through the lifecycle and wraps around', () => {
    expect(nextSeserahanStatus('pending')).toBe('onProgress');
    expect(nextSeserahanStatus('onProgress')).toBe('finished');
    expect(nextSeserahanStatus('finished')).toBe('pending');
  });
  it('covers every status in SES_ORDER', () => {
    for (const s of SES_ORDER) {
      expect(SES_ORDER).toContain(nextSeserahanStatus(s));
    }
  });
});

describe('nextShoppingStatus', () => {
  it('advances through the lifecycle and wraps around', () => {
    expect(nextShoppingStatus('toBuy')).toBe('ordered');
    expect(nextShoppingStatus('ordered')).toBe('purchased');
    expect(nextShoppingStatus('purchased')).toBe('toBuy');
  });
  it('covers every status in SHOP_ORDER', () => {
    for (const s of SHOP_ORDER) {
      expect(SHOP_ORDER).toContain(nextShoppingStatus(s));
    }
  });
});

describe('iconForCategory', () => {
  it('maps a known category to its icon', () => {
    expect(iconForCategory('Venue')).toBe('location_on');
    expect(iconForCategory('Busana')).toBe('checkroom');
  });
  it('falls back to a flag for unknown or missing categories', () => {
    expect(iconForCategory('Nonsense')).toBe('flag');
    expect(iconForCategory(undefined)).toBe('flag');
  });
});

describe('categoryColor', () => {
  it('is deterministic for the same label', () => {
    expect(categoryColor('Venue')).toBe(categoryColor('Venue'));
  });
  it('always returns a color from the palette', () => {
    for (const name of ['Venue', 'Cake', '', 'Anything']) {
      expect(CAT_COLORS).toContain(categoryColor(name));
    }
  });
});
