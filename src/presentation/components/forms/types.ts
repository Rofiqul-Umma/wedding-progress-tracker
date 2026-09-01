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
  | 'file';

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  value?: string | number | boolean;
  options?: FieldOption[];
  /** Render at half width so two fields share a row. */
  half?: boolean;
}

export type FormValues = Record<string, string>;
export type FormChecks = Record<string, boolean>;

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
