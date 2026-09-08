import { describe, it, expect } from 'vitest';
import { THEME_MODES, parseThemeMode, resolveTheme } from './theme';

describe('parseThemeMode', () => {
  it('reads every offered mode', () => {
    for (const mode of THEME_MODES) expect(parseThemeMode(mode)).toBe(mode);
    // Whitespace from a hand-edited storage value shouldn't defeat the lookup.
    expect(parseThemeMode('  dark  ')).toBe('dark');
  });

  it('falls back to following the OS for anything unrecognised', () => {
    // Never leave someone stranded in a theme they can't read.
    expect(parseThemeMode(null)).toBe('system');
    expect(parseThemeMode(undefined)).toBe('system');
    expect(parseThemeMode('')).toBe('system');
    expect(parseThemeMode('   ')).toBe('system');
    expect(parseThemeMode('nonsense')).toBe('system');
    expect(parseThemeMode('DARK')).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('honours an explicit choice regardless of the OS', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('follows the OS in system mode', () => {
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
  });
});
