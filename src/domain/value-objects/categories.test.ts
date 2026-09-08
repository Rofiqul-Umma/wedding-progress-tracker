import { describe, it, expect } from 'vitest';
import {
  BASE_CATEGORIES,
  BASE_CATEGORY_VALUES,
  categoryCell,
  categoryLabel,
  type CategoryKind,
} from './categories';
import { CAT_ICON } from './status';
import { ICON_NAMES } from './icons';
import { en } from '@infrastructure/i18n/resources/en';
import { id } from '@infrastructure/i18n/resources/id';

const KINDS = Object.keys(BASE_CATEGORIES) as CategoryKind[];

/**
 * The categories present in a real exported plan. Stored values are the
 * grouping keys for the budget rollup and the lookup keys for icons, so
 * "tidying" one of these spellings would silently re-bucket someone's report
 * and orphan their icons. This list is the guard against that.
 */
const IN_THE_WILD = [
  'Henna & Nail Art',
  'Perlengkapan & Dekorasi Acara',
  'Wedding Band',
  'Dekorasi Lamaran',
  'MUA Lamaran',
  'Fotografer & Videografer',
  'WCC',
  'Preweeding',
  'Buket Lamaran',
  'Fotografer Lamaran',
  'MC',
  'Perlengkapan Pengantin',
  'Perlengkapan',
  'Dokumen',
  'Dokumentasi',
  'Makeup',
  'Toiletries',
  'Skincare',
  'Pakaian Dalam',
  'Aksesoris',
  'Busana',
  'Alat Ibadah',
  'Body Care',
  'Seragam',
];

describe('BASE_CATEGORIES', () => {
  it('lists each value once per kind', () => {
    for (const kind of KINDS) {
      const values = BASE_CATEGORIES[kind].map((c) => c.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('uses one key per value, even across kinds', () => {
    const seen = new Map<string, string>();
    for (const kind of KINDS) {
      for (const { value, key } of BASE_CATEGORIES[kind]) {
        expect(seen.get(value) ?? key).toBe(key);
        seen.set(value, key);
      }
    }
  });

  it('translates every category in both languages', () => {
    for (const kind of KINDS) {
      for (const { value, key } of BASE_CATEGORIES[kind]) {
        // The two resource files are mirrored by hand, so a key added to one
        // and forgotten in the other would otherwise ship as a raw key.
        expect(en.categories, `en is missing ${value}`).toHaveProperty(key);
        expect(id.categories, `id is missing ${value}`).toHaveProperty(key);
      }
    }
  });

  it('keeps the categories found in real plans', () => {
    for (const value of IN_THE_WILD) {
      expect(BASE_CATEGORY_VALUES.has(value), `${value} is no longer offered`).toBe(
        true,
      );
    }
  });

  it('resolves a real icon for every category that defines one', () => {
    for (const value of BASE_CATEGORY_VALUES) {
      const icon = CAT_ICON[value];
      if (icon) expect(ICON_NAMES.has(icon), `${value} → ${icon}`).toBe(true);
    }
  });
});

describe('categoryLabel', () => {
  const t = (key: string) => `t:${key}`;

  it('translates a base category', () => {
    expect(categoryLabel('Pakaian Dalam', t)).toBe('t:categories.pakaianDalam');
  });

  it('passes a custom category through unchanged', () => {
    // This is the contract that lets users add their own: whatever they typed
    // is already in their own words, so there is nothing to translate.
    expect(categoryLabel('Sound System', t)).toBe('Sound System');
  });

  it('renders an unset category as empty', () => {
    expect(categoryLabel(undefined, t)).toBe('');
    expect(categoryLabel('', t)).toBe('');
  });
});

describe('categoryCell', () => {
  it('emits the i18n key for a base category', () => {
    expect(categoryCell('Seragam')).toBe('categories.seragam');
  });

  it('emits a custom category literally', () => {
    expect(categoryCell('Sound System')).toBe('Sound System');
    expect(categoryCell(undefined)).toBe('');
  });
});
