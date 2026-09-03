import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ModalShell } from './ModalShell';
import { Icon } from './Icon';
import { Button } from './Button';
import { Chip, type ChipVariant } from './Chip';
import { Avatar } from './Avatar';
import { Check } from './Check';
import { TaskDetail } from '@presentation/components/dashboard/TaskDetail';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { useFormat } from '@presentation/hooks/useFormat';
import { iconForCategory, categoryColor } from '@domain/value-objects/status';
import { contentsProgress, effectiveSeserahanStatus } from '@domain/services/progress';
import { effectiveVendorCost } from '@domain/services/budget';
import { cn } from '@presentation/lib/cn';
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
}: {
  eyebrow: string;
  category: string;
  title: string;
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

function Footer({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: () => void;
  onDelete: () => void;
  t: TFunction;
}) {
  return (
    <div className="mt-6 flex gap-2.5 border-t border-line pt-5">
      <Button variant="default" icon="edit" onClick={onEdit} className="flex-1">
        {t('common.edit')}
      </Button>
      <Button variant="dangerGhost" icon="delete" onClick={onDelete}>
        {t('common.delete')}
      </Button>
    </div>
  );
}

function VendorBody({
  v,
  linkedName,
  onContact,
  t,
  money,
}: {
  v: Vendor;
  linkedName: string | null;
  onContact: () => void;
  t: TFunction;
  money: Money;
}) {
  const person = linkedName ?? v.contact ?? '';
  const items = v.items ?? [];
  return (
    <>
      <Header eyebrow={t('entity.vendor')} category={v.category} title={v.name} />
      <Field label={t('forms.vendor.status')}>
        <span>
          <Chip variant={VENDOR_CHIP[v.status]} dot>
            {t(`status.vendor.${v.status}`)}
          </Chip>
        </span>
      </Field>
      {items.length > 0 && (
        <Field label={t('vendors.itemsTitle', { count: items.length })}>
          {/* `min-w-0` throughout: a grid/flex child defaults to a min-content
              floor, which the fixed-width figures would push past the dialog. */}
          <div className="grid min-w-0 gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                  {item.name}
                </span>
                {item.qty > 1 && <Chip variant="gray">×{item.qty}</Chip>}
                {/* The unit price is the least useful of the three when space
                    runs out — it is recoverable from the line total and qty. */}
                <span className="flex-none text-[12px] text-faint tnum max-[420px]:hidden">
                  {money(item.price)}
                </span>
                <span className="flex-none text-right text-[13.5px] font-semibold tnum">
                  {money(item.price * item.qty)}
                </span>
              </div>
            ))}
            <div className="flex min-w-0 items-center justify-between border-t border-line pt-2">
              <span className="text-[12.5px] font-bold text-muted">
                {t('preview.total')}
              </span>
              <span className="text-[14px] font-extrabold tnum">
                {money(effectiveVendorCost(v))}
              </span>
            </div>
          </div>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3.5">
        <Field label={t('forms.vendor.category')}>
          <span className="text-[13.5px] font-semibold">{v.category || '—'}</span>
        </Field>
        <Field label={t('forms.vendor.cost')}>
          <span className="text-[13.5px] font-semibold tnum">
            {money(effectiveVendorCost(v))}
          </span>
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
  onViewImage,
  t,
  money,
}: {
  item: ShoppingItem;
  onViewImage: (src: string, alt: string) => void;
  t: TFunction;
  money: Money;
}) {
  const qty = Math.max(1, +item.qty || 1);
  const lineTotal = (+item.price || 0) * qty;
  return (
    <>
      <Header eyebrow={t('entity.shopping')} category={item.category} title={item.name} />
      {item.image && (
        <button
          type="button"
          onClick={() => onViewImage(item.image, item.name)}
          className="mb-4 block w-full"
        >
          <img
            src={item.image}
            alt={item.name}
            className="max-h-48 w-full rounded-xl border border-line-2 object-cover"
          />
        </button>
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
  onViewImage,
  onToggleContent,
  t,
  money,
}: {
  item: SeserahanItem;
  onViewImage: (src: string, alt: string) => void;
  onToggleContent: (contentId: string) => void;
  t: TFunction;
  money: Money;
}) {
  const progress = contentsProgress(item);
  const status = effectiveSeserahanStatus(item);
  return (
    <>
      <Header eyebrow={t('entity.seserahan')} category={item.category} title={item.name} />
      {item.image && (
        <button
          type="button"
          onClick={() => onViewImage(item.image, item.name)}
          className="mb-4 block w-full"
        >
          <img
            src={item.image}
            alt={item.name}
            className="max-h-48 w-full rounded-xl border border-line-2 object-cover"
          />
        </button>
      )}
      <Field label={t('forms.seserahan.status')}>
        <span>
          <Chip variant={SES_CHIP[status]} dot>
            {t(`status.ses.${status}`)}
          </Chip>
        </span>
      </Field>
      {progress && (
        <Field
          label={t('seserahan.contentsTitle', {
            done: progress.done,
            total: progress.total,
          })}
        >
          <div className="grid gap-2">
            {item.contents.map((content) => (
              <div key={content.id} className="flex items-center gap-2.5">
                <Check
                  checked={content.done}
                  onChange={() => onToggleContent(content.id)}
                  label={t('seserahan.contentsToggleAria', { name: content.name })}
                />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[13.5px] font-semibold',
                    content.done && 'text-muted line-through',
                  )}
                >
                  {content.name}
                </span>
                {content.qty > 1 && <Chip variant="gray">×{content.qty}</Chip>}
              </div>
            ))}
            <p className="text-[12px] text-faint">{t('seserahan.derivedNote')}</p>
          </div>
        </Field>
      )}
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
      {item.url && (
        <Field label={t('forms.seserahan.url')}>
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
      <Notes label={t('forms.seserahan.notes')} value={item.notes} />
    </>
  );
}

/** Read-only detail dialog opened by clicking a list row. */
export function PreviewModal() {
  const { preview, closePreview, openForm, openImage } = useUi();
  const { state } = usePlan();
  const { gotoContact } = useNav();
  const { taskForm, vendorForm, shoppingForm, seserahanForm } = useForms();
  const {
    deleteTask,
    deleteVendor,
    deleteShopping,
    deleteSeserahan,
    toggleSeserahanContent,
  } = usePlanActions();
  const { t } = useTranslation();
  const { money } = useFormat();

  if (!preview) return null;

  const editAndClose = (open: () => void) => {
    closePreview();
    open();
  };
  const deleteAndClose = (remove: () => void) => {
    closePreview();
    remove();
  };

  let body: ReactNode = null;
  let onEdit: () => void;
  let onDelete: () => void;

  if (preview.kind === 'task') {
    const task = state.tasks.find((x) => x.id === preview.id);
    if (!task) return null;
    body = <TaskDetail task={task} />;
    onEdit = () => editAndClose(() => openForm(taskForm(task)));
    onDelete = () => deleteAndClose(() => deleteTask(task.id));
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
        t={t}
        money={money}
      />
    );
    onEdit = () => editAndClose(() => openForm(vendorForm(v)));
    onDelete = () => deleteAndClose(() => deleteVendor(v.id));
  } else if (preview.kind === 'shopping') {
    const item = state.shopping.find((x) => x.id === preview.id);
    if (!item) return null;
    body = <ShoppingBody item={item} onViewImage={openImage} t={t} money={money} />;
    onEdit = () => editAndClose(() => openForm(shoppingForm(item)));
    onDelete = () => deleteAndClose(() => deleteShopping(item.id));
  } else {
    const item = state.seserahan.find((x) => x.id === preview.id);
    if (!item) return null;
    body = (
      <SeserahanBody
        item={item}
        onViewImage={openImage}
        onToggleContent={(contentId) => toggleSeserahanContent(item.id, contentId)}
        t={t}
        money={money}
      />
    );
    onEdit = () => editAndClose(() => openForm(seserahanForm(item)));
    onDelete = () => deleteAndClose(() => deleteSeserahan(item.id));
  }

  return (
    <ModalShell onClose={closePreview} ariaLabel={t('report.col.detail')}>
      <div className="p-6 max-[520px]:p-5">
        {body}
        <Footer onEdit={onEdit} onDelete={onDelete} t={t} />
      </div>
    </ModalShell>
  );
}
