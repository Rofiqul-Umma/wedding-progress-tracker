export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'email'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'url'
  | 'image'
  | 'file'
  | 'checklist'
  | 'lineitems';

export interface FieldOption {
  value: string;
  label: string;
}

export type FormValues = Record<string, string>;
export type FormChecks = Record<string, boolean>;

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  value?: string | number | boolean;
  options?: FieldOption[];
  /** Render at half width so two fields share a row. */
  half?: boolean;
  /**
   * Optional predicate over the live form values: when it returns false the
   * field is hidden (e.g. a down-payment amount that only applies to a certain
   * status). Fields without a predicate are always shown.
   */
  showWhen?: (values: FormValues) => boolean;
}

export interface FormDescriptor {
  eyebrow: string;
  title: string;
  fields: Field[];
  /**
   * Perform the mutation. Return `true` on success (the modal closes and shows
   * a "Saved" toast) or an error message string (shown as a toast, modal stays
   * open).
   */
  submit: (values: FormValues, checks: FormChecks) => true | string;
}
