import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@presentation/components/ui/Icon';
import { ProgressBar } from '@presentation/components/ui/ProgressBar';
import { usePlan } from '@presentation/state/PlanStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { daysUntil } from '@domain/services/schedule';
import {
  totalSpent,
  totalBudget,
  budgetUsedPct,
} from '@domain/services/budget';
import {
  tasksDone,
  openTasks,
  taskPct,
  sesDone,
  sesPct,
  shopBought,
  shopPct,
} from '@domain/services/progress';
import { cn } from '@presentation/lib/cn';

interface CardProps {
  hero?: boolean;
  icon: string;
  label: string;
  value: string;
  bar?: { value: number; color: string };
  sub: string;
}

function OverviewCard({ hero, icon, label, value, bar, sub }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-[9px] rounded-card border p-4 shadow-sm',
        hero ? 'border-lime bg-lime' : 'border-line bg-app',
      )}
    >
      <div className="flex items-center gap-[9px]">
        <span
          className={cn(
            'grid h-[30px] w-[30px] place-items-center rounded-[9px]',
            // The hero badge sits on the lime fill, which is identical in both
            // themes — so both the black wash and its ink stay put.
            hero ? 'bg-black/10 text-on-lime' : 'bg-panel text-ink',
          )}
        >
          <Icon name={icon} size={18} />
        </span>
        <span
          className={cn(
            'text-[12.5px] font-bold',
            hero ? 'text-on-lime' : 'text-muted',
          )}
        >
          {label}
        </span>
      </div>
      <div
        className={cn(
          'text-[26px] font-extrabold leading-[1.1] tracking-tight tnum',
          // Otherwise the hero number inherits `ink`, which inverts to near-white
          // in dark mode and vanishes against the (unchanged) lime fill.
          hero && 'text-on-lime',
        )}
      >
        {value}
      </div>
      {bar && <ProgressBar value={bar.value} color={bar.color} height={7} />}
      <div
        className={cn(
          'mt-auto text-xs font-semibold',
          hero ? 'text-on-lime' : 'text-faint',
        )}
      >
        {sub}
      </div>
    </div>
  );
}

export function OverviewCards() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { money, date } = useFormat();
  const { wedding, budget, vendors, tasks, seserahan, shopping } = state;

  const dleft = daysUntil(wedding.date);
  const sp = totalSpent(budget, vendors, shopping);
  const tb = totalBudget(wedding);
  const rem = tb - sp;
  const budPct = budgetUsedPct(wedding, budget, vendors, shopping);

  const countdown =
    dleft === null
      ? t('overview.setDate')
      : dleft > 0
        ? t('overview.days', { count: dleft })
        : dleft === 0
          ? t('overview.today')
          : t('overview.married');

  const budgetSub =
    t('overview.budgetSub', { spent: money(sp), total: money(tb) }) +
    (rem < 0 ? ` · ${t('overview.over', { amount: money(-rem) })}` : '');

  const sT = seserahan.length;
  const shopT = shopping.length;
  const cards: (ReactNode | null)[] = [
    <OverviewCard
      key="countdown"
      hero
      icon="favorite"
      label={t('overview.countdown')}
      value={countdown}
      sub={wedding.date ? date(wedding.date) : t('overview.addDate')}
    />,
    <OverviewCard
      key="budget"
      icon="account_balance_wallet"
      label={t('overview.budgetUsed')}
      value={`${budPct}%`}
      bar={{ value: budPct, color: rem < 0 ? 'var(--color-bad)' : 'var(--color-lime-2)' }}
      sub={budgetSub}
    />,
    <OverviewCard
      key="tasks"
      icon="checklist"
      label={t('overview.tasksDone')}
      value={`${tasksDone(tasks)}/${tasks.length}`}
      bar={{ value: taskPct(tasks), color: 'var(--color-info)' }}
      sub={t('overview.stillOpen', { count: openTasks(tasks) })}
    />,
    <OverviewCard
      key="seserahan"
      icon="redeem"
      label={t('overview.seserahan')}
      value={`${sesDone(seserahan)}/${sT}`}
      bar={{ value: sesPct(seserahan), color: 'var(--color-warn)' }}
      sub={sT ? t('overview.prepared', { pct: sesPct(seserahan) }) : t('overview.noItems')}
    />,
    <OverviewCard
      key="shopping"
      icon="shopping_bag"
      label={t('overview.shopping')}
      value={`${shopBought(shopping)}/${shopT}`}
      bar={{ value: shopPct(shopping), color: 'var(--color-lime-2)' }}
      sub={shopT ? t('overview.bought', { pct: shopPct(shopping) }) : t('overview.noItems')}
    />,
  ];

  return (
    <div className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(178px,1fr))] gap-3.5">
      {cards}
    </div>
  );
}
