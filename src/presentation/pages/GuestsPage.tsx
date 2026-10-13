import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState, EmptyRow } from '@presentation/components/ui/EmptyState';
import {
  SegmentedFilter,
  type Segment,
} from '@presentation/components/ui/SegmentedFilter';
import { Card } from '@presentation/components/ui/Card';
import { Avatar } from '@presentation/components/ui/Avatar';
import { Chip, type ChipVariant } from '@presentation/components/ui/Chip';
import { RowActions } from '@presentation/components/ui/RowActions';
import { Icon } from '@presentation/components/ui/Icon';
import { usePlan } from '@presentation/state/PlanStore';
import { useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useCategoryLabel } from '@presentation/hooks/useCategoryLabel';
import {
  guestsTotalPax,
  attendingPax,
  pendingPax,
  declinedPax,
  guestsAttendingCount,
  guestsPendingCount,
  guestsDeclinedCount,
} from '@domain/services/progress';
import {
  RSVP_CHIP_VARIANT,
  categoryColor,
  type RsvpStatus,
} from '@domain/value-objects/status';
import type { Guest } from '@domain/entities/types';

type GuestFilter = 'all' | RsvpStatus;

export function GuestsPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm } = useUi();
  const { guestForm } = useForms();
  const { cycleGuestRsvp, deleteGuest, loadSampleGuests } = usePlanActions();
  const catLabel = useCategoryLabel();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<GuestFilter>('all');

  const guests: Guest[] = state.guests ?? [];
  const totalCount = guests.length;

  if (!totalCount) {
    return (
      <>
        <StatStrip
          items={[
            { label: t('guests.stripTotal'), value: 0 },
            { label: t('guests.stripPax'), value: 0 },
          ]}
        />
        <EmptyState
          icon="groups"
          title={t('guests.emptyTitle')}
          text={t('guests.emptyText')}
          actionLabel={t('topbar.addGuest')}
          onAction={() => openForm(guestForm())}
          secondaryLabel={import.meta.env.DEV ? t('guests.loadSample') : undefined}
          onSecondary={import.meta.env.DEV ? loadSampleGuests : undefined}
        />
      </>
    );
  }

  const attendingCount = guestsAttendingCount(guests);
  const pendingCount = guestsPendingCount(guests);
  const declinedCount = guestsDeclinedCount(guests);

  const totalPax = guestsTotalPax(guests);
  const attPax = attendingPax(guests);
  const pendPax = pendingPax(guests);
  const decPax = declinedPax(guests);

  const segments: Segment<GuestFilter>[] = [
    { value: 'all', label: t('common.all'), count: totalCount },
    { value: 'attending', label: t('status.rsvp.attending'), count: attendingCount },
    { value: 'pending', label: t('status.rsvp.pending'), count: pendingCount },
    { value: 'declined', label: t('status.rsvp.declined'), count: declinedCount },
  ];

  const visible = guests.filter((g) => {
    if (filter !== 'all' && g.rsvp !== filter) return false;
    return matches(
      `${g.name} ${g.category || ''} ${catLabel(g.category)} ${g.table || ''} ${g.phone || ''} ${g.dietary || ''} ${g.notes || ''}`,
    );
  });

  return (
    <>
      <StatStrip
        items={[
          { label: t('guests.stripTotal'), value: totalCount },
          { label: t('guests.stripPax'), value: totalPax },
          {
            label: t('guests.stripAttending'),
            value: `${attendingCount} (${attPax} pax)`,
          },
          {
            label: t('guests.stripPending'),
            value: `${pendingCount} (${pendPax} pax)`,
          },
          {
            label: t('guests.stripDeclined'),
            value: `${declinedCount} (${decPax} pax)`,
          },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
      </div>

      {visible.length ? (
        <div className="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {visible.map((g) => (
            <Card key={g.id} pad className="group relative flex flex-col justify-between">
              <div>
                <div className="absolute right-2.5 top-3">
                  <RowActions
                    onEdit={() => openForm(guestForm(g))}
                    onDelete={() => deleteGuest(g.id)}
                    editLabel={t('guests.editAria', { name: g.name })}
                    deleteLabel={t('guests.deleteAria', { name: g.name })}
                  />
                </div>

                <div className="flex items-start gap-3 pr-12">
                  <Avatar
                    color={categoryColor(g.category || g.name)}
                    letter={g.name[0] || '?'}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold leading-tight">
                      {g.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {g.category && (
                        <span className="text-xs font-semibold text-lime-ink">
                          {catLabel(g.category)}
                        </span>
                      )}
                      <span className="inline-flex rounded-full bg-panel px-2 py-0.5 text-[11px] font-bold text-muted">
                        {t('guests.paxUnit', { count: g.pax || 1 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cycleGuestRsvp(g.id)}
                    aria-label={t('guests.cycleAria', {
                      name: g.name,
                      status: t(`status.rsvp.${g.rsvp}`),
                    })}
                    title={t('guests.cycleAria', {
                      name: g.name,
                      status: t(`status.rsvp.${g.rsvp}`),
                    })}
                    className="cursor-pointer py-0.5 transition-transform hover:scale-105 active:scale-95 touch-manipulation"
                  >
                    <Chip
                      variant={RSVP_CHIP_VARIANT[g.rsvp] as ChipVariant}
                      dot
                    >
                      {t(`status.rsvp.${g.rsvp}`)}
                    </Chip>
                  </button>

                  {g.table && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-panel px-2 py-1 text-xs font-medium text-muted">
                      <Icon name="chair" size={13} className="text-faint" />
                      {g.table}
                    </span>
                  )}
                </div>

                {g.phone && (
                  <div className="mt-2.5 flex items-center gap-2 text-[13px] text-muted">
                    <Icon name="call" size={15} className="text-faint" />
                    <a href={`tel:${g.phone}`} className="hover:text-ink">
                      {g.phone}
                    </a>
                  </div>
                )}

                {g.dietary && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-warn">
                    <Icon name="restaurant" size={14} className="flex-none text-warn" />
                    <span className="truncate">{g.dietary}</span>
                  </div>
                )}
              </div>

              {g.notes && (
                <div className="mt-3 border-t border-dashed border-line-2 pt-2.5 text-[12px] text-faint line-clamp-2">
                  {g.notes}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyRow>{t('guests.nothingStage')}</EmptyRow>
        </div>
      )}
    </>
  );
}
