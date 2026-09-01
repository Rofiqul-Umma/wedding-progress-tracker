import type {
  PlanState,
  Settings,
  Wedding,
} from '@domain/entities/types';

export function updateSettings(
  state: PlanState,
  patch: Partial<Settings>,
): PlanState {
  return { ...state, settings: { ...state.settings, ...patch } };
}

export function updateWedding(
  state: PlanState,
  patch: Partial<Wedding>,
): PlanState {
  return { ...state, wedding: { ...state.wedding, ...patch } };
}

export interface SettingsInput {
  settings: Partial<Settings>;
  wedding: Partial<Wedding>;
}

/** Persist the Settings modal: preferences + wedding details together. */
export function saveSettings(state: PlanState, input: SettingsInput): PlanState {
  return {
    ...state,
    settings: { ...state.settings, ...input.settings },
    wedding: { ...state.wedding, ...input.wedding },
  };
}
