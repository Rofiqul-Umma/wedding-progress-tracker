import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyRow } from '@presentation/components/ui/EmptyState';
import { SegmentedFilter, type Segment } from '@presentation/components/ui/SegmentedFilter';
import { SortSelect } from '@presentation/components/ui/SortSelect';
import { Card } from '@presentation/components/ui/Card';
import { Row } from '@presentation/components/ui/Row';
import { Check } from '@presentation/components/ui/Check';
import { Avatar } from '@presentation/components/ui/Avatar';
import { ProgressBar } from '@presentation/components/ui/ProgressBar';
import { RowActions } from '@presentation/components/ui/RowActions';
import { usePlan } from '@presentation/state/PlanStore';
import { useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useFormat } from '@presentation/hooks/useFormat';
import {
  totalSpent,
  totalBudget,
  paidTotal,
  categoryRollup,
  maxCategoryValue,
  paidVendorEntries,
  paidShoppingItems,
  shoppingLineTotal,
} from '@domain/services/budget';
import { categoryColor } from '@domain/value-objects/status';
import { itemIcon } from '@domain/value-objects/icons';
import type { BudgetItem } from '@domain/entities/types';
import type { PreviewTarget } from '@presentation/state/UiStore';

type BudgetFilter = 'all' | 'unpaid' | 'paid';
type BudgetSort = 'amount-desc' | 'amount-asc' | 'name' | 'cat';

/**
 * A spend that lives on another page but counts toward this one's totals: a
 * paid vendor or a purchased shopping item. Flattened to the few fields the
 * row needs so both sources can share one comparator and one renderer.
 */
interface DerivedRow {
  id: string;
  name: string;
  category: string;
  /** Second line under the name, e.g. "Decor · 6 × $45". */
  meta: string;
  amount: number;
  icon: string;
  /** What clicking the row previews. */
  preview: PreviewTarget;
}

const COMPARATORS: Record<BudgetSort, (a: BudgetItem, b: BudgetItem) => number> = {
  'amount-desc': (a, b) => (+b.actual || 0) - (+a.actual || 0),
  'amount-asc': (a, b) => (+a.actual || 0) - (+b.actual || 0),
  name: (a, b) => (a.item || '').localeCompare(b.item || ''),
  cat: (a, b) => (a.category || '').localeCompare(b.category || ''),
};

/** The same orderings as `COMPARATORS`, over the derived rows' own fields. */
const DERIVED_COMPARATORS: Record<BudgetSort, (a: DerivedRow, b: DerivedRow) => number> = {
  'amount-desc': (a, b) => b.amount - a.amount,
  'amount-asc': (a, b) => a.amount - b.amount,
  name: (a, b) => a.name.localeCompare(b.name),
  cat: (a, b) => a.category.localeCompare(b.category),
};

export function BudgetPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm, openPreview } = useUi();
  const { budgetForm } = useForms();
  const { togglePaid, deleteBudget } = usePlanActions();
  const { money } = useFormat();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<BudgetFilter>('all');
  const [sort, setSort] = useState<BudgetSort>('amount-desc');

  const sp = totalSpent(state.budget, state.vendors, state.shopping);
  const tb = totalBudget(state.wedding);
  const rem = tb - sp;
  const rollup = categoryRollup(state.budget, state.vendors, state.shopping);
  const maxCat = maxCategoryValue(rollup);

  // Spends the totals above already count but that live on other pages. Listing
  // them is what makes the Line Items column add up to the Spent figure.
  const fromShopping: DerivedRow[] = paidShoppingItems(state.shopping).map((i) => {
    const qty = Math.max(1, +i.qty || 1);
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      meta: [i.category, i.store, qty > 1 ? `${qty} × ${money(+i.price || 0)}` : '']
        .filter(Boolean)
        .join(' · '),
      amount: shoppingLineTotal(i),
      icon: itemIcon(i.icon, i.category),
      preview: { kind: 'shopping', id: i.id },
    };
  });
  const fromVendors: DerivedRow[] = paidVendorEntries(state.vendors).map(
    ({ vendor, amount }) => ({
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      meta: [vendor.category, t(`status.vendor.${vendor.status}`)].filter(Boolean).join(' · '),
      amount,
      icon: itemIcon(vendor.icon, vendor.category),
      preview: { kind: 'vendor', id: vendor.id },
    }),
  );
  // Derived rows are money already out the door, so they belong to All and Paid.
  const derivedShown = filter !== 'unpaid';
  const derivedCount = fromShopping.length + fromVendors.length;

  const counts: Record<BudgetFilter, number> = {
    all: state.budget.length + derivedCount,
    unpaid: state.budget.filter((b) => !b.paid).length,
    paid: state.budget.filter((b) => b.paid).length + derivedCount,
  };
  const segments: Segment<BudgetFilter>[] = [
    { value: 'all', label: t('common.all'), count: counts.all },
    { value: 'unpaid', label: t('budget.filterUnpaid'), count: counts.unpaid },
    { value: 'paid', label: t('budget.filterPaid'), count: counts.paid },
  ];

  const items = state.budget
    .filter((b) => filter === 'all' || (filter === 'paid' ? b.paid : !b.paid))
    .sort(COMPARATORS[sort]);
  const visible = items.filter((b) => matches(`${b.item} ${b.category}`));

  const derivedVisible = (rows: DerivedRow[]) =>
    derivedShown
      ? rows
          .filter((r) => matches(`${r.name} ${r.category} ${r.meta}`))
          .sort(DERIVED_COMPARATORS[sort])
      : [];
  const shoppingRows = derivedVisible(fromShopping);
  const vendorRows = derivedVisible(fromVendors);
  const anyRows = state.budget.length + derivedCount > 0;

  return (
    <>
      <StatStrip
        items={[
          { label: t('budget.stripTotal'), value: money(tb) },
          { label: t('budget.stripSpent'), value: money(sp) },
          {
            label: rem < 0 ? t('budget.stripOver') : t('budget.stripRemaining'),
            value: money(Math.abs(rem)),
          },
          {
            label: t('budget.stripPaid'),
            value: money(paidTotal(state.budget, state.shopping)),
          },
        ]}
      />

      {anyRows && (
        <div className="my-[18px] mb-1.5 flex flex-wrap items-center justify-between gap-3.5">
          <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
          <SortSelect
            id="budgetSort"
            label={t('common.sort')}
            value={sort}
            options={[
              { value: 'amount-desc', label: t('budget.sortAmountDesc') },
              { value: 'amount-asc', label: t('budget.sortAmountAsc') },
              { value: 'name', label: t('budget.sortName') },
              { value: 'cat', label: t('budget.sortCat') },
            ]}
            onChange={(v) => setSort(v as BudgetSort)}
          />
        </div>
      )}

      <div
        className={`grid grid-cols-[1.6fr_1fr] items-start gap-[18px] max-[900px]:grid-cols-1 ${
          anyRows ? '' : 'mt-[18px]'
        }`}
      >
        <Card>
          <div className="flex items-center gap-2.5 px-[18px] pb-2.5 pt-4">
            <h3 className="text-[15px] font-bold">{t('budget.lineItems')}</h3>
            <span className="text-[13px] font-bold text-faint">
              {visible.length + shoppingRows.length + vendorRows.length}
            </span>
          </div>
          {!anyRows ? (
            <EmptyRow>{t('budget.emptyItems')}</EmptyRow>
          ) : visible.length ? (
            visible.map((b) => (
              <Row key={b.id}>
                <Check
                  checked={b.paid}
                  onChange={() => togglePaid(b.id)}
                  label={`${b.paid ? t('budget.markUnpaid') : t('budget.markPaid')}: ${b.item}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{b.item}</div>
                  <div className="mt-0.5 truncate text-[12.5px] text-muted">
                    {b.category}
                    {b.estimated ? ` · ${t('budget.est', { amount: money(b.estimated) })}` : ''}
                  </div>
                </div>
                <div className="text-[15px] font-extrabold tnum">{money(b.actual || 0)}</div>
                <RowActions
                  onEdit={() => openForm(budgetForm(b))}
                  onDelete={() => deleteBudget(b.id)}
                  editLabel={t('budget.editAria', { name: b.item })}
                  deleteLabel={t('budget.deleteAria', { name: b.item })}
                />
              </Row>
            ))
          ) : shoppingRows.length || vendorRows.length ? null : (
            <EmptyRow>{t('budget.noFilter')}</EmptyRow>
          )}
          <DerivedGroup
            title={t('budget.fromShopping')}
            rows={shoppingRows}
            onOpen={openPreview}
          />
          <DerivedGroup
            title={t('budget.fromVendors')}
            rows={vendorRows}
            onOpen={openPreview}
          />
        </Card>

        <Card pad>
          <div className="text-[15px] font-bold">{t('budget.byCategory')}</div>
          <div className="mb-4 mt-0.5 text-xs text-faint">{t('budget.byCategorySub')}</div>
          {rollup.length ? (
            rollup.map((c) => {
              const fill =
                c.estimated > 0
                  ? Math.min(100, (c.actual / c.estimated) * 100)
                  : (c.actual / maxCat) * 100;
              return (
                <div key={c.name} className="mb-[15px]">
                  <div className="mb-[7px] flex items-baseline gap-2">
                    <span
                      className="inline-block h-[9px] w-[9px] rounded-[3px]"
                      style={{ background: categoryColor(c.name) }}
                    />
                    <span className="text-[13.5px] font-bold">{c.name}</span>
                    <span className="ml-auto text-[13px] font-semibold text-muted tnum">
                      {money(c.actual)}
                      {c.estimated > 0 && (
                        <span className="text-faint"> / {money(c.estimated)}</span>
                      )}
                    </span>
                  </div>
                  <ProgressBar
                    value={fill}
                    color={c.over ? 'var(--color-bad)' : 'var(--color-ink)'}
                    track="line"
                  />
                  {c.over ? (
                    <div className="mt-[5px] text-[11.5px] font-bold text-bad">
                      {t('budget.overTarget', { amount: money(c.actual - c.estimated) })}
                    </div>
                  ) : c.estimated > 0 && c.actual < c.estimated ? (
                    <div className="mt-[5px] text-[11.5px] font-semibold text-ok">
                      {t('budget.underTarget', { amount: money(c.estimated - c.actual) })}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-faint">{t('budget.noCategories')}</p>
          )}
        </Card>
      </div>
    </>
  );
}

/**
 * A read-only block of spends owned by another page. No checkbox and no inline
 * edit/delete: these rows are paid by definition, and editing belongs to the
 * page that owns the item — clicking a row opens its preview, which carries
 * Edit and Delete of its own.
 */
function DerivedGroup({
  title,
  rows,
  onOpen,
}: {
  title: string;
  rows: DerivedRow[];
  onOpen: (target: PreviewTarget) => void;
}) {
  const { t } = useTranslation();
  const { money } = useFormat();
  if (!rows.length) return null;

  return (
    <>
      <div className="border-t border-line px-[18px] pb-1.5 pt-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-bold">{title}</h3>
          <span className="text-[13px] font-bold text-faint">{rows.length}</span>
        </div>
        <p className="mt-0.5 text-[12px] text-faint">{t('budget.derivedNote')}</p>
      </div>
      {rows.map((r) => (
        <Row
          key={r.id}
          onActivate={() => onOpen(r.preview)}
          activateLabel={t('preview.viewAria', { name: r.name })}
        >
          <Avatar color={categoryColor(r.category)} icon={r.icon} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-bold">{r.name}</div>
            <div className="mt-0.5 truncate text-[12.5px] text-muted">{r.meta}</div>
          </div>
          <div className="text-[15px] font-extrabold tnum">{money(r.amount)}</div>
        </Row>
      ))}
    </>
  );
}
