import { describe, it, expect } from 'vitest';
import { isValidImport } from './importValidation';

describe('isValidImport', () => {
  it('accepts an object with a wedding object', () => {
    expect(isValidImport({ wedding: { p1: 'A' } })).toBe(true);
  });

  it('accepts present collections when they are arrays', () => {
    expect(
      isValidImport({ wedding: {}, vendors: [], tasks: [], budget: [] }),
    ).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isValidImport(null)).toBe(false);
    expect(isValidImport('string')).toBe(false);
    expect(isValidImport(42)).toBe(false);
    expect(isValidImport(undefined)).toBe(false);
  });

  it('rejects a missing or non-object wedding', () => {
    expect(isValidImport({})).toBe(false);
    expect(isValidImport({ wedding: null })).toBe(false);
    expect(isValidImport({ wedding: 'nope' })).toBe(false);
  });

  it('rejects a present collection that is not an array', () => {
    expect(isValidImport({ wedding: {}, vendors: 'not-array' })).toBe(false);
    expect(isValidImport({ wedding: {}, tasks: {} })).toBe(false);
  });

  it('accepts an array shopping collection but rejects a non-array one', () => {
    expect(isValidImport({ wedding: {}, shopping: [] })).toBe(true);
    expect(isValidImport({ wedding: {}, shopping: 'nope' })).toBe(false);
  });
});
