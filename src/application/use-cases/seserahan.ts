import type { PlanState, SeserahanItem } from '@domain/entities/types';
import { nextSeserahanStatus } from '@domain/value-objects/status';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

export function addSeserahan(
  state: PlanState,
  data: Omit<SeserahanItem, 'id'>,
): PlanState {
  return { ...state, seserahan: addTo(state.seserahan, { id: uid(), ...data }) };
}

export function updateSeserahan(
  state: PlanState,
  id: string,
  patch: Partial<SeserahanItem>,
): PlanState {
  return { ...state, seserahan: updateIn(state.seserahan, id, patch) };
}

export interface SeserahanRemoval {
  state: PlanState;
  removed: SeserahanItem | null;
  index: number;
}

export function deleteSeserahan(state: PlanState, id: string): SeserahanRemoval {
  const r = removeFrom(state.seserahan, id);
  return {
    state: { ...state, seserahan: r.list },
    removed: r.removed,
    index: r.index,
  };
}

export function insertSeserahan(
  state: PlanState,
  item: SeserahanItem,
  index: number,
): PlanState {
  return { ...state, seserahan: insertInto(state.seserahan, item, index) };
}

/** Advance a seserahan item to the next status in the lifecycle. */
export function cycleSeserahanStatus(state: PlanState, id: string): PlanState {
  return {
    ...state,
    seserahan: state.seserahan.map((i) =>
      i.id === id ? { ...i, status: nextSeserahanStatus(i.status) } : i,
    ),
  };
}
