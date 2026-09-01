import { useTranslation } from 'react-i18next';
import { Icon } from '@presentation/components/ui/Icon';
import { Chip } from '@presentation/components/ui/Chip';
import { ProgressBar } from '@presentation/components/ui/ProgressBar';
import { usePlan } from '@presentation/state/PlanStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { taskCountdown } from '@domain/services/schedule';
import type { Task } from '@domain/entities/types';

interface TaskDetailProps {
  task: Task | undefined;
  onEdit: (task: Task) => void;
}

const SHORT_DATE: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: '2-digit',
};

export function TaskDetail({ task, onEdit }: TaskDetailProps) {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { date } = useFormat();

  if (!task) {
    return (
      <>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('detail.title')}</h3>
        </div>
        <p className="px-4 py-7 text-center text-[13.5px] text-faint">
          {t('detail.empty')}
        </p>
      </>
    );
  }

  const info = taskCountdown(task, state.wedding);

  let big: string;
  let label: string;
  let numColor: string;
  let barColor: string;

  switch (info.kind) {
    case 'done':
      big = '✓';
      label = t('detail.completed');
      numColor = 'text-ok';
      barColor = 'var(--color-ok)';
      break;
    case 'none':
      big = '—';
      label = t('detail.noDue');
      numColor = 'text-ink';
      barColor = 'var(--color-line-2)';
      break;
    case 'overdue':
      big = String(info.days);
      label = t('detail.overdue', { count: info.days ?? 0 });
      numColor = 'text-bad';
      barColor = 'var(--color-bad)';
      break;
    case 'today':
      big = '0';
      label = t('detail.dueToday');
      numColor = 'text-warn';
      barColor = 'var(--color-warn)';
      break;
    default:
      big = String(info.days);
      label = t('detail.untilDue', { count: info.days ?? 0 });
      numColor = info.soon ? 'text-warn' : 'text-ink';
      barColor = info.soon ? 'var(--color-warn)' : 'var(--color-lime-2)';
      break;
  }

  let note = '';
  if (info.note) {
    if (info.note.kind === 'before')
      note = t('detail.noteBefore', { count: info.note.gap });
    else if (info.note.kind === 'onDay') note = t('detail.noteOnDay');
    else note = t('detail.noteAfter');
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold">{t('detail.title')}</h3>
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={t('detail.editAria', { name: task.title })}
          title={t('common.save')}
          className="grid h-8 w-8 place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink"
        >
          <Icon name="edit" size={18} />
        </button>
      </div>

      <Field label={t('detail.goalName')}>
        <span className="text-[15px] font-bold">{task.title}</span>
      </Field>

      <Field label={t('detail.status')}>
        <span>
          <Chip variant={task.done ? 'lime' : 'dark'}>
            {task.done ? t('detail.statusCompleted') : t('detail.statusProgress')}
          </Chip>
        </span>
      </Field>

      <div className="grid grid-cols-2 gap-3.5">
        <Field label={t('detail.created')}>
          <span className="text-[13.5px] font-semibold">{task.created || '—'}</span>
        </Field>
        <Field label={t('detail.dueDate')}>
          <span className="text-[13.5px] font-semibold">
            {task.due ? date(task.due, SHORT_DATE) : '—'}
          </span>
        </Field>
      </div>

      <Field label={t('detail.goalTarget')}>
        <span className="text-[13.5px] font-semibold">
          {task.cat || t('detail.general')}
        </span>
      </Field>

      {task.url && (
        <Field label={t('detail.link')}>
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-info hover:underline"
          >
            <Icon name="link" size={16} />
            <span className="truncate">{task.url}</span>
          </a>
        </Field>
      )}

      {task.attachment && (
        <Field label={t('detail.attachment')}>
          {task.attachment.type.startsWith('image/') ? (
            <a href={task.attachment.data} target="_blank" rel="noopener noreferrer">
              <img
                src={task.attachment.data}
                alt={task.attachment.name}
                className="max-h-40 w-full rounded-xl border border-line-2 object-cover"
              />
            </a>
          ) : (
            <a
              href={task.attachment.data}
              target="_blank"
              rel="noopener noreferrer"
              download={task.attachment.name}
              className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-info hover:underline"
            >
              <Icon name="description" size={16} />
              <span className="truncate">{task.attachment.name}</span>
            </a>
          )}
        </Field>
      )}

      <div className="mt-1 border-t border-line pt-[18px]">
        <div className="text-xs font-semibold text-muted">{t('detail.countdown')}</div>
        <div className="my-2 flex items-baseline gap-[9px]">
          <span className={`text-[42px] font-extrabold leading-none tracking-tight tnum ${numColor}`}>
            {big}
          </span>
          <span className="text-[13px] font-semibold text-muted">{label}</span>
        </div>
        <ProgressBar value={info.urgency} color={barColor} track="line" className="mt-1.5" />
        {note && <p className="mt-[11px] text-[12.5px] text-faint">{note}</p>}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 grid gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </div>
  );
}
