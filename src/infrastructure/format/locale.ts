import type { Lang } from '@domain/entities/types';

/** Map the app language to a BCP-47 locale for Intl formatting. */
export function localeFor(lang: Lang): string {
  return lang === 'id' ? 'id-ID' : 'en-US';
}
