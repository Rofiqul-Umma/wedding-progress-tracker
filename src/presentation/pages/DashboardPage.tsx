import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewCards } from '@presentation/components/dashboard/OverviewCards';
import { Avatar } from '@presentation/components/ui/Avatar';
import { EmptyRow } from '@presentation/components/ui/EmptyState';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav, useSearchMatch } from '@presentation/state/NavStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { useCategoryLabel } from '@presentation/hooks/useCategoryLabel';
import { categoryColor } from '@domain/value-objects/status';
import { itemIcon } from '@domain/value-objects/icons';
import { cn } from '@presentation/lib/cn';
import type { Task } from '@domain/entities/types';

const SHORT_DATE: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: '2-digit',
};

export function DashboardPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { selectedTaskId, selectTask } = useNav();
  const catLabel = useCategoryLabel();
  const matches = useSearchMatch();

  // Keep a valid selection: default to the first task when nothing is chosen.
  useEffect(() => {
    if (!state.tasks.length) return;
    if (!state.tasks.some((t) => t.id === selectedTaskId)) {
      selectTask(state.tasks[0].id);
    }
  }, [state.tasks, selectedTaskId, selectTask]);

  // The translated label is searchable alongside the stored one.
  const visible = state.tasks.filter((task) =>
    matches(`${task.title} ${task.cat || ''} ${catLabel(task.cat)}`),
  );
  const progress = visible.filter((task) => !task.done);
  const done = visible.filter((task) => task.done);

  return (
    <>
      <OverviewCards />

      {/* Below 560px only the task and its due date survive: the created time
          and the target column cost more width than they earn, and squeezing
          them in truncated every task title to a few characters. */}
      <div className="mx-0 mb-1.5 mt-[18px] grid grid-cols-[96px_1fr_128px_118px] gap-3 px-[14px] max-[560px]:mt-3 max-[560px]:grid-cols-[1fr_auto] max-[560px]:gap-2 max-[560px]:px-2.5">
        <span className="text-xs font-semibold text-faint max-[560px]:hidden">
          {t('dash.colCreated')}
        </span>
        <span className="text-xs font-semibold text-faint">{t('dash.colTask')}</span>
        <span className="text-xs font-semibold text-faint">{t('dash.colDue')}</span>
        <span className="text-xs font-semibold text-faint max-[560px]:hidden">
          {t('dash.colTarget')}
        </span>
      </div>

      <h3 className="mb-1 mt-4 text-base font-bold">{t('dash.onProgress')}</h3>
      {progress.length ? (
        progress.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={task.id === selectedTaskId}
            onSelect={() => selectTask(task.id)}
          />
        ))
      ) : (
        <EmptyRow>{t('dash.emptyProgress')}</EmptyRow>
      )}

      <h3 className="mb-1 mt-[22px] text-base font-bold">{t('dash.done')}</h3>
      {done.length ? (
        done.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={task.id === selectedTaskId}
            onSelect={() => selectTask(task.id)}
          />
        ))
      ) : (
        <EmptyRow>{t('dash.emptyDone')}</EmptyRow>
      )}
    </>
  );
}

interface TaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: () => void;
}

function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  const { t } = useTranslation();
  const { date } = useFormat();
  const catLabel = useCategoryLabel();
  const color = categoryColor(task.cat);
  const due = task.due ? date(task.due, SHORT_DATE) : t('dash.noDate');

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'grid w-full grid-cols-[96px_1fr_128px_118px] items-center gap-3 rounded-[14px] px-[14px] py-3 text-left transition-colors max-[560px]:grid-cols-[1fr_auto] max-[560px]:gap-2 max-[560px]:px-2.5 max-[560px]:py-2.5',
        selected ? 'bg-ink' : 'hover:bg-panel',
      )}
    >
      <span
        className={cn(
          'text-[12.5px] font-semibold max-[560px]:hidden',
          selected ? 'text-on-ink/[.66]' : 'text-faint',
        )}
      >
        {task.created || '09:05 AM'}
      </span>
      <span className="flex min-w-0 items-center gap-3 max-[560px]:gap-2.5">
        <Avatar color={color} icon={itemIcon(task.icon, task.cat)} size={36} />
        <span className="block min-w-0">
          <span
            className={cn(
              'block truncate text-[14.5px] font-bold max-[560px]:text-[13.5px]',
              selected && 'text-on-ink',
            )}
          >
            {task.title}
          </span>
          <span
            className={cn(
              'mt-px block truncate text-[12.5px] max-[560px]:text-[11.5px]',
              selected ? 'text-on-ink/[.66]' : 'text-muted',
            )}
          >
            {/* The created time loses its own column on a phone, so it rides
                along with the category rather than disappearing entirely. */}
            <span className="hidden max-[560px]:inline">
              {task.created || '09:05 AM'} ·{' '}
            </span>
            {catLabel(task.cat) || t('dash.task')}
          </span>
        </span>
      </span>
      <span
        className={cn(
          'truncate text-[13px] max-[560px]:text-[11.5px] max-[560px]:font-semibold',
          selected ? 'text-on-ink/[.66]' : 'text-muted',
        )}
      >
        {due}
      </span>
      <span
        className={cn(
          'truncate text-[13px] max-[560px]:hidden',
          selected ? 'text-on-ink/[.66]' : 'text-muted',
        )}
      >
        {catLabel(task.cat) || t('dash.general')}
      </span>
    </button>
  );
}
