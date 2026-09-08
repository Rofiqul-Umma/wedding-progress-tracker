/** The three appearance choices offered in Settings. */
export const THEME_MODES = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/** What actually gets painted — `system` resolves to one of these. */
export type ResolvedTheme = 'light' | 'dark';

const MODES: ReadonlySet<string> = new Set(THEME_MODES);

/**
 * Read a stored appearance choice.
 *
 * Anything unrecognised — a missing key, storage cleared, a hand-edited value,
 * a mode retired by a future version — means "follow the OS", which is the
 * safest default: it can never leave someone stuck in a theme they can't see.
 */
export function parseThemeMode(raw: string | null | undefined): ThemeMode {
  const trimmed = raw?.trim();
  return trimmed && MODES.has(trimmed) ? (trimmed as ThemeMode) : 'system';
}

/** Collapse a mode plus the OS preference into the theme to paint. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}
