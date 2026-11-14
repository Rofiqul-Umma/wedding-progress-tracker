import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState, EmptyRow } from '@presentation/components/ui/EmptyState';
import { SegmentedFilter, type Segment } from '@presentation/components/ui/SegmentedFilter';
import { Select } from '@presentation/components/ui/Select';
import { Card } from '@presentation/components/ui/Card';
import { Row } from '@presentation/components/ui/Row';
import { Check } from '@presentation/components/ui/Check';
import { Avatar } from '@presentation/components/ui/Avatar';
import { Icon } from '@presentation/components/ui/Icon';
import { RowActions } from '@presentation/components/ui/RowActions';
import { usePlan } from '@presentation/state/PlanStore';
import { useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useFormat } from '@presentation/hooks/useFormat';
import {
  useCategoryLabel,
  useCategoryFilterOptions,
} from '@presentation/hooks/useCategoryLabel';
import { tasksDone, openTasks } from '@domain/services/progress';
import { daysUntil } from '@domain/services/schedule';
import { categoryColor } from '@domain/value-objects/status';
import { itemIcon } from '@domain/value-objects/icons';
import { cn } from '@presentation/lib/cn';
import { isImageAttachment } from '@presentation/lib/attachments';
import { downloadAttachment } from '@presentation/lib/dataUrl';
import type { Attachment, Task } from '@domain/entities/types';

type TaskFilter = 'all' | 'open' | 'done';

const SHORT_DATE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

export function TasksPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm, openPreview } = useUi();
  const { taskForm } = useForms();
  const { toggleTask, deleteTask } = usePlanActions();
  const catLabel = useCategoryLabel();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const categoryOptions = useCategoryFilterOptions(
    'task',
    state.tasks.map((task) => task.cat),
  );

  const openCount = openTasks(state.tasks);
  const doneCount = tasksDone(state.tasks);
  const overdue = state.tasks.filter(
    (task) => !task.done && task.due && (daysUntil(task.due) ?? 0) < 0,
  ).length;

  const segments: Segment<TaskFilter>[] = [
    { value: 'all', label: t('common.all'), count: state.tasks.length },
    { value: 'open', label: t('tasks.stripOpen'), count: openCount },
    { value: 'done', label: t('tasks.stripCompleted'), count: doneCount },
  ];

  const sorted = [...state.tasks]
    .filter((task) =>
      filter === 'all' ? true : filter === 'done' ? task.done : !task.done,
    )
    .filter(
      (task) =>
        categoryFilter === 'all' || (task.cat?.trim() || '') === categoryFilter,
    )
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.due || '9999').localeCompare(b.due || '9999');
    });
  // The translated label is searchable alongside the stored one, so "documents"
  // finds a "Dokumen" task while the UI is in English.
  const visible = sorted.filter((task) =>
    matches(`${task.title} ${task.cat || ''} ${catLabel(task.cat)}`),
  );

  return (
    <>
      <StatStrip
        items={[
          { label: t('tasks.stripOpen'), value: openCount },
          { label: t('tasks.stripCompleted'), value: doneCount },
          { label: t('tasks.stripTotal'), value: state.tasks.length },
          { label: t('tasks.stripOverdue'), value: overdue },
        ]}
      />

      {state.tasks.length ? (
        <>
          <div className="my-[18px] mb-1.5 flex flex-wrap items-center justify-between gap-2.5 max-[560px]:my-2.5 max-[560px]:mb-1 max-[560px]:flex-col max-[560px]:items-stretch max-[560px]:gap-2">
            <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
            <Select
              id="taskCategoryFilter"
              variant="compact"
              value={categoryFilter}
              aria-label={t('common.filterCategoryAria')}
              options={categoryOptions}
              containerClassName="max-[560px]:w-full"
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
          {visible.length ? (
            <Card className="mt-3 max-[560px]:mt-2.5">
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onOpen={() => openPreview({ kind: 'task', id: task.id })}
                  onEdit={() => openForm(taskForm(task))}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </Card>
          ) : (
            <div className="mt-3">
              <EmptyRow>{t('tasks.noFilter')}</EmptyRow>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="checklist"
          title={t('tasks.emptyTitle')}
          text={t('tasks.emptyText')}
          actionLabel={t('topbar.addTask')}
          onAction={() => openForm(taskForm())}
        />
      )}
    </>
  );
}

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskRow({ task, onToggle, onOpen, onEdit, onDelete }: TaskRowProps) {
  const { t } = useTranslation();
  const { openImage } = useUi();
  const { date } = useFormat();
  const catLabel = useCategoryLabel();
  const color = categoryColor(task.cat);
  const dd = task.due ? daysUntil(task.due) : null;
  const attachment = task.attachment;

  // Attachments live in `data:` URLs, which browsers will not open as a
  // top-level navigation — images go to the in-app viewer, files download.
  const openAttachment = (a: Attachment) => {
    if (isImageAttachment(a)) openImage(a.data, a.name);
    else downloadAttachment(a);
  };

  let dueColor = 'text-faint';
  let label = task.due ? date(task.due, SHORT_DATE) : t('tasks.noDate');
  if (task.done) {
    dueColor = 'text-ok';
    label = t('tasks.completed');
  } else if (dd !== null && dd < 0) {
    dueColor = 'text-bad';
    label = t('tasks.overdueShort', { count: Math.abs(dd) });
  } else if (dd !== null && dd <= 14) {
    dueColor = 'text-warn';
    label = dd === 0 ? t('tasks.today') : t('tasks.inDays', { count: dd });
  }

  return (
    <Row onActivate={onOpen} activateLabel={t('preview.viewAria', { name: task.title })}>
      <Check
        checked={task.done}
        onChange={onToggle}
        label={`${task.done ? t('tasks.markTodo') : t('tasks.markComplete')}: ${task.title}`}
      />
      <Avatar color={color} icon={itemIcon(task.icon, task.cat)} />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate text-[14.5px] font-bold',
            task.done && 'text-faint line-through',
          )}
        >
          {task.title}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-muted">
          {catLabel(task.cat) || t('tasks.task')}
        </div>
      </div>
      {task.url && (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('tasks.openLink')}
          aria-label={t('tasks.openLink')}
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink max-[560px]:hidden"
        >
          <Icon name="link" size={17} />
        </a>
      )}
      {attachment && (
        <button
          type="button"
          onClick={() => openAttachment(attachment)}
          title={t('tasks.viewFile')}
          aria-label={t('tasks.viewFile')}
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink max-[560px]:hidden"
        >
          <Icon name="attach_file" size={17} />
        </button>
      )}
      <div className="flex-none text-right">
        <div className={cn('text-xs font-bold', dueColor)}>{label}</div>
        {task.due && (
          <div className="mt-0.5 text-xs text-faint">{date(task.due, SHORT_DATE)}</div>
        )}
      </div>
      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={t('tasks.editAria', { name: task.title })}
        deleteLabel={t('tasks.deleteAria', { name: task.title })}
        mobileHidden
      />
    </Row>
  );
}
