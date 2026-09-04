import { describe, it, expect } from 'vitest';
import { ICON_GROUPS, ICON_NAMES, itemIcon } from './icons';

describe('ICON_GROUPS', () => {
  it('uses well-formed Material Symbols names', () => {
    for (const group of ICON_GROUPS) {
      expect(group.labelKey).toMatch(/^icons\.group\.\w+$/);
      expect(group.names.length).toBeGreaterThan(0);
      for (const name of group.names) {
        // Anything else renders as literal text inside the icon span.
        expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });

  it('lists every name exactly once across all groups', () => {
    const all = ICON_GROUPS.flatMap((g) => g.names);
    expect(ICON_NAMES.size).toBe(all.length);
  });
});

describe('itemIcon', () => {
  it('prefers the item’s own icon when it is one we offer', () => {
    expect(itemIcon('cake', 'Venue')).toBe('cake');
    // Whitespace from a hand-edited backup should not defeat the lookup.
    expect(itemIcon('  cake  ', 'Venue')).toBe('cake');
  });

  it('falls back to the category default when unset', () => {
    expect(itemIcon('', 'Venue')).toBe('location_on');
    expect(itemIcon(undefined, 'Busana')).toBe('checkroom');
  });

  it('ignores a name outside the offered set', () => {
    expect(itemIcon('not_a_real_icon', 'Venue')).toBe('location_on');
    expect(itemIcon('not_a_real_icon', 'Nonsense')).toBe('flag');
  });
});
