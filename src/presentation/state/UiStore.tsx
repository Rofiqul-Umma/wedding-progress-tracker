import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FormDescriptor } from '@presentation/components/forms/types';

/** Which entity a read-only preview dialog should show. */
export type PreviewTarget =
  | { kind: 'task'; id: string }
  | { kind: 'vendor'; id: string }
  | { kind: 'shopping'; id: string }
  | { kind: 'seserahan'; id: string };

/** A full-size image shown over the app (attachment / reference photo). */
export interface ImageView {
  src: string;
  alt: string;
}

interface UiContextValue {
  form: FormDescriptor | null;
  openForm: (f: FormDescriptor) => void;
  closeForm: () => void;
  preview: PreviewTarget | null;
  openPreview: (p: PreviewTarget) => void;
  closePreview: () => void;
  image: ImageView | null;
  openImage: (src: string, alt: string) => void;
  closeImage: () => void;
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
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [image, setImage] = useState<ImageView | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const openForm = useCallback((f: FormDescriptor) => setForm(f), []);
  const closeForm = useCallback(() => setForm(null), []);
  const openPreview = useCallback((p: PreviewTarget) => setPreview(p), []);
  const closePreview = useCallback(() => setPreview(null), []);
  const openImage = useCallback((src: string, alt: string) => setImage({ src, alt }), []);
  const closeImage = useCallback(() => setImage(null), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const value = useMemo(
    () => ({
      form,
      openForm,
      closeForm,
      preview,
      openPreview,
      closePreview,
      image,
      openImage,
      closeImage,
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
      preview,
      openPreview,
      closePreview,
      image,
      openImage,
      closeImage,
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
