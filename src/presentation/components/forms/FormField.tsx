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
