/** Tiny classnames joiner (falsy values are dropped). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** A hex color with ~13% alpha suffix, for tinted category backgrounds. */
export function tint(hex: string): string {
  return hex + '22';
}
