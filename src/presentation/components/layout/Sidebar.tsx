import { useTranslation } from 'react-i18next';
import { PAGES } from './pages';
import { Icon } from '@presentation/components/ui/Icon';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav, type PageId } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { openTasks, sesOpen } from '@domain/services/progress';
import { cn } from '@presentation/lib/cn';

export function useNavCounts(): Record<PageId, number> {
  const { state } = usePlan();
  return {
    dashboard: 0,
    vendors: state.vendors.length,
    budget: state.budget.length,
    tasks: openTasks(state.tasks),
    shopping: state.shopping.filter((i) => i.status !== 'purchased').length,
    seserahan: sesOpen(state.seserahan),
    contacts: state.contacts.length,
    reports: 0,
  };
}

export function Sidebar() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { page, go } = useNav();
  const { openSettings } = useUi();
  const counts = useNavCounts();
  const { p1, p2 } = state.wedding;
  const userName = `${p1 || t('user.partnerFallback')} & ${p2 || ''}`.replace(
    / & $/,
    '',
  );

  return (
    <aside className="flex w-[232px] flex-none flex-col border-r border-line px-[18px] pb-5 pt-[26px] max-[860px]:hidden print:hidden">
      <div className="px-2 pb-[26px] text-[20px] font-extrabold tracking-tight">
        EVER<b className="text-ink">MORE</b>
      </div>
      <nav className="flex flex-col gap-[3px]">
        {PAGES.map((p) => {
          const active = p.id === page;
          const count = counts[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => go(p.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3.5 py-[11px] text-left text-sm font-semibold transition-colors duration-150 ease-planner',
                active
                  ? 'bg-lime font-bold text-ink shadow-sm'
                  : 'text-muted hover:bg-panel hover:text-ink',
              )}
            >
              <Icon name={p.icon} />
              <span className="flex-1">{t(`nav.${p.id}`)}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-2 py-px text-[11px] font-bold',
                    active ? 'bg-black/10 text-lime-ink' : 'bg-panel text-muted',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <div className="flex items-center gap-[11px] rounded-xl p-2">
          <button
            type="button"
            onClick={openSettings}
            title={t('user.settingsTitle')}
            className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-ink text-sm font-bold text-white"
          >
            {(p1 || 'A')[0]}
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-bold">{userName}</div>
            <div className="text-[11.5px] text-faint">{t('user.role')}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={openSettings}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-[11px] text-left text-sm font-semibold text-muted transition-colors hover:bg-panel hover:text-ink"
        >
          <Icon name="settings" />
          <span className="flex-1">{t('common.settings')}</span>
        </button>
      </div>
    </aside>
  );
}
