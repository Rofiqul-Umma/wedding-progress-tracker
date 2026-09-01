import type { Contact, PlanState } from '@domain/entities/types';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

export function addContact(
  state: PlanState,
  data: Omit<Contact, 'id'>,
): PlanState {
  return { ...state, contacts: addTo(state.contacts, { id: uid(), ...data }) };
}

export function updateContact(
  state: PlanState,
  id: string,
  patch: Partial<Contact>,
): PlanState {
  return { ...state, contacts: updateIn(state.contacts, id, patch) };
}

export interface ContactRemoval {
  state: PlanState;
  removed: Contact | null;
  index: number;
}

export function deleteContact(state: PlanState, id: string): ContactRemoval {
  const r = removeFrom(state.contacts, id);
  return {
    state: { ...state, contacts: r.list },
    removed: r.removed,
    index: r.index,
  };
}

export function insertContact(
  state: PlanState,
  contact: Contact,
  index: number,
): PlanState {
  return { ...state, contacts: insertInto(state.contacts, contact, index) };
}
