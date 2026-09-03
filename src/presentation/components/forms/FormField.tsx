import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Field } from './types';
import { Icon } from '@presentation/components/ui/Icon';
import {
  FileTooLargeError,
  isImageAttachment,
  parseAttachment,
  readFileAttachment,
  readImageCompressed,
  serializeAttachment,
} from '@presentation/lib/attachments';
import { parseContentsDraft, serializeContents } from '@presentation/lib/checklist';
import {
  lineItemsSum,
  parseLineItemsDraft,
  serializeLineItems,
} from '@presentation/lib/lineItems';
import { uid } from '@application/use-cases/id';
import type { SeserahanContent, VendorItem } from '@domain/entities/types';
import { useFormat } from '@presentation/hooks/useFormat';
import { cn } from '@presentation/lib/cn';

interface FormFieldProps {
  field: Field;
  value: string;
  checked: boolean;
  onValue: (name: string, value: string) => void;
  onCheck: (name: string, checked: boolean) => void;
}

export const CONTROL =
  'w-full rounded-xl border border-line-2 bg-panel px-[13px] py-[11px] text-[14.5px] text-ink transition-colors focus:border-ink focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-ink/10';
export const LABEL = 'text-[12.5px] font-bold text-muted';

const ATTACH_BTN =
  'inline-flex items-center gap-1.5 rounded-xl border border-line-2 bg-panel px-3 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-white';

export function FormField({ field, value, checked, onValue, onCheck }: FormFieldProps) {
  const type = field.type ?? 'text';

  if (type === 'checkbox') {
    return (
      <label className="col-span-full flex items-center gap-2.5 text-sm font-semibold text-muted">
        <input
          type="checkbox"
          name={field.name}
          checked={checked}
          onChange={(e) => onCheck(field.name, e.target.checked)}
          className="h-[18px] w-[18px] accent-ink"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div className={cn('grid gap-1.5', !field.half && 'col-span-full')}>
      <label htmlFor={`f-${field.name}`} className={LABEL}>
        {field.label}
      </label>
      {type === 'select' ? (
        <select
          id={`f-${field.name}`}
          name={field.name}
          value={value}
          onChange={(e) => onValue(field.name, e.target.value)}
          className={cn(CONTROL, 'cursor-pointer')}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={`f-${field.name}`}
          name={field.name}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onValue(field.name, e.target.value)}
          className={cn(CONTROL, 'min-h-[74px] resize-y')}
        />
      ) : type === 'image' ? (
        <ImageField field={field} value={value} onValue={onValue} />
      ) : type === 'file' ? (
        <FileField field={field} value={value} onValue={onValue} />
      ) : type === 'checklist' ? (
        <ChecklistField field={field} value={value} onValue={onValue} />
      ) : type === 'lineitems' ? (
        <LineItemsField field={field} value={value} onValue={onValue} />
      ) : (
        <input
          id={`f-${field.name}`}
          name={field.name}
          type={type === 'url' ? 'url' : type}
          value={value}
          placeholder={field.placeholder}
          inputMode={type === 'number' ? 'decimal' : undefined}
          step={type === 'number' ? 'any' : undefined}
          onChange={(e) => onValue(field.name, e.target.value)}
          className={CONTROL}
        />
      )}
    </div>
  );
}

interface SubFieldProps {
  field: Field;
  value: string;
  onValue: (name: string, value: string) => void;
}

/** Image picker: stores the (compressed) image as a data URL string. */
function ImageField({ field, value, onValue }: SubFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readImageCompressed(file);
      onValue(field.name, dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value && (
        <img
          src={value}
          alt=""
          className="h-14 w-14 flex-none rounded-xl border border-line-2 object-cover"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ATTACH_BTN} onClick={() => inputRef.current?.click()}>
          <Icon name={value ? 'image' : 'add_photo_alternate'} size={17} />
          {busy ? t('forms.common.working') : value ? t('forms.common.replaceImage') : t('forms.common.addImage')}
        </button>
        {value && (
          <button
            type="button"
            className={cn(ATTACH_BTN, 'text-bad')}
            onClick={() => onValue(field.name, '')}
          >
            <Icon name="close" size={17} />
            {t('forms.common.remove')}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

/**
 * Repeatable name + quantity rows, stored as a serialized list. Stateless like
 * the pickers above: it parses `value` on every render and writes the whole
 * list back on each edit, so the form modal remains the single source of truth.
 */
function ChecklistField({ field, value, onValue }: SubFieldProps) {
  const { t } = useTranslation();
  const rows = parseContentsDraft(value);

  const write = (next: SeserahanContent[]) => onValue(field.name, serializeContents(next));
  const patch = (id: string, changes: Partial<SeserahanContent>) =>
    write(rows.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          {/* `CONTROL` carries `w-full`, which overrides `flex-1` and wraps the
              row onto three lines — so each input gets its own sized flex box. */}
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={row.name}
              placeholder={t('forms.seserahan.contentsNamePh')}
              aria-label={t('forms.seserahan.contentsName')}
              onChange={(e) => patch(row.id, { name: e.target.value })}
              className={CONTROL}
            />
          </div>
          <div className="w-[74px] flex-none max-[380px]:w-[62px]">
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={row.qty}
              aria-label={t('forms.seserahan.contentsQty')}
              onChange={(e) =>
                patch(row.id, { qty: Math.max(1, Math.round(+e.target.value) || 1) })
              }
              className={cn(CONTROL, 'px-2 text-center')}
            />
          </div>
          <button
            type="button"
            aria-label={t('forms.seserahan.contentsRemove', { name: row.name })}
            title={t('forms.common.remove')}
            onClick={() => write(rows.filter((r) => r.id !== row.id))}
            className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl border border-line-2 bg-panel text-muted transition-colors hover:bg-white hover:text-bad"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className={ATTACH_BTN}
          onClick={() => write([...rows, { id: uid(), name: '', qty: 1, done: false }])}
        >
          <Icon name="add" size={17} />
          {t('forms.seserahan.contentsAdd')}
        </button>
      </div>
    </div>
  );
}

/**
 * Repeatable name + quantity + unit-price rows for a vendor quote, stored as a
 * serialized list. Stateless like `ChecklistField`: it parses `value` on every
 * render and writes the whole list back on each edit. The running total below
 * the rows is what makes the hidden Cost field self-explanatory.
 */
function LineItemsField({ field, value, onValue }: SubFieldProps) {
  const { t } = useTranslation();
  const { money } = useFormat();
  const rows = parseLineItemsDraft(value);

  const write = (next: VendorItem[]) => onValue(field.name, serializeLineItems(next));
  const patch = (id: string, changes: Partial<VendorItem>) =>
    write(rows.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        // The name takes a full row of its own on narrow screens rather than
        // squeezing the two numeric fields off the edge.
        <div key={row.id} className="flex flex-wrap items-center gap-2">
          {/* `CONTROL` carries `w-full`, which overrides `flex-1` on the same
              element — so each input gets its own sized flex box. */}
          <div className="min-w-0 flex-[1_1_100%] sm:flex-1">
            <input
              type="text"
              value={row.name}
              placeholder={t('forms.vendor.itemsNamePh')}
              aria-label={t('forms.vendor.itemsName')}
              onChange={(e) => patch(row.id, { name: e.target.value })}
              className={CONTROL}
            />
          </div>
          <div className="w-[62px] flex-none">
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={row.qty}
              aria-label={t('forms.vendor.itemsQty')}
              onChange={(e) =>
                patch(row.id, { qty: Math.max(1, Math.round(+e.target.value) || 1) })
              }
              className={cn(CONTROL, 'px-2 text-center')}
            />
          </div>
          <div className="min-w-0 flex-1 sm:w-[104px] sm:flex-none">
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={row.price}
              aria-label={t('forms.vendor.itemsPrice')}
              onChange={(e) => patch(row.id, { price: Math.max(0, +e.target.value || 0) })}
              className={cn(CONTROL, 'px-2 text-right')}
            />
          </div>
          <button
            type="button"
            aria-label={t('forms.vendor.itemsRemove', { name: row.name })}
            title={t('forms.common.remove')}
            onClick={() => write(rows.filter((r) => r.id !== row.id))}
            className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl border border-line-2 bg-panel text-muted transition-colors hover:bg-white hover:text-bad"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className={ATTACH_BTN}
          onClick={() => write([...rows, { id: uid(), name: '', qty: 1, price: 0 }])}
        >
          <Icon name="add" size={17} />
          {t('forms.vendor.itemsAdd')}
        </button>
        {rows.length > 0 && (
          <span className="text-[13px] font-bold tnum">
            {t('forms.vendor.itemsTotal', { amount: money(lineItemsSum(rows)) })}
          </span>
        )}
      </div>
    </div>
  );
}

/** Any-file picker: stores a serialized Attachment string. */
function FileField({ field, value, onValue }: SubFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const att = parseAttachment(value);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const attachment = await readFileAttachment(file);
      onValue(field.name, serializeAttachment(attachment));
    } catch (err) {
      if (err instanceof FileTooLargeError) setError(t('forms.common.tooLarge'));
      else setError(t('forms.common.readFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {att && isImageAttachment(att) && (
          <img
            src={att.data}
            alt=""
            className="h-14 w-14 flex-none rounded-xl border border-line-2 object-cover"
          />
        )}
        <button type="button" className={ATTACH_BTN} onClick={() => inputRef.current?.click()}>
          <Icon name="attach_file" size={17} />
          {busy ? t('forms.common.working') : att ? t('forms.common.replaceFile') : t('forms.common.attachFile')}
        </button>
        {att && (
          <button
            type="button"
            className={cn(ATTACH_BTN, 'text-bad')}
            onClick={() => {
              setError('');
              onValue(field.name, '');
            }}
          >
            <Icon name="close" size={17} />
            {t('forms.common.remove')}
          </button>
        )}
      </div>
      {att && !isImageAttachment(att) && (
        <div className="flex items-center gap-1.5 truncate text-[12.5px] text-muted">
          <Icon name="description" size={15} />
          <span className="truncate">{att.name}</span>
        </div>
      )}
      {error && <p className="text-[12px] font-semibold text-bad">{error}</p>}
      <input ref={inputRef} type="file" hidden onChange={pick} />
    </div>
  );
}
