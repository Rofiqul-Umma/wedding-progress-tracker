import { describe, it, expect } from 'vitest';
import type { BudgetItem, Vendor, Wedding } from '@domain/entities/types';
import {
  spent,
  totalBudget,
  remaining,
  paidTotal,
  budgetUsedPct,
  vendorsTotal,
  categoryRollup,
  maxCategoryValue,
} from './budget';

const item = (over: Partial<BudgetItem> = {}): BudgetItem => ({
  id: 'b' + Math.random(),
  category: 'Venue',
  item: 'Rental',
  estimated: 100,
  actual: 100,
  paid: false,
  ...over,
});

const wedding: Wedding = { p1: '', p2: '', date: '', venue: '', budget: 1000 };

describe('budget service', () => {
  it('sums actual spend, ignoring non-numeric values', () => {
    const budget = [
      item({ actual: 100 }),
      item({ actual: 250 }),
      item({ actual: NaN as unknown as number }),
    ];
    expect(spent(budget)).toBe(350);
  });

  it('reads the wedding budget target with a 0 fallback', () => {
    expect(totalBudget(wedding)).toBe(1000);
    expect(totalBudget({ ...wedding, budget: NaN as unknown as number })).toBe(0);
  });

  it('computes remaining as target minus spend (negative when over)', () => {
    expect(remaining(wedding, [item({ actual: 400 })])).toBe(600);
    expect(remaining({ ...wedding, budget: 300 }, [item({ actual: 400 })])).toBe(-100);
  });

  it('totals only paid items', () => {
    const budget = [
      item({ actual: 100, paid: true }),
      item({ actual: 250, paid: false }),
      item({ actual: 50, paid: true }),
    ];
    expect(paidTotal(budget)).toBe(150);
  });

  it('caps budget-used percentage at 100 and returns 0 without a target', () => {
    expect(budgetUsedPct(wedding, [item({ actual: 250 })])).toBe(25);
    expect(budgetUsedPct(wedding, [item({ actual: 5000 })])).toBe(100);
    expect(budgetUsedPct({ ...wedding, budget: 0 }, [item({ actual: 250 })])).toBe(0);
  });

  it('sums vendor costs', () => {
    const vendors = [{ cost: 1000 }, { cost: 500 }, { cost: 0 }] as Vendor[];
    expect(vendorsTotal(vendors)).toBe(1500);
  });

  it('rolls categories up, sorts by actual desc, and flags over-estimate', () => {
    const budget = [
      item({ category: 'Venue', estimated: 100, actual: 200 }),
      item({ category: 'Cake', estimated: 500, actual: 250 }),
      item({ category: 'Venue', estimated: 100, actual: 100 }),
    ];
    const roll = categoryRollup(budget);
    // Venue: actual 300 > estimated 200 → over; sorts above Cake (250).
    expect(roll[0].name).toBe('Venue');
    expect(roll[0].actual).toBe(300);
    expect(roll[0].estimated).toBe(200);
    expect(roll[0].over).toBe(true);
    expect(roll[1].name).toBe('Cake');
    expect(roll[1].over).toBe(false);
  });

  it('falls back to "Other" for blank categories', () => {
    const roll = categoryRollup([item({ category: '', actual: 10, estimated: 0 })]);
    expect(roll[0].name).toBe('Other');
  });

  it('derives the max bar-scaling value with a floor of 1', () => {
    expect(maxCategoryValue([])).toBe(1);
    const roll = categoryRollup([item({ category: 'A', actual: 50, estimated: 80 })]);
    expect(maxCategoryValue(roll)).toBe(80);
  });
});
