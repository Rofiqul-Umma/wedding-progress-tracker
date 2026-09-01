import { useTranslation } from 'react-i18next';
import { PAGES } from './pages';
import { Icon } from '@presentation/components/ui/Icon';
import { useNav } from '@presentation/state/NavStore';
import { cn } from '@presentation/lib/cn';

/** Bottom navigation bar shown on narrow viewports. */
export function MobileNav() {
  const { t } = useTranslation();
  const { page, go } = useNav();

  return (
    <nav
      id="mobile-nav"
      className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-line bg-white/95 px-1.5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-[10px] max-[860px]:flex print:hidden"
    >
      {PAGES.map((p) => {
        const active = p.id === page;
        const label = p.id === 'dashboard' ? t('nav.dashboardShort') : t(`nav.${p.id}`);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => go(p.id)}
            className={cn(
              'grid flex-1 justify-items-center gap-[3px] rounded-[10px] px-0.5 py-1.5 text-[10px] font-bold',
              active ? 'text-ink' : 'text-faint',
            )}
          >
            <Icon name={p.icon} size={23} className={active ? 'text-lime-2' : undefined} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
