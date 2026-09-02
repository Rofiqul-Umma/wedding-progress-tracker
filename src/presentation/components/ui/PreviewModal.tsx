import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ModalShell } from './ModalShell';
import { Icon } from './Icon';
import { Chip, type ChipVariant } from './Chip';
import { Avatar } from './Avatar';
import { TaskDetail } from '@presentation/components/dashboard/TaskDetail';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { useFormat } from '@presentation/hooks/useFormat';
import { iconForCategory, categoryColor } from '@domain/value-objects/status';
import type {
  VendorStatus,
  SeserahanStatus,
  ShoppingStatus,
} from '@domain/value-objects/status';
import type { Vendor, ShoppingItem, SeserahanItem } from '@domain/entities/types';

type Money = (n: number) => string;

const VENDOR_CHIP: Record<VendorStatus, ChipVariant> = {
  paid: 'dark',
  deposit: 'warn',
  booked: 'lime',
  inquiry: 'gray',
};
const SHOP_CHIP: Record<ShoppingStatus, ChipVariant> = {
  toBuy: 'gray',
  ordered: 'warn',
  purchased: 'lime',
};
const SES_CHIP: Record<SeserahanStatus, ChipVariant> = {
  pending: 'gray',
  onProgress: 'warn',
  finished: 'lime',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 grid gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </div>
  );
}

function Header({
  eyebrow,
  category,
  title,
  onEdit,
  editLabel,
}: {
  eyebrow: string;
  category: string;
  title: string;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <Avatar color={categoryColor(category)} icon={iconForCategory(category)} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {eyebrow}
        </div>
        <h3 className="text-lg font-bold leading-tight">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
        className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line-2 bg-app text-muted transition-colors hover:bg-panel hover:text-ink"
      >
        <Icon name="edit" size={18} />
      </button>
    </div>
  );
}

function Notes({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Field label={label}>
      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{value}</p>
    </Field>
  );
}

function VendorBody({
  v,
  linkedName,
  onContact,
  onEdit,
  t,
  money,
}: {
  v: Vendor;
  linkedName: string | null;
  onContact: () => void;
  onEdit: () => void;
  t: TFunction;
  money: Money;
}) {
  const person = linkedName ?? v.contact ?? '';
  return (
    <>
      <Header
        eyebrow={t('entity.vendor')}
        category={v.category}
        title={v.name}
        onEdit={onEdit}
        editLabel={t('vendors.editAria', { name: v.name })}
      />
      <Field label={t('forms.vendor.status')}>
        <span>
          <Chip variant={VENDOR_CHIP[v.status]} dot>
            {t(`status.vendor.${v.status}`)}
          </Chip>
        </span>
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label={t('forms.vendor.category')}>
          <span className="text-[13.5px] font-semibold">{v.category || '—'}</span>
        </Field>
        <Field label={t('forms.vendor.cost')}>
          <span className="text-[13.5px] font-semibold tnum">{money(v.cost || 0)}</span>
        </Field>
      </div>
      {v.status === 'deposit' && (v.deposit ?? 0) > 0 && (
        <Field label={t('forms.vendor.deposit')}>
          <span className="text-[13.5px] font-semibold text-warn tnum">
            {money(v.deposit || 0)}
          </span>
        </Field>
      )}
      {person && (
        <Field label={t('forms.vendor.contactPerson')}>
          {linkedName ? (
            <button
              type="button"
              onClick={onContact}
              className="inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-info hover:underline"
            >
              <Icon name="link" size={16} />
              {person}
            </button>
          ) : (
            <span className="text-[13.5px] font-semibold">{person}</span>
          )}
        </Field>
      )}
      {v.phone && (
        <Field label={t('forms.vendor.phone')}>
          <span className="text-[13.5px] font-semibold">{v.phone}</span>
        </Field>
      )}
      {v.social && (
        <Field label={t('forms.vendor.social')}>
          <a
            href={/^https?:\/\//i.test(v.social) ? v.social : `https://${v.social}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-info hover:underline"
          >
            <Icon name="public" size={16} />
            <span className="truncate">{v.social}</span>
          </a>
        </Field>
      )}
      <Notes label={t('forms.vendor.notes')} value={v.notes} />
    </>
  );
}

function ShoppingBody({
  item,
  onEdit,
  t,
  money,
}: {
  item: ShoppingItem;
  onEdit: () => void;
  t: TFunction;
  money: Money;
}) {
  const qty = Math.max(1, +item.qty || 1);
  const lineTotal = (+item.price || 0) * qty;
  return (
    <>
      <Header
        eyebrow={t('entity.shopping')}
        category={item.category}
        title={item.name}
        onEdit={onEdit}
        editLabel={t('shopping.editAria', { name: item.name })}
      />
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          className="mb-4 max-h-48 w-full rounded-xl border border-line-2 object-cover"
        />
      )}
      <Field label={t('forms.shopping.status')}>
        <span>
          <Chip variant={SHOP_CHIP[item.status]} dot>
            {t(`status.shop.${item.status}`)}
          </Chip>
        </span>
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label={t('forms.shopping.category')}>
          <span className="text-[13.5px] font-semibold">{item.category || '—'}</span>
        </Field>
        <Field label={t('forms.shopping.store')}>
          <span className="text-[13.5px] font-semibold">{item.store || '—'}</span>
        </Field>
        <Field label={t('forms.shopping.price')}>
          <span className="text-[13.5px] font-semibold tnum">{money(+item.price || 0)}</span>
        </Field>
        <Field label={t('forms.shopping.qty')}>
          <span className="text-[13.5px] font-semibold tnum">{qty}</span>
        </Field>
      </div>
      {lineTotal > 0 && (
        <Field label={t('preview.total')}>
          <span className="text-[15px] font-extrabold tnum">{money(lineTotal)}</span>
        </Field>
      )}
      {item.url && (
        <Field label={t('forms.shopping.url')}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-info hover:underline"
          >
            <Icon name="link" size={16} />
            <span className="truncate">{item.url}</span>
          </a>
        </Field>
      )}
      <Notes label={t('forms.shopping.notes')} value={item.notes} />
    </>
  );
}

function SeserahanBody({
  item,
  onEdit,
  t,
  money,
}: {
  item: SeserahanItem;
  onEdit: () => void;
  t: TFunction;
  money: Money;
}) {
  return (
    <>
      <Header
        eyebrow={t('entity.seserahan')}
        category={item.category}
        title={item.name}
        onEdit={onEdit}
        editLabel={t('seserahan.editAria', { name: item.name })}
      />
      <Field label={t('forms.seserahan.status')}>
        <span>
          <Chip variant={SES_CHIP[item.status]} dot>
            {t(`status.ses.${item.status}`)}
          </Chip>
        </span>
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label={t('forms.seserahan.category')}>
          <span className="text-[13.5px] font-semibold">{item.category || '—'}</span>
        </Field>
        <Field label={t('forms.seserahan.qty')}>
          <span className="text-[13.5px] font-semibold tnum">
            {Math.max(1, +item.qty || 1)}
          </span>
        </Field>
      </div>
      {(+item.cost || 0) > 0 && (
        <Field label={t('forms.seserahan.cost')}>
          <span className="text-[13.5px] font-semibold tnum">{money(item.cost)}</span>
        </Field>
      )}
      <Notes label={t('forms.seserahan.notes')} value={item.notes} />
    </>
  );
}

/** Read-only detail dialog opened by clicking a list row. */
export function PreviewModal() {
  const { preview, closePreview, openForm } = useUi();
  const { state } = usePlan();
  const { gotoContact } = useNav();
  const { taskForm, vendorForm, shoppingForm, seserahanForm } = useForms();
  const { t } = useTranslation();
  const { money } = useFormat();

  if (!preview) return null;

  const editAndClose = (open: () => void) => {
    closePreview();
    open();
  };

  let body: ReactNode = null;

  if (preview.kind === 'task') {
    const task = state.tasks.find((x) => x.id === preview.id);
    if (!task) return null;
    body = (
      <TaskDetail
        task={task}
        onEdit={(task) => editAndClose(() => openForm(taskForm(task)))}
      />
    );
  } else if (preview.kind === 'vendor') {
    const v = state.vendors.find((x) => x.id === preview.id);
    if (!v) return null;
    const linked =
      (v.contactId && state.contacts.find((c) => c.id === v.contactId)) || null;
    body = (
      <VendorBody
        v={v}
        linkedName={linked ? linked.name : null}
        onContact={() => {
          if (v.contactId) {
            closePreview();
            gotoContact(v.contactId);
          }
        }}
        onEdit={() => editAndClose(() => openForm(vendorForm(v)))}
        t={t}
        money={money}
      />
    );
  } else if (preview.kind === 'shopping') {
    const item = state.shopping.find((x) => x.id === preview.id);
    if (!item) return null;
    body = (
      <ShoppingBody
        item={item}
        onEdit={() => editAndClose(() => openForm(shoppingForm(item)))}
        t={t}
        money={money}
      />
    );
  } else {
    const item = state.seserahan.find((x) => x.id === preview.id);
    if (!item) return null;
    body = (
      <SeserahanBody
        item={item}
        onEdit={() => editAndClose(() => openForm(seserahanForm(item)))}
        t={t}
        money={money}
      />
    );
  }

  return (
    <ModalShell onClose={closePreview} ariaLabel={t('report.col.detail')}>
      <div className="p-6 max-[520px]:p-5">{body}</div>
    </ModalShell>
  );
}
