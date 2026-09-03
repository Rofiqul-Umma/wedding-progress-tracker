import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav } from '@presentation/state/NavStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { getNotifications } from '@domain/services/schedule';
import { cn } from '@presentation/lib/cn';

const IC_TONE: Record<string, string> = {
  bad: 'bg-bad-soft text-bad',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
};

export function NotificationsPanel() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { go } = useNav();
  const { money } = useFormat();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const list = getNotifications(state);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  function messageFor(m: { key: string; count?: number; amount?: number }) {
    if (m.amount != null) return t(m.key, { amount: money(m.amount) });
    if (m.count != null) return t(m.key, { count: m.count });
    return t(m.key);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        title={t('notif.title')}
        aria-label={t('notif.title')}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative grid h-[42px] w-[42px] place-items-center rounded-xl border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink"
      >
        <Icon name="notifications" />
        {list.length > 0 && (
          <span className="absolute right-2.5 top-[9px] h-2 w-2 rounded-full border-2 border-white bg-bad" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[50px] z-[60] w-[328px] max-w-[calc(100vw-2rem-var(--sa-left)-var(--sa-right))] overflow-hidden rounded-card border border-line bg-app shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5 text-sm font-bold">
            {t('notif.title')}
            <span className="rounded-full bg-panel px-[9px] py-0.5 text-xs font-semibold text-muted">
              {list.length}
            </span>
          </div>
          {list.length ? (
            list.map((n, i) => (
              <button
                key={`${n.page}-${i}`}
                type="button"
                onClick={() => {
                  setOpen(false);
                  go(n.page);
                }}
                className="flex w-full items-center gap-[11px] border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-panel"
              >
                <span
                  className={cn(
                    'grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px]',
                    IC_TONE[n.kind],
                  )}
                >
                  <Icon name={n.icon} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">
                    {n.title}
                  </span>
                  <span className="mt-px block text-xs text-muted">
                    {messageFor(n.message)}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-7 text-center text-[13.5px] text-faint">
              {t('notif.emptyLine1')}
              <br />
              {t('notif.emptyLine2')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
