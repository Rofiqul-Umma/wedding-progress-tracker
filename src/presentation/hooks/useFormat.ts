import { usePlan } from '@presentation/state/PlanStore';
import { formatMoney } from '@infrastructure/format/money';
import { formatDate, nowTime } from '@infrastructure/format/date';

/** Locale-aware formatters bound to the current settings (currency + language). */
export function useFormat() {
  const { state } = usePlan();
  const { lang, currency } = state.settings;
  return {
    lang,
    currency,
    money: (n: number) => formatMoney(n, currency, lang),
    date: (s: string, opts?: Intl.DateTimeFormatOptions) =>
      formatDate(s, lang, opts),
    now: () => nowTime(lang),
  };
}
