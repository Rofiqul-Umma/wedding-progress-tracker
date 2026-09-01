import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FormDescriptor } from '@presentation/components/forms/types';

interface UiContextValue {
  form: FormDescriptor | null;
  openForm: (f: FormDescriptor) => void;
  closeForm: () => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  navOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormDescriptor | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const openForm = useCallback((f: FormDescriptor) => setForm(f), []);
  const closeForm = useCallback(() => setForm(null), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const value = useMemo(
    () => ({
      form,
      openForm,
      closeForm,
      settingsOpen,
      openSettings,
      closeSettings,
      navOpen,
      openNav,
      closeNav,
    }),
    [
      form,
      openForm,
      closeForm,
      settingsOpen,
      openSettings,
      closeSettings,
      navOpen,
      openNav,
      closeNav,
    ],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within a UiProvider');
  return ctx;
}
