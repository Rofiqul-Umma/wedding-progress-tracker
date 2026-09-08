import type { ResolvedTheme } from '@domain/value-objects/theme';

/** Browser-chrome color per theme (address bar on Android, PWA title bar). */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#ffffff',
  dark: '#17191a',
};

/**
 * The single place that writes the theme to the document.
 *
 * `data-theme` drives the CSS custom-property override in `index.css`;
 * `color-scheme` is what makes native widgets (the `<select>`s and the date
 * input in Settings, scrollbars, form controls) follow along — CSS variables
 * can't reach inside those.
 */
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_COLOR[theme]);
}
