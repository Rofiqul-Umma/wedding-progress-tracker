import type { PlanState, Vendor } from '@domain/entities/types';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

export function addVendor(state: PlanState, data: Omit<Vendor, 'id'>): PlanState {
  return { ...state, vendors: addTo(state.vendors, { id: uid(), ...data }) };
}

export function updateVendor(
  state: PlanState,
  id: string,
  patch: Partial<Vendor>,
): PlanState {
  return { ...state, vendors: updateIn(state.vendors, id, patch) };
}

export interface VendorRemoval {
  state: PlanState;
  removed: Vendor | null;
  index: number;
}

export function deleteVendor(state: PlanState, id: string): VendorRemoval {
  const r = removeFrom(state.vendors, id);
  return { state: { ...state, vendors: r.list }, removed: r.removed, index: r.index };
}

export function insertVendor(
  state: PlanState,
  vendor: Vendor,
  index: number,
): PlanState {
  return { ...state, vendors: insertInto(state.vendors, vendor, index) };
}
