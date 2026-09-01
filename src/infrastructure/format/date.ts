import type { Lang } from '@domain/entities/types';
import { localeFor } from './locale';

/** Format an ISO `YYYY-MM-DD` date for display (empty string when unset). */
export function formatDate(
  dateStr: string,
  lang: Lang,
  opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(localeFor(lang), opts);
}

/** Current wall-clock time, used to stamp newly created tasks. */
export function nowTime(lang: Lang): string {
  try {
    return new Date().toLocaleTimeString(localeFor(lang), {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '09:05 AM';
  }
}
