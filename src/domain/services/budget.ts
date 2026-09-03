import type { BudgetItem, Vendor, Wedding } from '@domain/entities/types';

/** Total actually spent across all budget items. */
export function spent(budget: BudgetItem[]): number {
  return budget.reduce((a, b) => a + (+b.actual || 0), 0);
}

/** Sum of a vendor's quote line items, or null when it has none. */
export function vendorItemsTotal(v: Vendor): number | null {
  const items = v.items ?? [];
  if (!items.length) return null;
  return items.reduce((a, i) => a + (+i.price || 0) * Math.max(1, +i.qty || 1), 0);
}

/**
 * The cost to display and sum. An itemized vendor derives it from its lines, so
 * the headline figure can never contradict the breakdown; a flat-cost vendor
 * keeps the hand-entered value.
 */
export function effectiveVendorCost(v: Vendor): number {
  return vendorItemsTotal(v) ?? (+v.cost || 0);
}

/**
 * Money actually paid to vendors: the full cost once a vendor is paid, the
 * recorded down payment while a deposit is outstanding, nothing before that.
 */
export function vendorsPaid(vendors: Vendor[]): number {
  return vendors.reduce((a, v) => {
    if (v.status === 'paid') return a + effectiveVendorCost(v);
    if (v.status === 'deposit') return a + (+(v.deposit ?? 0) || 0);
    return a;
  }, 0);
}

/** Total actually spent = budget line items + money paid to vendors. */
export function totalSpent(budget: BudgetItem[], vendors: Vendor[] = []): number {
  return spent(budget) + vendorsPaid(vendors);
}

/** The overall wedding budget target. */
export function totalBudget(wedding: Wedding): number {
  return +wedding.budget || 0;
}

/** Budget remaining (negative means over budget), vendor payments included. */
export function remaining(
  wedding: Wedding,
  budget: BudgetItem[],
  vendors: Vendor[] = [],
): number {
  return totalBudget(wedding) - totalSpent(budget, vendors);
}

/** Total already paid off. */
export function paidTotal(budget: BudgetItem[]): number {
  return budget
    .filter((b) => b.paid)
    .reduce((a, b) => a + (+b.actual || 0), 0);
}

/** Percentage of budget used (0–100, capped), vendor payments included. */
export function budgetUsedPct(
  wedding: Wedding,
  budget: BudgetItem[],
  vendors: Vendor[] = [],
): number {
  const tb = totalBudget(wedding);
  return tb > 0 ? Math.min(100, Math.round((totalSpent(budget, vendors) / tb) * 100)) : 0;
}

/** Sum of all vendor costs (money committed). */
export function vendorsTotal(vendors: Vendor[]): number {
  return vendors.reduce((a, v) => a + effectiveVendorCost(v), 0);
}

/** A per-category actual-vs-estimate rollup, sorted by actual descending. */
export interface CategoryRollup {
  name: string;
  actual: number;
  estimated: number;
  /** true when there is an estimate and actual exceeds it. */
  over: boolean;
}

export function categoryRollup(budget: BudgetItem[]): CategoryRollup[] {
  const cats: Record<string, { act: number; est: number }> = {};
  for (const b of budget) {
    const k = b.category || 'Other';
    cats[k] = cats[k] || { act: 0, est: 0 };
    cats[k].act += +b.actual || 0;
    cats[k].est += +b.estimated || 0;
  }
  return Object.entries(cats)
    .map(([name, c]) => ({
      name,
      actual: c.act,
      estimated: c.est,
      over: c.est > 0 && c.act > c.est,
    }))
    .sort((a, b) => b.actual - a.actual);
}

/** The largest actual/estimate value across categories (min 1), for bar scaling. */
export function maxCategoryValue(rollup: CategoryRollup[]): number {
  return Math.max(1, ...rollup.map((c) => Math.max(c.actual, c.estimated)));
}
