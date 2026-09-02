import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarContent } from './Sidebar';
import { useUi } from '@presentation/state/UiStore';

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Slide-in navigation drawer for narrow viewports (replaces the old bottom bar).
 * Opened from the Topbar hamburger; closes on selection, backdrop click, or Esc.
 */
export function MobileDrawer() {
  const { t } = useTranslation();
  const { navOpen, closeNav } = useUi();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const shell = document.getElementById('app-shell');
    shell?.setAttribute('inert', '');
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    const timer = window.setTimeout(() => first?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      shell?.removeAttribute('inert');
      previouslyFocused?.focus?.();
    };
  }, [navOpen]);

  if (!navOpen) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[95] hidden bg-ink/40 backdrop-blur-[3px] max-[860px]:flex print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeNav();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeNav();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu')}
        className="drawer-in flex h-full w-[264px] max-w-[82vw] flex-col overflow-y-auto bg-app shadow-lg pl-[env(safe-area-inset-left)] pb-[env(safe-area-inset-bottom)]"
      >
        <SidebarContent onNavigate={closeNav} />
      </div>
    </div>
  );
}
