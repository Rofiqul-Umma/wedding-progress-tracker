import type { BudgetItem, PlanState } from '@domain/entities/types';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

export function addBudgetItem(
  state: PlanState,
  data: Omit<BudgetItem, 'id'>,
): PlanState {
  return { ...state, budget: addTo(state.budget, { id: uid(), ...data }) };
}

export function updateBudgetItem(
  state: PlanState,
  id: string,
  patch: Partial<BudgetItem>,
): PlanState {
  return { ...state, budget: updateIn(state.budget, id, patch) };
}

export interface BudgetRemoval {
  state: PlanState;
  removed: BudgetItem | null;
  index: number;
}

export function deleteBudgetItem(state: PlanState, id: string): BudgetRemoval {
  const r = removeFrom(state.budget, id);
  return { state: { ...state, budget: r.list }, removed: r.removed, index: r.index };
}

export function insertBudgetItem(
  state: PlanState,
  item: BudgetItem,
  index: number,
): PlanState {
  return { ...state, budget: insertInto(state.budget, item, index) };
}

export function toggleBudgetPaid(state: PlanState, id: string): PlanState {
  return {
    ...state,
    budget: state.budget.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
  };
}
