import type { PlanState, ShoppingItem } from '@domain/entities/types';
import { nextShoppingStatus } from '@domain/value-objects/status';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

export function addShopping(
  state: PlanState,
  data: Omit<ShoppingItem, 'id'>,
): PlanState {
  return { ...state, shopping: addTo(state.shopping, { id: uid(), ...data }) };
}

export function updateShopping(
  state: PlanState,
  id: string,
  patch: Partial<ShoppingItem>,
): PlanState {
  return { ...state, shopping: updateIn(state.shopping, id, patch) };
}

export interface ShoppingRemoval {
  state: PlanState;
  removed: ShoppingItem | null;
  index: number;
}

export function deleteShopping(state: PlanState, id: string): ShoppingRemoval {
  const r = removeFrom(state.shopping, id);
  return {
    state: { ...state, shopping: r.list },
    removed: r.removed,
    index: r.index,
  };
}

export function insertShopping(
  state: PlanState,
  item: ShoppingItem,
  index: number,
): PlanState {
  return { ...state, shopping: insertInto(state.shopping, item, index) };
}

/** Advance a shopping item to the next status in the lifecycle. */
export function cycleShoppingStatus(state: PlanState, id: string): PlanState {
  return {
    ...state,
    shopping: state.shopping.map((i) =>
      i.id === id ? { ...i, status: nextShoppingStatus(i.status) } : i,
    ),
  };
}
