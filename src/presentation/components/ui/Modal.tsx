import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalShell } from './ModalShell';
import { Button } from './Button';
import { FormField } from '@presentation/components/forms/FormField';
import { useToast } from '@presentation/hooks/useToast';
import type {
  FormChecks,
  FormDescriptor,
  FormValues,
} from '@presentation/components/forms/types';

interface ModalProps {
  form: FormDescriptor;
  onClose: () => void;
}

function initialState(form: FormDescriptor): [FormValues, FormChecks] {
  const values: FormValues = {};
  const checks: FormChecks = {};
  for (const f of form.fields) {
    if (f.type === 'checkbox') checks[f.name] = Boolean(f.value);
    else values[f.name] = f.value == null ? '' : String(f.value);
  }
  return [values, checks];
}

/** Renders the active FormDescriptor as a modal dialog. */
export function Modal({ form, onClose }: ModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [[initValues, initChecks]] = useState(() => initialState(form));
  const [values, setValues] = useState<FormValues>(initValues);
  const [checks, setChecks] = useState<FormChecks>(initChecks);

  // Reset when a different descriptor is opened without unmounting.
  useEffect(() => {
    const [v, c] = initialState(form);
    setValues(v);
    setChecks(c);
  }, [form]);

  function submit() {
    const res = form.submit(values, checks);
    if (res !== true) {
      toast(res || t('toast.checkForm'));
      return;
    }
    onClose();
    toast(t('toast.saved'));
  }

  return (
    <ModalShell onClose={onClose} labelledBy="modal-title">
      <div className="px-6 pb-1 pt-[22px] max-[560px]:px-4 max-[560px]:pt-3.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime-ink">
          {form.eyebrow}
        </div>
        <h3 id="modal-title" className="mt-[5px] text-[22px] font-bold tracking-tight max-[560px]:text-xl">
          {form.title}
        </h3>
      </div>
      <div
        className="grid grid-cols-1 gap-3.5 px-6 pb-2 pt-4 sm:grid-cols-2 max-[560px]:px-4"
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            !e.nativeEvent.isComposing &&
            (e.target as HTMLElement).tagName !== 'TEXTAREA'
          ) {
            e.preventDefault();
            submit();
          }
        }}
      >
        {form.fields
          .filter((f) => !f.showWhen || f.showWhen(values))
          .map((f) => (
            <FormField
              key={f.name}
              field={f}
              value={values[f.name] ?? ''}
              values={values}
              checked={checks[f.name] ?? false}
              onValue={(name, val) => setValues((s) => ({ ...s, [name]: val }))}
              onCheck={(name, val) => setChecks((s) => ({ ...s, [name]: val }))}
            />
          ))}
      </div>
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2.5 border-t border-transparent bg-app/95 px-6 pb-[22px] pt-3.5 backdrop-blur-xs max-[560px]:border-line max-[560px]:px-4 max-[560px]:pb-4">
        {form.onDelete && (
          <Button
            variant="dangerGhost"
            icon="delete"
            onClick={() => {
              form.onDelete?.();
              onClose();
            }}
            aria-label={t('common.delete')}
            className="mr-auto max-[560px]:px-3"
          >
            <span className="max-[420px]:hidden">{t('common.delete')}</span>
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} className="max-[560px]:flex-1">
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={submit} className="max-[560px]:flex-1">
          {t('common.save')}
        </Button>
      </div>
    </ModalShell>
  );
}
