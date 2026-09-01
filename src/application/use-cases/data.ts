import type { PlanState, Settings } from '@domain/entities/types';

/** Serialize the plan for a downloadable backup. */
export function serializePlan(state: PlanState): string {
  return JSON.stringify(state, null, 2);
}

/** A blank plan that preserves the current currency + language preferences. */
export function blankState(prev: Settings): PlanState {
  return {
    settings: { currency: prev.currency || 'USD', lang: prev.lang || 'en' },
    wedding: { p1: 'Partner 1', p2: 'Partner 2', date: '', venue: '', budget: 0 },
    vendors: [],
    budget: [],
    tasks: [],
    seserahan: [],
    shopping: [],
    contacts: [],
  };
}

/** Clear all plan data, keeping preferences. */
export function clearData(state: PlanState): PlanState {
  return blankState(state.settings);
}
