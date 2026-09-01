import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PageId =
  | 'dashboard'
  | 'vendors'
  | 'budget'
  | 'tasks'
  | 'shopping'
  | 'seserahan'
  | 'contacts'
  | 'reports';

interface NavContextValue {
  page: PageId;
  go: (page: PageId) => void;
  selectedTaskId: string | null;
  selectTask: (id: string | null) => void;
  search: string;
  setSearch: (q: string) => void;
  /** Contact to flash-highlight after a vendor → contact jump. */
  highlightContactId: string | null;
  gotoContact: (id: string) => void;
  consumeHighlight: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [highlightContactId, setHighlightContactId] = useState<string | null>(
    null,
  );

  const go = useCallback((next: PageId) => {
    setPage(next);
    setSearch('');
  }, []);

  const gotoContact = useCallback((id: string) => {
    setHighlightContactId(id);
    setPage('contacts');
    setSearch('');
  }, []);

  const consumeHighlight = useCallback(() => setHighlightContactId(null), []);

  const value = useMemo(
    () => ({
      page,
      go,
      selectedTaskId,
      selectTask: setSelectedTaskId,
      search,
      setSearch,
      highlightContactId,
      gotoContact,
      consumeHighlight,
    }),
    [page, go, selectedTaskId, search, highlightContactId, gotoContact, consumeHighlight],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within a NavProvider');
  return ctx;
}

/** Case-insensitive substring match against the active search query. */
export function useSearchMatch(): (text: string) => boolean {
  const { search } = useNav();
  const q = search.trim().toLowerCase();
  return useCallback((text: string) => !q || text.toLowerCase().includes(q), [q]);
}
