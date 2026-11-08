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
import { CartoonAvatar } from '@presentation/components/ui/CartoonAvatar';
import { Chip, type ChipVariant } from '@presentation/components/ui/Chip';
import { RowActions } from '@presentation/components/ui/RowActions';
import { Icon } from '@presentation/components/ui/Icon';
import { Select } from '@presentation/components/ui/Select';
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
  effectiveGuestSide,
  guestsBySide,
  effectiveGuestInvitationType,
  guestsByInvitationType,
} from '@domain/services/progress';
import {
  RSVP_CHIP_VARIANT,
  GUEST_SIDES,
  categoryColor,
  type RsvpStatus,
  type GuestSide,
  type GuestInvitationType,
} from '@domain/value-objects/status';
import { BASE_CATEGORIES } from '@domain/value-objects/categories';
import type { Guest } from '@domain/entities/types';
import { cn } from '@presentation/lib/cn';

type GuestFilter = 'all' | RsvpStatus;
type GuestSideFilter = 'all' | GuestSide;
type GuestInvitationFilter = 'all' | GuestInvitationType;

export function GuestsPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm } = useUi();
  const { guestForm } = useForms();
  const { cycleGuestRsvp, deleteGuest, loadSampleGuests } = usePlanActions();
  const catLabel = useCategoryLabel();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<GuestFilter>('all');
  const [sideFilter, setSideFilter] = useState<GuestSideFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [invitationFilter, setInvitationFilter] =
    useState<GuestInvitationFilter>('all');
  const [groupBySide, setGroupBySide] = useState<boolean>(true);

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

  const p1Custom = state.wedding.p1.trim();
  const p2Custom = state.wedding.p2.trim();
  const p1Label = p1Custom || t('guests.sideP1');
  const p2Label = p2Custom || t('guests.sideP2');
  const bothLabel = t('guests.sideBoth');

  const sideDisplayName = (side: GuestSide): string => {
    if (side === 'p1') return p1Label;
    if (side === 'p2') return p2Label;
    return bothLabel;
  };

  const sideRoleBadge = (side: GuestSide): string | null => {
    if (side === 'p1' && p1Custom) return t('guests.sideP1');
    if (side === 'p2' && p2Custom) return t('guests.sideP2');
    return null;
  };

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

  const p1Guests = guestsBySide(guests, 'p1');
  const p2Guests = guestsBySide(guests, 'p2');
  const bothGuests = guestsBySide(guests, 'both');

  const sideSegments: Segment<GuestSideFilter>[] = [
    { value: 'all', label: t('guests.sideAll'), count: totalCount },
    { value: 'p1', label: p1Label, count: p1Guests.length },
    { value: 'p2', label: p2Label, count: p2Guests.length },
    ...(bothGuests.length > 0 || sideFilter === 'both'
      ? [{ value: 'both' as const, label: bothLabel, count: bothGuests.length }]
      : []),
  ];

  const categoryValues = new Set<string>(
    BASE_CATEGORIES.guest.map((c) => c.value),
  );
  for (const g of guests) {
    const c = g.category?.trim();
    if (c) categoryValues.add(c);
  }
  const categoryOptions = [
    { value: 'all', label: `${t('guests.catAll')} (${totalCount})` },
    ...[...categoryValues]
      .map((cat) => {
        const count = guests.filter((g) => (g.category?.trim() || '') === cat).length;
        return {
          value: cat,
          label: `${catLabel(cat)} (${count})`,
          name: catLabel(cat),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const digitalCount = guestsByInvitationType(guests, 'digital').length;
  const physicalCount = guestsByInvitationType(guests, 'physical').length;
  const invitationOptions = [
    { value: 'all', label: `${t('guests.invAll')} (${totalCount})` },
    { value: 'digital', label: `${t('guests.invDigital')} (${digitalCount})` },
    { value: 'physical', label: `${t('guests.invPhysical')} (${physicalCount})` },
  ];

  const invitationLabel = (inv: GuestInvitationType): string =>
    inv === 'physical' ? t('guests.invPhysical') : t('guests.invDigital');

  const visible = guests.filter((g) => {
    const gSide = effectiveGuestSide(g);
    const gCat = g.category?.trim() || '';
    const gInv = effectiveGuestInvitationType(g);
    if (filter !== 'all' && g.rsvp !== filter) return false;
    if (sideFilter !== 'all' && gSide !== sideFilter) return false;
    if (categoryFilter !== 'all' && gCat !== categoryFilter) return false;
    if (invitationFilter !== 'all' && gInv !== invitationFilter) return false;
    return matches(
      `${g.name} ${sideDisplayName(gSide)} ${sideRoleBadge(gSide) || ''} ${invitationLabel(gInv)} ${g.category || ''} ${catLabel(g.category)} ${g.phone || ''} ${g.notes || ''}`,
    );
  });

  const renderGuestCard = (g: Guest) => {
    const gSide = effectiveGuestSide(g);
    const gInv = effectiveGuestInvitationType(g);
    const hasFooterDetails = Boolean(g.phone || g.notes);

    return (
      <Card
        key={g.id}
        pad
        className="group relative flex flex-col justify-between max-[560px]:p-3.5"
      >
        {/* Top row: Avatar + Name/Meta on the left, RSVP chip + Edit/Delete on the right */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <Avatar
              color={categoryColor(g.category || g.name)}
              letter={g.name[0] || '?'}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14.5px] font-bold leading-snug">
                  {g.name}
                </span>
                <span className="flex-none rounded-full bg-panel px-1.5 py-0.5 text-[10.5px] font-bold text-muted tnum">
                  {t('guests.paxUnit', { count: g.pax || 1 })}
                </span>
              </div>

              <div className="mt-0.5 flex flex-balance items-center gap-x-1.5 gap-y-1 text-[11.5px] font-semibold text-muted">
                {!groupBySide && (
                  <span className="inline-flex items-center rounded-full bg-lime-soft px-1.5 py-px text-[10.5px] font-bold text-lime-ink">
                    {sideDisplayName(gSide)}
                  </span>
                )}
                {g.category && (
                  <span className="truncate text-ink-2">
                    {catLabel(g.category)}
                  </span>
                )}
                {g.category && <span className="text-faint">·</span>}
                <span className="inline-flex items-center gap-1">
                  <Icon
                    name={gInv === 'physical' ? 'mail' : 'public'}
                    size={12}
                    className="text-faint"
                  />
                  {invitationLabel(gInv)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-none items-center gap-1">
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
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <Chip variant={RSVP_CHIP_VARIANT[g.rsvp] as ChipVariant} dot>
                {t(`status.rsvp.${g.rsvp}`)}
              </Chip>
            </button>
            <RowActions
              onEdit={() => openForm(guestForm(g))}
              onDelete={() => deleteGuest(g.id)}
              editLabel={t('guests.editAria', { name: g.name })}
              deleteLabel={t('guests.deleteAria', { name: g.name })}
            />
          </div>
        </div>

        {/* Compact secondary row: Phone & Notes share horizontal space */}
        {hasFooterDetails && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2 text-[12px] text-muted">
            {g.phone && (
              <a
                href={`tel:${g.phone}`}
                className="inline-flex items-center gap-1 hover:text-ink"
              >
                <Icon name="call" size={13} className="text-faint" />
                {g.phone}
              </a>
            )}
            {g.notes && (
              <span className="min-w-0 flex-1 truncate text-faint">
                {g.phone ? `· ${g.notes}` : g.notes}
              </span>
            )}
          </div>
        )}
      </Card>
    );
  };

  const renderSideAvatar = (side: GuestSide) => {
    const { avatar1, avatar2 } = state.wedding;
    if (side === 'p1') {
      return <CartoonAvatar value={avatar1} letter={p1Label[0] || '1'} size={32} />;
    }
    if (side === 'p2') {
      return <CartoonAvatar value={avatar2} letter={p2Label[0] || '2'} size={32} />;
    }
    return (
      <span className="flex flex-none items-center">
        <CartoonAvatar value={avatar1} letter={p1Label[0] || '1'} size={28} />
        <CartoonAvatar
          value={avatar2}
          letter={p2Label[0] || '2'}
          size={28}
          className="-ml-2 ring-2 ring-app"
        />
      </span>
    );
  };

  const groups = GUEST_SIDES.map((side) => ({
    side,
    items: visible.filter((g) => effectiveGuestSide(g) === side),
  })).filter((grp) => grp.items.length > 0);

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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 max-[560px]:mt-3 max-[560px]:flex-col max-[560px]:items-stretch max-[560px]:gap-2">
        <div className="flex flex-wrap items-center gap-2.5 max-w-full max-[560px]:flex-col max-[560px]:items-stretch max-[560px]:gap-2">
          <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
          <SegmentedFilter
            options={sideSegments}
            value={sideFilter}
            onChange={setSideFilter}
          />
          <div className="flex flex-wrap items-center gap-2 max-[560px]:grid max-[560px]:grid-cols-2">
            <Select
              id="guestCategoryFilter"
              variant="compact"
              value={categoryFilter}
              aria-label={t('guests.filterCategoryAria')}
              options={categoryOptions}
              containerClassName="max-[560px]:w-full"
              className="max-[560px]:w-full max-[560px]:max-w-none"
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <Select
              id="guestInvitationFilter"
              variant="compact"
              value={invitationFilter}
              aria-label={t('guests.filterInvitationAria')}
              options={invitationOptions}
              containerClassName="max-[560px]:w-full"
              className="max-[560px]:w-full max-[560px]:max-w-none"
              onChange={(e) =>
                setInvitationFilter(e.target.value as GuestInvitationFilter)
              }
            />
          </div>
        </div>
        <button
          type="button"
          aria-pressed={groupBySide}
          onClick={() => setGroupBySide((v) => !v)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors max-[560px]:w-full',
            groupBySide
              ? 'border-ink bg-ink text-on-ink shadow-sm'
              : 'border-line bg-panel text-muted hover:text-ink',
          )}
        >
          <Icon name="groups" size={16} />
          <span>{t('guests.groupBySide')}</span>
        </button>
      </div>

      {visible.length ? (
        groupBySide ? (
          <div className="mt-[18px] flex flex-col gap-6 max-[560px]:mt-3.5 max-[560px]:gap-4">
            {groups.map(({ side, items }) => {
              const badge = sideRoleBadge(side);
              const grpPax = guestsTotalPax(items);
              return (
                <section key={side} aria-label={sideDisplayName(side)}>
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-2.5 max-[560px]:mb-2 max-[560px]:pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderSideAvatar(side)}
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <h2 className="truncate text-[16px] font-bold tracking-tight">
                          {sideDisplayName(side)}
                        </h2>
                        {badge && (
                          <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
                            {badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="flex-none rounded-full bg-panel px-2.5 py-1 text-xs font-bold text-muted tnum">
                      {t('guests.groupSummary', {
                        count: items.length,
                        pax: grpPax,
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5 max-[560px]:gap-2">
                    {items.map(renderGuestCard)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5 max-[560px]:mt-3.5 max-[560px]:gap-2">
            {visible.map(renderGuestCard)}
          </div>
        )
      ) : (
        <div className="mt-4">
          <EmptyRow>{t('guests.nothingStage')}</EmptyRow>
        </div>
      )}
    </>
  );
}
