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
      <div className="px-6 pb-1 pt-[22px]">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime-ink">
          {form.eyebrow}
        </div>
        <h3 id="modal-title" className="mt-[5px] text-[22px] font-bold tracking-tight">
          {form.title}
        </h3>
      </div>
      <div
        className="grid grid-cols-1 gap-3.5 px-6 pb-2 pt-4 sm:grid-cols-2"
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
        {form.fields.map((f) => (
          <FormField
            key={f.name}
            field={f}
            value={values[f.name] ?? ''}
            checked={checks[f.name] ?? false}
            onValue={(name, val) => setValues((s) => ({ ...s, [name]: val }))}
            onCheck={(name, val) => setChecks((s) => ({ ...s, [name]: val }))}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2.5 px-6 pb-[22px] pt-3.5">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={submit}>
          {t('common.save')}
        </Button>
      </div>
    </ModalShell>
  );
}
