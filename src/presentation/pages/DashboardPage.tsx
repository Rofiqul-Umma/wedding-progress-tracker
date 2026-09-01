import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewCards } from '@presentation/components/dashboard/OverviewCards';
import { Avatar } from '@presentation/components/ui/Avatar';
import { EmptyRow } from '@presentation/components/ui/EmptyState';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav, useSearchMatch } from '@presentation/state/NavStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { iconForCategory, categoryColor } from '@domain/value-objects/status';
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
  const matches = useSearchMatch();

  // Keep a valid selection: default to the first task when nothing is chosen.
  useEffect(() => {
    if (!state.tasks.length) return;
    if (!state.tasks.some((t) => t.id === selectedTaskId)) {
      selectTask(state.tasks[0].id);
    }
  }, [state.tasks, selectedTaskId, selectTask]);

  const visible = state.tasks.filter((task) =>
    matches(`${task.title} ${task.cat || ''}`),
  );
  const progress = visible.filter((task) => !task.done);
  const done = visible.filter((task) => task.done);

  return (
    <>
      <OverviewCards />

      <div className="mx-0 mb-1.5 mt-[18px] grid grid-cols-[96px_1fr_128px_118px] gap-3 px-[14px] max-[560px]:grid-cols-[70px_1fr_88px]">
        <span className="text-xs font-semibold text-faint">{t('dash.colCreated')}</span>
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
  const color = categoryColor(task.cat);
  const due = task.due ? date(task.due, SHORT_DATE) : t('dash.noDate');

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'grid w-full grid-cols-[96px_1fr_128px_118px] items-center gap-3 rounded-[14px] px-[14px] py-3 text-left transition-colors max-[560px]:grid-cols-[70px_1fr_88px]',
        selected ? 'bg-ink' : 'hover:bg-panel',
      )}
    >
      <span
        className={cn(
          'text-[12.5px] font-semibold',
          selected ? 'text-white/[.66]' : 'text-faint',
        )}
      >
        {task.created || '09:05 AM'}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <Avatar color={color} icon={iconForCategory(task.cat)} size={36} />
        <span className="block min-w-0">
          <span
            className={cn(
              'block truncate text-[14.5px] font-bold',
              selected && 'text-white',
            )}
          >
            {task.title}
          </span>
          <span
            className={cn(
              'mt-px block truncate text-[12.5px]',
              selected ? 'text-white/[.66]' : 'text-muted',
            )}
          >
            {task.cat || t('dash.task')}
          </span>
        </span>
      </span>
      <span
        className={cn(
          'truncate text-[13px]',
          selected ? 'text-white/[.66]' : 'text-muted',
        )}
      >
        {due}
      </span>
      <span
        className={cn(
          'truncate text-[13px] max-[560px]:hidden',
          selected ? 'text-white/[.66]' : 'text-muted',
        )}
      >
        {task.cat || t('dash.general')}
      </span>
    </button>
  );
}
