import { parseThemeMode, type ThemeMode } from '@domain/value-objects/theme';

/**
 * localStorage key for the appearance choice.
 *
 * Deliberately *outside* the plan (`evermore.v2`): the plan syncs to a partner
 * and to the cloud, and appearance is a property of this screen, not of the
 * wedding. Keeping it separate also means no schema/migration change.
 *
 * NOTE: duplicated as a literal in `index.html`'s pre-paint script, which runs
 * before any module loads. Change both together.
 */
export const THEME_KEY = 'evermore.theme';

/** Read the stored mode; anything unreadable means "follow the OS". */
export function loadThemeMode(): ThemeMode {
  try {
    return parseThemeMode(localStorage.getItem(THEME_KEY));
  } catch {
    // Storage disabled (private mode / blocked cookies) — not worth crashing over.
    return 'system';
  }
}

/** Persist the mode. Failing to remember it is never fatal. */
export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* storage unavailable — the choice just won't survive a reload */
  }
}
