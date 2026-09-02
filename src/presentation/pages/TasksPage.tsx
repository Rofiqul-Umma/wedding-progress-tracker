import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState } from '@presentation/components/ui/EmptyState';
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
import { tasksDone, openTasks } from '@domain/services/progress';
import { daysUntil } from '@domain/services/schedule';
import { iconForCategory, categoryColor } from '@domain/value-objects/status';
import { cn } from '@presentation/lib/cn';
import type { Task } from '@domain/entities/types';

const SHORT_DATE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

export function TasksPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm, openPreview } = useUi();
  const { taskForm } = useForms();
  const { toggleTask, deleteTask } = usePlanActions();
  const matches = useSearchMatch();

  const overdue = state.tasks.filter(
    (task) => !task.done && task.due && (daysUntil(task.due) ?? 0) < 0,
  ).length;

  const sorted = [...state.tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.due || '9999').localeCompare(b.due || '9999');
  });
  const visible = sorted.filter((task) => matches(`${task.title} ${task.cat || ''}`));

  return (
    <>
      <StatStrip
        items={[
          { label: t('tasks.stripOpen'), value: openTasks(state.tasks) },
          { label: t('tasks.stripCompleted'), value: tasksDone(state.tasks) },
          { label: t('tasks.stripTotal'), value: state.tasks.length },
          { label: t('tasks.stripOverdue'), value: overdue },
        ]}
      />

      {state.tasks.length ? (
        <Card className="mt-[18px]">
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
  const { date } = useFormat();
  const color = categoryColor(task.cat);
  const dd = task.due ? daysUntil(task.due) : null;

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
      <Avatar color={color} icon={iconForCategory(task.cat)} />
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
          {task.cat || t('tasks.task')}
        </div>
      </div>
      {task.url && (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('tasks.openLink')}
          aria-label={t('tasks.openLink')}
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink"
        >
          <Icon name="link" size={17} />
        </a>
      )}
      {task.attachment && (
        <a
          href={task.attachment.data}
          target="_blank"
          rel="noopener noreferrer"
          download={task.attachment.name}
          title={t('tasks.viewFile')}
          aria-label={t('tasks.viewFile')}
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink"
        >
          <Icon name="attach_file" size={17} />
        </a>
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
      />
    </Row>
  );
}
