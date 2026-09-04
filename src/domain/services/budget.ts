import type { BudgetItem, ShoppingItem, Vendor, Wedding } from '@domain/entities/types';

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

/** One vendor with money already paid, and how much. */
export interface PaidVendorEntry {
  vendor: Vendor;
  amount: number;
}

/**
 * The vendors money has actually gone to: the full cost once a vendor is paid,
 * the recorded down payment while a deposit is outstanding, nothing before
 * that. The single definition of "a vendor that counts as spend", shared by the
 * budget totals and the Budget page's list.
 */
export function paidVendorEntries(vendors: Vendor[]): PaidVendorEntry[] {
  return vendors
    .map((vendor) => ({
      vendor,
      amount:
        vendor.status === 'paid'
          ? effectiveVendorCost(vendor)
          : vendor.status === 'deposit'
            ? +(vendor.deposit ?? 0) || 0
            : 0,
    }))
    .filter((e) => e.amount > 0);
}

/** Money actually paid to vendors. */
export function vendorsPaid(vendors: Vendor[]): number {
  return paidVendorEntries(vendors).reduce((a, e) => a + e.amount, 0);
}

/**
 * The shopping items money has already gone out the door for. Ordered and
 * to-buy items are money not yet spent, so they do not count.
 */
export function paidShoppingItems(shopping: ShoppingItem[]): ShoppingItem[] {
  return shopping.filter((i) => i.status === 'purchased');
}

/** The line total of one shopping item, with the quantity clamped to one line. */
export function shoppingLineTotal(item: ShoppingItem): number {
  return (+item.price || 0) * Math.max(1, +item.qty || 1);
}

/** Money spent on shopping: the line total of every purchased item. */
export function shoppingPaid(shopping: ShoppingItem[]): number {
  return paidShoppingItems(shopping).reduce((a, i) => a + shoppingLineTotal(i), 0);
}

/** Total actually spent = budget line items + vendor payments + shopping bought. */
export function totalSpent(
  budget: BudgetItem[],
  vendors: Vendor[] = [],
  shopping: ShoppingItem[] = [],
): number {
  return spent(budget) + vendorsPaid(vendors) + shoppingPaid(shopping);
}

/** The overall wedding budget target. */
export function totalBudget(wedding: Wedding): number {
  return +wedding.budget || 0;
}

/** Budget remaining (negative means over budget), every payment included. */
export function remaining(
  wedding: Wedding,
  budget: BudgetItem[],
  vendors: Vendor[] = [],
  shopping: ShoppingItem[] = [],
): number {
  return totalBudget(wedding) - totalSpent(budget, vendors, shopping);
}

/** Total already paid off: paid budget rows plus purchased shopping. */
export function paidTotal(
  budget: BudgetItem[],
  shopping: ShoppingItem[] = [],
): number {
  return (
    budget.filter((b) => b.paid).reduce((a, b) => a + (+b.actual || 0), 0) +
    shoppingPaid(shopping)
  );
}

/** Percentage of budget used (0–100, capped), every payment included. */
export function budgetUsedPct(
  wedding: Wedding,
  budget: BudgetItem[],
  vendors: Vendor[] = [],
  shopping: ShoppingItem[] = [],
): number {
  const tb = totalBudget(wedding);
  return tb > 0
    ? Math.min(100, Math.round((totalSpent(budget, vendors, shopping) / tb) * 100))
    : 0;
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

/**
 * Roll spend up by category. Vendors and shopping fold into `actual` only:
 * neither carries an estimate, so a category made purely of them keeps
 * `estimated: 0` and is never flagged over target.
 */
export function categoryRollup(
  budget: BudgetItem[],
  vendors: Vendor[] = [],
  shopping: ShoppingItem[] = [],
): CategoryRollup[] {
  const cats: Record<string, { act: number; est: number }> = {};
  const bump = (category: string, actual: number, estimated = 0) => {
    const k = category || 'Other';
    cats[k] = cats[k] || { act: 0, est: 0 };
    cats[k].act += actual;
    cats[k].est += estimated;
  };
  for (const b of budget) {
    bump(b.category, +b.actual || 0, +b.estimated || 0);
  }
  for (const e of paidVendorEntries(vendors)) {
    bump(e.vendor.category, e.amount);
  }
  for (const i of paidShoppingItems(shopping)) {
    bump(i.category, shoppingLineTotal(i));
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
