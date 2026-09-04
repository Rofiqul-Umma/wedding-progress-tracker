import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState, EmptyRow } from '@presentation/components/ui/EmptyState';
import { SegmentedFilter, type Segment } from '@presentation/components/ui/SegmentedFilter';
import { Card } from '@presentation/components/ui/Card';
import { Row } from '@presentation/components/ui/Row';
import { Avatar } from '@presentation/components/ui/Avatar';
import { Icon } from '@presentation/components/ui/Icon';
import { Chip, type ChipVariant } from '@presentation/components/ui/Chip';
import { ProgressBar } from '@presentation/components/ui/ProgressBar';
import { RowActions } from '@presentation/components/ui/RowActions';
import { usePlan } from '@presentation/state/PlanStore';
import { useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useFormat } from '@presentation/hooks/useFormat';
import { shopBought, shopPct } from '@domain/services/progress';
import { shoppingPaid } from '@domain/services/budget';
import { SHOP_ORDER, categoryColor } from '@domain/value-objects/status';
import { itemIcon } from '@domain/value-objects/icons';
import type { ShoppingStatus } from '@domain/value-objects/status';
import type { ShoppingItem } from '@domain/entities/types';

type ShopFilter = 'all' | ShoppingStatus;

const STATUS_CHIP: Record<ShoppingStatus, ChipVariant> = {
  toBuy: 'gray',
  ordered: 'warn',
  purchased: 'lime',
};

export function ShoppingPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { openForm, openPreview } = useUi();
  const { shoppingForm } = useForms();
  const { cycleShopping, deleteShopping } = usePlanActions();
  const { money } = useFormat();
  const matches = useSearchMatch();

  const [filter, setFilter] = useState<ShopFilter>('all');

  const items = state.shopping;
  const total = items.length;

  if (!total) {
    return (
      <EmptyState
        icon="shopping_bag"
        title={t('shopping.emptyTitle')}
        text={t('shopping.emptyText')}
        actionLabel={t('topbar.addShopping')}
        onAction={() => openForm(shoppingForm())}
      />
    );
  }

  const counts: Record<ShoppingStatus, number> = {
    toBuy: items.filter((i) => i.status === 'toBuy').length,
    ordered: items.filter((i) => i.status === 'ordered').length,
    purchased: items.filter((i) => i.status === 'purchased').length,
  };
  // The same service the budget rollups use, so the two can never disagree.
  const totalSpent = shoppingPaid(items);
  const pct = shopPct(items);

  const segments: Segment<ShopFilter>[] = [
    { value: 'all', label: t('common.all'), count: total },
    { value: 'toBuy', label: t('status.shop.toBuy'), count: counts.toBuy },
    { value: 'ordered', label: t('status.shop.ordered'), count: counts.ordered },
    { value: 'purchased', label: t('status.shop.purchased'), count: counts.purchased },
  ];

  const groups = SHOP_ORDER.filter((k) => filter === 'all' || k === filter).map((k) => ({
    key: k,
    label: t(`status.shop.${k}`),
    rows: items.filter(
      (i) =>
        i.status === k &&
        matches(`${i.name} ${i.category || ''} ${i.store || ''} ${i.notes || ''}`),
    ),
  }));

  return (
    <>
      <StatStrip
        items={[
          { label: t('shopping.stripItems'), value: total },
          { label: t('shopping.stripPurchased'), value: `${shopBought(items)}/${total}` },
          { label: t('shopping.stripOrdered'), value: counts.ordered },
          { label: t('shopping.stripSpent'), value: money(totalSpent) },
        ]}
      />

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-4">
        <SegmentedFilter options={segments} value={filter} onChange={setFilter} />
        <div className="flex min-w-[180px] flex-[0_1_300px] items-center gap-3">
          <ProgressBar value={pct} color="var(--color-lime-2)" height={9} className="flex-1" />
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
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onCycle={() => cycleShopping(item.id)}
                  onOpen={() => openPreview({ kind: 'shopping', id: item.id })}
                  onEdit={() => openForm(shoppingForm(item))}
                  onDelete={() => deleteShopping(item.id)}
                />
              ))}
            </Card>
          ) : (
            <EmptyRow>{t('shopping.nothingStage')}</EmptyRow>
          )}
        </div>
      ))}
    </>
  );
}

interface ShoppingRowProps {
  item: ShoppingItem;
  onCycle: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ShoppingRow({ item, onCycle, onOpen, onEdit, onDelete }: ShoppingRowProps) {
  const { t } = useTranslation();
  const { money } = useFormat();
  const color = categoryColor(item.category);
  const meta = [item.category || t('shopping.item'), item.store, item.notes]
    .filter(Boolean)
    .join(' · ');
  const lineTotal = (+item.price || 0) * (+item.qty || 1);

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
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-muted">{meta}</div>
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('shopping.openLink')}
          aria-label={t('shopping.openLink')}
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink max-[520px]:hidden"
        >
          <Icon name="link" size={17} />
        </a>
      )}
      {lineTotal > 0 && (
        <div className="mr-2 text-[15px] font-extrabold tnum">{money(lineTotal)}</div>
      )}
      <button
        type="button"
        onClick={onCycle}
        title={t('shopping.cycleAria', {
          name: item.name,
          status: t(`status.shop.${item.status}`),
        })}
        aria-label={t('shopping.cycleAria', {
          name: item.name,
          status: t(`status.shop.${item.status}`),
        })}
        className="rounded-full transition-transform hover:-translate-y-px"
      >
        <Chip variant={STATUS_CHIP[item.status]} dot>
          {t(`status.shop.${item.status}`)}
        </Chip>
      </button>
      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={t('shopping.editAria', { name: item.name })}
        deleteLabel={t('shopping.deleteAria', { name: item.name })}
        mobileHidden
      />
    </Row>
  );
}
