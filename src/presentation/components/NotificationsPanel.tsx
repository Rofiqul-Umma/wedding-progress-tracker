import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav } from '@presentation/state/NavStore';
import { usePush } from '@presentation/state/PushStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { useBackDismiss } from '@presentation/hooks/useBackDismiss';
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
  const push = usePush();
  const { money } = useFormat();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const list = getNotifications(state);

  useBackDismiss(open, () => setOpen(false));

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
        <>
          {/* Mobile backdrop to dismiss and prevent clicking elements behind */}
          <div
            className="fixed inset-0 z-[65] bg-black/25 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className={cn(
              'popover-in z-[70] flex flex-col overflow-hidden rounded-card border border-line bg-app shadow-xl',
              // Mobile: centered and bounded within the viewport with safe areas
              'fixed left-3 right-3 top-[calc(var(--sa-top)+4.25rem)] mx-auto max-h-[calc(100dvh-5.5rem-var(--sa-top)-var(--sa-bottom))] w-auto max-w-[360px]',
              // Desktop: anchored dropdown to the bell icon button
              'sm:absolute sm:inset-auto sm:right-0 sm:top-[50px] sm:max-h-[min(540px,calc(100vh-6rem))] sm:w-[340px] sm:max-w-none',
            )}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b border-line px-4 py-3 text-sm font-bold">
              <div className="flex items-center gap-2">
                <span>{t('notif.title')}</span>
                <span className="rounded-full bg-panel px-[9px] py-0.5 text-xs font-semibold text-muted">
                  {list.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-panel hover:text-ink sm:hidden"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 min-h-0 overflow-y-auto">
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

            {/* Pinned push notification footer */}
            <div className="flex-none border-t border-line bg-panel/40 px-4 py-3">
              {push.iosInstallRequired ? (
                <div className="grid gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Icon name="upload" size={14} className="text-lime-ink flex-none" />
                    <span>{t('notif.pushLabel')}</span>
                  </div>
                  <p className="text-[11px] leading-snug text-muted">
                    {t('notif.pushIosGuide')}
                  </p>
                </div>
              ) : !push.supported ? (
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-muted">
                    {t('notif.pushLabel')}
                  </span>
                  <p className="text-[11px] leading-snug text-muted">
                    {t('notif.pushUnsupported')}
                  </p>
                </div>
              ) : push.status === 'denied' ? (
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-muted">
                    {t('notif.pushLabel')}
                  </span>
                  <p className="text-xs text-bad">{t('notif.pushDenied')}</p>
                </div>
              ) : push.status === 'enabled' ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-lime-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    {t('notif.pushActive')}
                  </span>
                  <button
                    type="button"
                    onClick={() => void push.disable()}
                    className="flex-none rounded-lg border border-line bg-app px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:bg-panel hover:text-ink"
                  >
                    {t('notif.pushDisable')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">
                      {t('notif.pushLabel')}
                    </span>
                    <button
                      type="button"
                      disabled={push.status === 'enabling'}
                      onClick={() => void push.enable()}
                      className="flex-none whitespace-nowrap rounded-lg bg-lime px-3 py-1.5 text-xs font-bold text-on-lime shadow-sm transition-all hover:bg-lime-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {t(push.status === 'enabling' ? 'notif.pushEnabling' : 'notif.pushEnable')}
                    </button>
                  </div>
                  <p className="text-[11px] leading-snug text-faint">{t('notif.pushNote')}</p>
                  {push.status === 'error' && (
                    <p className="text-[11px] text-bad">{t('notif.pushError')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
