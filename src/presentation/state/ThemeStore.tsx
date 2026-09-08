import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from '@domain/value-objects/theme';
import { loadThemeMode, saveThemeMode } from '@infrastructure/theme/themeStorage';
import { applyTheme } from '@infrastructure/theme/applyTheme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Does the OS ask for dark right now? False anywhere `matchMedia` is missing. */
function osPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

interface ThemeContextValue {
  /** What the user chose: 'light' | 'dark' | 'system'. */
  mode: ThemeMode;
  /** What's actually painted — 'system' collapsed against the OS preference. */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Owns the appearance choice.
 *
 * Device-local by design: the choice lives under its own storage key rather
 * than in the plan, so darkening this laptop never pushes dark to a partner's
 * phone through the room/cloud sync (which diffs the whole settings object).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(loadThemeMode);
  const [prefersDark, setPrefersDark] = useState(osPrefersDark);

  // Track the OS preference so `system` flips live — macOS/iOS switch at dusk
  // without any app involvement, and a reload shouldn't be needed to notice.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    setPrefersDark(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const resolved = resolveTheme(mode, prefersDark);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    saveThemeMode(mode);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
