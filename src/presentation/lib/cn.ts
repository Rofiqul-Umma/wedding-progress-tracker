/** Tiny classnames joiner (falsy values are dropped). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * A ~13% version of a color, for tinted category backgrounds.
 *
 * `color-mix` rather than an `'22'` alpha suffix because the category palette
 * is now `var(--color-cat-N)` (so it can shift per theme) and a suffix only
 * works on a literal hex. Room-presence peer colors are still raw hexes and
 * pass through the same path unchanged.
 */
export function tint(color: string): string {
  return `color-mix(in oklab, ${color} 13%, transparent)`;
}
