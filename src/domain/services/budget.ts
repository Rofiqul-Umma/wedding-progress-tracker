import type { BudgetItem, Vendor, Wedding } from '@domain/entities/types';

/** Total actually spent across all budget items. */
export function spent(budget: BudgetItem[]): number {
  return budget.reduce((a, b) => a + (+b.actual || 0), 0);
}

/** The overall wedding budget target. */
export function totalBudget(wedding: Wedding): number {
  return +wedding.budget || 0;
}

/** Budget remaining (negative means over budget). */
export function remaining(wedding: Wedding, budget: BudgetItem[]): number {
  return totalBudget(wedding) - spent(budget);
}

/** Total already paid off. */
export function paidTotal(budget: BudgetItem[]): number {
  return budget
    .filter((b) => b.paid)
    .reduce((a, b) => a + (+b.actual || 0), 0);
}

/** Percentage of budget used (0–100, capped). */
export function budgetUsedPct(wedding: Wedding, budget: BudgetItem[]): number {
  const tb = totalBudget(wedding);
  return tb > 0 ? Math.min(100, Math.round((spent(budget) / tb) * 100)) : 0;
}

/** Sum of all vendor costs (money committed). */
export function vendorsTotal(vendors: Vendor[]): number {
  return vendors.reduce((a, v) => a + (+v.cost || 0), 0);
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
