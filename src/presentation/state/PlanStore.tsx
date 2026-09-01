import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { PlanState } from '@domain/entities/types';
import { LocalStoragePlanRepository } from '@infrastructure/persistence/LocalStoragePlanRepository';
import i18n from '@infrastructure/i18n/config';

const repo = new LocalStoragePlanRepository();

interface PlanContextValue {
  state: PlanState;
  setState: Dispatch<SetStateAction<PlanState>>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

/**
 * Holds the single source of truth for plan state. Persists to the repository
 * after every change and keeps i18next + <html lang> in sync with settings.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlanState>(() => repo.load());

  useEffect(() => {
    repo.save(state);
  }, [state]);

  useEffect(() => {
    void i18n.changeLanguage(state.settings.lang);
    document.documentElement.lang = state.settings.lang;
  }, [state.settings.lang]);

  return (
    <PlanContext.Provider value={{ state, setState }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}
