import type { Guest, PlanState } from '@domain/entities/types';
import { nextRsvpStatus } from '@domain/value-objects/status';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

export function addGuest(
  state: PlanState,
  data: Omit<Guest, 'id'>,
): PlanState {
  return { ...state, guests: addTo(state.guests, { id: uid(), ...data }) };
}

export function updateGuest(
  state: PlanState,
  id: string,
  patch: Partial<Guest>,
): PlanState {
  return { ...state, guests: updateIn(state.guests, id, patch) };
}

export function cycleGuestRsvp(state: PlanState, id: string): PlanState {
  const item = state.guests.find((g) => g.id === id);
  if (!item) return state;
  return updateGuest(state, id, { rsvp: nextRsvpStatus(item.rsvp) });
}

export interface GuestRemoval {
  state: PlanState;
  removed: Guest | null;
  index: number;
}

export function deleteGuest(state: PlanState, id: string): GuestRemoval {
  const r = removeFrom(state.guests, id);
  return {
    state: { ...state, guests: r.list },
    removed: r.removed,
    index: r.index,
  };
}

export function insertGuest(
  state: PlanState,
  guest: Guest,
  index: number,
): PlanState {
  return { ...state, guests: insertInto(state.guests, guest, index) };
}
