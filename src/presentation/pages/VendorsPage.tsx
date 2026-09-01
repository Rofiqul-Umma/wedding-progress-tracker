import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState, EmptyRow } from '@presentation/components/ui/EmptyState';
import { SegmentedFilter, type Segment } from '@presentation/components/ui/SegmentedFilter';
import { SortSelect } from '@presentation/components/ui/SortSelect';
import { Card } from '@presentation/components/ui/Card';
import { Row } from '@presentation/components/ui/Row';
import { Avatar } from '@presentation/components/ui/Avatar';
import { Chip } from '@presentation/components/ui/Chip';
import { RowActions } from '@presentation/components/ui/RowActions';
import { Icon } from '@presentation/components/ui/Icon';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav, useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useFormat } from '@presentation/hooks/useFormat';
import { vendorsTotal } from '@domain/services/budget';
import { vendorsBooked, vendorCategories } from '@domain/services/progress';
import { iconForCategory, categoryColor } from '@domain/value-objects/status';
import type { Vendor } from '@domain/entities/types';
import type { VendorStatus } from '@domain/value-objects/status';
import type { ChipVariant } from '@presentation/components/ui/Chip';

type VendorFilter = 'all' | VendorStatus;
type VendorSort = 'cost-desc' | 'cost-asc' | 'name' | 'cat';

const STATUS_CHIP: Record<VendorStatus, ChipVariant> = {
  paid: 'dark',
  deposit: 'warn',
  booked: 'lime',
  inquiry: 'gray',
};

const COMPARATORS: Record<VendorSort, (a: Vendor, b: Vendor) => number> = {
  'cost-desc': (a, b) => (+b.cost || 0) - (+a.cost || 0),
  'cost-asc': (a, b) => (+a.cost || 0) - (+b.cost || 0),
  name: (a, b) => (a.name || '').localeCompare(b.name || ''),
  cat: (a, b) => (a.category || '').localeCompare(b.category || ''),
};

export function VendorsPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { gotoContact } = useNav();
  const { openForm } = useUi();
  const { vendorForm } = useForms();
  const { deleteVendor } = usePlanActions();
  const { money } = useFormat();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<VendorFilter>('all');
  const [sort, setSort] = useState<VendorSort>('cost-desc');

  const strip = (
    <StatStrip
      items={[
        { label: t('vendors.stripVendors'), value: state.vendors.length },
        { label: t('vendors.stripCommitted'), value: money(vendorsTotal(state.vendors)) },
        { label: t('vendors.stripBooked'), value: vendorsBooked(state.vendors) },
        { label: t('vendors.stripCategories'), value: vendorCategories(state.vendors) },
      ]}
    />
  );

  if (!state.vendors.length) {
    return (
      <>
        {strip}
        <EmptyState
          icon="storefront"
          title={t('vendors.emptyTitle')}
          text={t('vendors.emptyText')}
          actionLabel={t('topbar.addVendor')}
          onAction={() => openForm(vendorForm())}
        />
      </>
    );
  }

  const counts: Record<VendorFilter, number> = {
    all: state.vendors.length,
    inquiry: state.vendors.filter((v) => v.status === 'inquiry').length,
    booked: state.vendors.filter((v) => v.status === 'booked').length,
    deposit: state.vendors.filter((v) => v.status === 'deposit').length,
    paid: state.vendors.filter((v) => v.status === 'paid').length,
  };
  const segments: Segment<VendorFilter>[] = [
    { value: 'all', label: t('common.all'), count: counts.all },
    { value: 'inquiry', label: t('status.vendor.inquiry'), count: counts.inquiry },
    { value: 'booked', label: t('status.vendor.booked'), count: counts.booked },
    { value: 'deposit', label: t('status.vendor.deposit'), count: counts.deposit },
    { value: 'paid', label: t('status.vendor.paid'), count: counts.paid },
  ];

  const list = state.vendors
    .filter((v) => filter === 'all' || v.status === filter)
    .sort(COMPARATORS[sort]);

  const visible = list.filter((v) => {
    const linked = v.contactId && state.contacts.find((c) => c.id === v.contactId);
    return matches(
      `${v.name} ${v.category} ${v.contact || ''} ${linked ? linked.name : ''}`,
    );
  });

  return (
    <>
      {strip}
      <div className="my-[18px] mb-1.5 flex flex-wrap items-center justify-between gap-3.5">
        <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
        <SortSelect
          id="vendorSort"
          label={t('common.sort')}
          value={sort}
          options={[
            { value: 'cost-desc', label: t('vendors.sortCostDesc') },
            { value: 'cost-asc', label: t('vendors.sortCostAsc') },
            { value: 'name', label: t('vendors.sortName') },
            { value: 'cat', label: t('vendors.sortCat') },
          ]}
          onChange={(v) => setSort(v as VendorSort)}
        />
      </div>

      {visible.length ? (
        <Card>
          {visible.map((v) => {
            const color = categoryColor(v.category);
            const linked =
              (v.contactId && state.contacts.find((c) => c.id === v.contactId)) || null;
            const person = linked ? linked.name : v.contact || '—';
            const phone = linked ? linked.phone : v.phone;
            const meta = [phone, v.notes].filter(Boolean).join(' · ');
            return (
              <Row key={v.id}>
                <Avatar color={color} icon={iconForCategory(v.category)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate text-[14.5px] font-bold">
                    <span className="truncate">{v.name}</span>
                    <Chip variant="gray">{v.category}</Chip>
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-muted">
                    {linked ? (
                      <button
                        type="button"
                        onClick={() => gotoContact(linked.id)}
                        title={t('vendors.viewContact')}
                        className="inline-flex items-center gap-[3px] align-baseline font-bold text-info hover:underline"
                      >
                        <Icon name="link" size={15} />
                        {person}
                      </button>
                    ) : (
                      person
                    )}
                    {meta && ` · ${meta}`}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="text-[15px] font-extrabold tnum">
                    {money(v.cost || 0)}
                  </div>
                  <div className="mt-[5px]">
                    <Chip variant={STATUS_CHIP[v.status]}>
                      {t(`status.vendor.${v.status}`)}
                    </Chip>
                  </div>
                  {v.status === 'deposit' && (v.deposit ?? 0) > 0 && (
                    <div className="mt-[5px] text-[12px] font-bold text-warn tnum">
                      {t('vendors.depositPaid', { amount: money(v.deposit || 0) })}
                    </div>
                  )}
                </div>
                {v.social && (
                  <a
                    href={/^https?:\/\//i.test(v.social) ? v.social : `https://${v.social}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t('vendors.openSocial')}
                    aria-label={t('vendors.openSocial')}
                    className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink"
                  >
                    <Icon name="public" size={17} />
                  </a>
                )}
                <RowActions
                  onEdit={() => openForm(vendorForm(v))}
                  onDelete={() => deleteVendor(v.id)}
                  editLabel={t('vendors.editAria', { name: v.name })}
                  deleteLabel={t('vendors.deleteAria', { name: v.name })}
                />
              </Row>
            );
          })}
        </Card>
      ) : (
        <EmptyRow>{t('vendors.noFilter')}</EmptyRow>
      )}
    </>
  );
}
