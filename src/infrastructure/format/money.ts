import type { Lang } from '@domain/entities/types';
import { localeFor } from './locale';

/**
 * Locale-aware currency formatting. Following the language means IDR renders
 * the Indonesian way (e.g. `Rp42.000`) when the app is in Bahasa Indonesia.
 */
export function formatMoney(
  amount: number,
  currency: string,
  lang: Lang,
): string {
  const locale = localeFor(lang);
  const n = Math.round(+amount || 0);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return '$' + n.toLocaleString(locale);
  }
}

/** Currencies offered in the Settings selector. */
export interface CurrencyOption {
  code: string;
  label: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'SGD', label: 'Singapore Dollar (S$)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'IDR', label: 'Indonesian Rupiah (Rp)' },
];
