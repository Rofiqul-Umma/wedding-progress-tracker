import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState, EmptyRow } from '@presentation/components/ui/EmptyState';
import { SegmentedFilter, type Segment } from '@presentation/components/ui/SegmentedFilter';
import { Card } from '@presentation/components/ui/Card';
import { Row } from '@presentation/components/ui/Row';
import { Avatar } from '@presentation/components/ui/Avatar';
import { Chip, type ChipVariant } from '@presentation/components/ui/Chip';
import { Icon } from '@presentation/components/ui/Icon';
import { ProgressBar } from '@presentation/components/ui/ProgressBar';
import { RowActions } from '@presentation/components/ui/RowActions';
import { usePlan } from '@presentation/state/PlanStore';
import { useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useFormat } from '@presentation/hooks/useFormat';
import {
  contentsProgress,
  effectiveSeserahanStatus,
  sesDone,
  sesPct,
} from '@domain/services/progress';
import { SES_ORDER, categoryColor } from '@domain/value-objects/status';
import { itemIcon } from '@domain/value-objects/icons';
import type { SeserahanStatus } from '@domain/value-objects/status';
import type { SeserahanItem } from '@domain/entities/types';

type SesFilter = 'all' | SeserahanStatus;

const STATUS_CHIP: Record<SeserahanStatus, ChipVariant> = {
  pending: 'gray',
  onProgress: 'warn',
  finished: 'lime',
};

export function SeserahanPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm, openPreview } = useUi();
  const { seserahanForm } = useForms();
  const { cycleSeserahan, deleteSeserahan } = usePlanActions();
  const { money } = useFormat();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<SesFilter>('all');

  const items = state.seserahan;
  const total = items.length;

  if (!total) {
    return (
      <EmptyState
        icon="redeem"
        title={t('seserahan.emptyTitle')}
        text={t('seserahan.emptyText')}
        actionLabel={t('topbar.addItem')}
        onAction={() => openForm(seserahanForm())}
      />
    );
  }

  const counts: Record<SeserahanStatus, number> = {
    pending: items.filter((i) => effectiveSeserahanStatus(i) === 'pending').length,
    onProgress: items.filter((i) => effectiveSeserahanStatus(i) === 'onProgress').length,
    finished: items.filter((i) => effectiveSeserahanStatus(i) === 'finished').length,
  };
  const totalCost = items.reduce((a, i) => a + (+i.cost || 0), 0);
  const pct = sesPct(items);

  const segments: Segment<SesFilter>[] = [
    { value: 'all', label: t('common.all'), count: total },
    { value: 'pending', label: t('status.ses.pending'), count: counts.pending },
    { value: 'onProgress', label: t('status.ses.onProgress'), count: counts.onProgress },
    { value: 'finished', label: t('status.ses.finished'), count: counts.finished },
  ];

  const groups = SES_ORDER.filter((k) => filter === 'all' || k === filter).map((k) => ({
    key: k,
    label: t(`status.ses.${k}`),
    rows: items.filter(
      (i) =>
        effectiveSeserahanStatus(i) === k &&
        // Contents are searchable too, so looking for "mukena" finds the tray
        // holding it rather than nothing at all.
        matches(
          `${i.name} ${i.category || ''} ${i.notes || ''} ${i.contents
            .map((c) => c.name)
            .join(' ')}`,
        ),
    ),
  }));

  return (
    <>
      <StatStrip
        items={[
          { label: t('seserahan.stripItems'), value: total },
          { label: t('seserahan.stripPrepared'), value: `${sesDone(items)}/${total}` },
          { label: t('seserahan.stripProgress'), value: counts.onProgress },
          { label: t('seserahan.stripCommitted'), value: money(totalCost) },
        ]}
      />

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-4">
        <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
        <div className="flex min-w-[180px] flex-[0_1_300px] items-center gap-3">
          <ProgressBar
            value={pct}
            color="var(--color-lime-2)"
            height={9}
            className="flex-1"
          />
          <span className="text-[13px] font-bold tnum">{pct}%</span>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="mb-1 mt-5 text-base font-bold">
            {g.label}
            <span className="ml-1 inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-panel px-1.5 align-middle text-[11px] font-bold text-muted">
              {g.rows.length}
            </span>
          </h3>
          {g.rows.length ? (
            <Card>
              {g.rows.map((item) => (
                <SeserahanRow
                  key={item.id}
                  item={item}
                  onCycle={() => cycleSeserahan(item.id)}
                  onOpen={() => openPreview({ kind: 'seserahan', id: item.id })}
                  onEdit={() => openForm(seserahanForm(item))}
                  onDelete={() => deleteSeserahan(item.id)}
                />
              ))}
            </Card>
          ) : (
            <EmptyRow>{t('seserahan.nothingStage')}</EmptyRow>
          )}
        </div>
      ))}
    </>
  );
}

interface SeserahanRowProps {
  item: SeserahanItem;
  onCycle: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SeserahanRow({ item, onCycle, onOpen, onEdit, onDelete }: SeserahanRowProps) {
  const { t } = useTranslation();
  const { money } = useFormat();
  const color = categoryColor(item.category);
  const meta = [item.category || t('seserahan.item'), item.notes].filter(Boolean).join(' · ');
  const progress = contentsProgress(item);
  const status = effectiveSeserahanStatus(item);

  const statusChip = (
    <Chip variant={STATUS_CHIP[status]} dot>
      {t(`status.ses.${status}`)}
    </Chip>
  );

  return (
    <Row onActivate={onOpen} activateLabel={t('preview.viewAria', { name: item.name })}>
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="h-10 w-10 flex-none rounded-[11px] border border-line-2 object-cover"
        />
      ) : (
        <Avatar color={color} icon={itemIcon(item.icon, item.category)} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-[14.5px] font-bold">
          <span className="truncate">{item.name}</span>
          {(+item.qty || 1) > 1 && <Chip variant="gray">×{+item.qty}</Chip>}
          {progress && (
            <Chip variant="gray">
              {progress.done}/{progress.total}
            </Chip>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-muted">{meta}</div>
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('seserahan.openLink')}
          aria-label={t('seserahan.openLink')}
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink max-[520px]:hidden"
        >
          <Icon name="link" size={17} />
        </a>
      )}
      {(+item.cost || 0) > 0 && (
        <div className="mr-2 text-[15px] font-extrabold tnum">{money(item.cost)}</div>
      )}
      {/* A bundle's status follows its checklist, so it is shown but not
          clickable — a button that silently does nothing is worse than none. */}
      {progress ? (
        <span title={t('seserahan.derivedAria', { name: item.name })}>{statusChip}</span>
      ) : (
        <button
          type="button"
          onClick={onCycle}
          title={t('seserahan.cycleAria', {
            name: item.name,
            status: t(`status.ses.${status}`),
          })}
          aria-label={t('seserahan.cycleAria', {
            name: item.name,
            status: t(`status.ses.${status}`),
          })}
          className="rounded-full transition-transform hover:-translate-y-px"
        >
          {statusChip}
        </button>
      )}
      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={t('seserahan.editAria', { name: item.name })}
        deleteLabel={t('seserahan.deleteAria', { name: item.name })}
        mobileHidden
      />
    </Row>
  );
}
