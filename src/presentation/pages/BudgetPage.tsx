import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyRow } from '@presentation/components/ui/EmptyState';
import { SegmentedFilter, type Segment } from '@presentation/components/ui/SegmentedFilter';
import { SortSelect } from '@presentation/components/ui/SortSelect';
import { Card } from '@presentation/components/ui/Card';
import { Row } from '@presentation/components/ui/Row';
import { Check } from '@presentation/components/ui/Check';
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
} from '@domain/services/budget';
import { categoryColor } from '@domain/value-objects/status';
import type { BudgetItem } from '@domain/entities/types';

type BudgetFilter = 'all' | 'unpaid' | 'paid';
type BudgetSort = 'amount-desc' | 'amount-asc' | 'name' | 'cat';

const COMPARATORS: Record<BudgetSort, (a: BudgetItem, b: BudgetItem) => number> = {
  'amount-desc': (a, b) => (+b.actual || 0) - (+a.actual || 0),
  'amount-asc': (a, b) => (+a.actual || 0) - (+b.actual || 0),
  name: (a, b) => (a.item || '').localeCompare(b.item || ''),
  cat: (a, b) => (a.category || '').localeCompare(b.category || ''),
};

export function BudgetPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm } = useUi();
  const { budgetForm } = useForms();
  const { togglePaid, deleteBudget } = usePlanActions();
  const { money } = useFormat();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<BudgetFilter>('all');
  const [sort, setSort] = useState<BudgetSort>('amount-desc');

  const sp = totalSpent(state.budget, state.vendors);
  const tb = totalBudget(state.wedding);
  const rem = tb - sp;
  const rollup = categoryRollup(state.budget);
  const maxCat = maxCategoryValue(rollup);

  const counts: Record<BudgetFilter, number> = {
    all: state.budget.length,
    unpaid: state.budget.filter((b) => !b.paid).length,
    paid: state.budget.filter((b) => b.paid).length,
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
          { label: t('budget.stripPaid'), value: money(paidTotal(state.budget)) },
        ]}
      />

      {state.budget.length > 0 && (
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
          state.budget.length ? '' : 'mt-[18px]'
        }`}
      >
        <Card>
          <div className="flex items-center gap-2.5 px-[18px] pb-2.5 pt-4">
            <h3 className="text-[15px] font-bold">{t('budget.lineItems')}</h3>
            <span className="text-[13px] font-bold text-faint">{visible.length}</span>
          </div>
          {!state.budget.length ? (
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
          ) : (
            <EmptyRow>{t('budget.noFilter')}</EmptyRow>
          )}
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
