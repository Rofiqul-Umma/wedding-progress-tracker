import { describe, it, expect } from 'vitest';
import type { BudgetItem, Vendor, Wedding } from '@domain/entities/types';
import {
  spent,
  totalBudget,
  remaining,
  paidTotal,
  budgetUsedPct,
  vendorsTotal,
  vendorsPaid,
  vendorItemsTotal,
  effectiveVendorCost,
  totalSpent,
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
    const vendors = [
      { cost: 1000, items: [] },
      { cost: 500, items: [] },
      { cost: 0, items: [] },
    ] as unknown as Vendor[];
    expect(vendorsTotal(vendors)).toBe(1500);
  });

  it('counts money paid to vendors: full cost when paid, deposit when down payment', () => {
    const vendors = [
      { cost: 1000, status: 'paid', deposit: 0, items: [] },
      { cost: 2000, status: 'deposit', deposit: 500, items: [] },
      { cost: 800, status: 'booked', deposit: 0, items: [] },
      { cost: 400, status: 'inquiry', deposit: 0, items: [] },
    ] as unknown as Vendor[];
    // 1000 (paid) + 500 (deposit) + 0 + 0
    expect(vendorsPaid(vendors)).toBe(1500);
  });

  it('folds vendor payments into total spent, remaining, and used %', () => {
    const budget = [item({ actual: 200 })];
    const vendors = [
      { cost: 1000, status: 'paid', deposit: 0, items: [] },
      { cost: 2000, status: 'deposit', deposit: 300, items: [] },
    ] as unknown as Vendor[];
    // budget 200 + vendors (1000 + 300) = 1500
    expect(totalSpent(budget, vendors)).toBe(1500);
    expect(remaining(wedding, budget, vendors)).toBe(-500); // target 1000
    expect(budgetUsedPct(wedding, budget, vendors)).toBe(100); // capped
  });

  it('derives a vendor cost from its line items, falling back to the flat cost', () => {
    const flat = { cost: 700, items: [] } as unknown as Vendor;
    expect(vendorItemsTotal(flat)).toBeNull();
    expect(effectiveVendorCost(flat)).toBe(700);

    const itemized = {
      cost: 0,
      items: [
        { id: 'i1', name: 'Dinner', qty: 80, price: 105 },
        { id: 'i2', name: 'Staff', qty: 4, price: 300 },
      ],
    } as unknown as Vendor;
    expect(vendorItemsTotal(itemized)).toBe(9600);
    expect(effectiveVendorCost(itemized)).toBe(9600);
  });

  it('sums and pays itemized vendors by their lines, not a stale stored cost', () => {
    const vendors = [
      {
        cost: 1, // stale: an imported backup where the two disagree
        status: 'paid',
        deposit: 0,
        items: [{ id: 'i1', name: 'Coverage', qty: 2, price: 400 }],
      },
      { cost: 500, status: 'booked', deposit: 0, items: [] },
    ] as unknown as Vendor[];
    expect(vendorsTotal(vendors)).toBe(1300);
    expect(vendorsPaid(vendors)).toBe(800);
  });

  it('treats total spent without vendors as budget-only', () => {
    expect(totalSpent([item({ actual: 250 })])).toBe(250);
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
