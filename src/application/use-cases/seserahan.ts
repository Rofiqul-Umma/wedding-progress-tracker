import type {
  PlanState,
  SeserahanContent,
  SeserahanItem,
} from '@domain/entities/types';
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

/**
 * Advance a seserahan item to the next status in the lifecycle. A bundle is
 * left untouched: its status is derived from its contents, so setting it here
 * would produce a chip that contradicts the checklist.
 */
export function cycleSeserahanStatus(state: PlanState, id: string): PlanState {
  return {
    ...state,
    seserahan: state.seserahan.map((i) =>
      i.id === id && !i.contents.length
        ? { ...i, status: nextSeserahanStatus(i.status) }
        : i,
    ),
  };
}

/** Tick or untick one item inside a tray's bundle. */
export function toggleSeserahanContent(
  state: PlanState,
  itemId: string,
  contentId: string,
): PlanState {
  return {
    ...state,
    seserahan: state.seserahan.map((i) =>
      i.id === itemId
        ? {
            ...i,
            contents: i.contents.map((c) =>
              c.id === contentId ? { ...c, done: !c.done } : c,
            ),
          }
        : i,
    ),
  };
}

/** Replace a tray's bundle contents wholesale (used by the edit form). */
export function setSeserahanContents(
  state: PlanState,
  itemId: string,
  contents: SeserahanContent[],
): PlanState {
  return {
    ...state,
    seserahan: state.seserahan.map((i) => (i.id === itemId ? { ...i, contents } : i)),
  };
}
