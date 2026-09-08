import { describe, it, expect } from 'vitest';
import { ICON_GROUPS } from '@domain/value-objects/icons';
import { CAT_ICON, iconForCategory } from '@domain/value-objects/status';
import { ICON_MAP } from './icons';

/**
 * The registry is the only thing standing between a stored icon id and a drawn
 * glyph, so every id the app can produce must have an entry. Without this the
 * failure is silent: an unmapped id quietly falls back to a flag.
 */
describe('ICON_MAP', () => {
  it('covers every icon offered by the picker', () => {
    const missing = ICON_GROUPS.flatMap((g) => g.names).filter(
      (name) => !(name in ICON_MAP),
    );
    expect(missing).toEqual([]);
  });

  it('covers every category default, including the fallback', () => {
    const missing = [...Object.values(CAT_ICON), iconForCategory(undefined)].filter(
      (name) => !(name in ICON_MAP),
    );
    expect(missing).toEqual([]);
  });

  it('maps every id to a renderable component', () => {
    for (const [name, Glyph] of Object.entries(ICON_MAP)) {
      expect(Glyph, `${name} has no component`).toBeTruthy();
      // Lucide icons are forwardRef objects, not plain functions.
      expect(['function', 'object']).toContain(typeof Glyph);
    }
  });
});
