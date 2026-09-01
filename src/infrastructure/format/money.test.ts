import { describe, it, expect } from 'vitest';
import { formatMoney, CURRENCIES } from './money';
import { localeFor } from './locale';

describe('localeFor', () => {
  it('maps app language to a BCP-47 locale', () => {
    expect(localeFor('id')).toBe('id-ID');
    expect(localeFor('en')).toBe('en-US');
  });
});

describe('formatMoney', () => {
  it('formats USD the US way with no decimals', () => {
    const out = formatMoney(42000, 'USD', 'en');
    expect(out).toContain('$');
    expect(out).toContain('42,000');
    expect(out).not.toMatch(/\.\d\d$/); // no cents
  });

  it('formats IDR the Indonesian way (Rp, dot grouping)', () => {
    const out = formatMoney(42000, 'IDR', 'id');
    expect(out).toContain('Rp');
    // Indonesian grouping uses dots: Rp42.000
    expect(out).toContain('42.000');
  });

  it('rounds to whole units', () => {
    expect(formatMoney(999.7, 'USD', 'en')).toContain('1,000');
  });

  it('treats invalid amounts as zero', () => {
    expect(formatMoney(NaN, 'USD', 'en')).toContain('0');
  });

  it('offers Indonesian Rupiah among the currency options', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(codes).toContain('IDR');
    expect(codes).toContain('USD');
    expect(CURRENCIES).toHaveLength(9);
  });
});
