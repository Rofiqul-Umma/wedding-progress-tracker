import { useTranslation } from 'react-i18next';
import { usePlan } from '@presentation/state/PlanStore';
import type { FormDescriptor, Field } from '@presentation/components/forms/types';
import type {
  Vendor,
  BudgetItem,
  Task,
  SeserahanItem,
  ShoppingItem,
  Contact,
} from '@domain/entities/types';
import { VENDOR_STATUSES, SES_ORDER, SHOP_ORDER } from '@domain/value-objects/status';
import { addVendor, updateVendor } from '@application/use-cases/vendors';
import { addBudgetItem, updateBudgetItem } from '@application/use-cases/budget';
import { addTask, updateTask } from '@application/use-cases/tasks';
import { addSeserahan, updateSeserahan } from '@application/use-cases/seserahan';
import { addShopping, updateShopping } from '@application/use-cases/shopping';
import { addContact, updateContact } from '@application/use-cases/contacts';
import { nowTime } from '@infrastructure/format/date';
import { parseAttachment, serializeAttachment } from '@presentation/lib/attachments';

const numOr = (v: string, fallback = 0): number => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Builders that turn an (optional) existing entity into a FormDescriptor whose
 * `submit` performs the add/update via the pure use cases. Returns `true` on
 * success or a localized error string when validation fails.
 */
export function useForms() {
  const { state, setState } = usePlan();
  const { t } = useTranslation();

  function vendorForm(v?: Vendor): FormDescriptor {
    const editing = !!v;
    const hasContacts = state.contacts.length > 0;
    const linked = !!(v?.contactId && state.contacts.some((c) => c.id === v.contactId));
    const fields: Field[] = [
      { name: 'name', label: t('forms.vendor.name'), value: v?.name, placeholder: t('forms.vendor.namePh') },
      { name: 'category', label: t('forms.vendor.category'), value: v?.category, placeholder: t('forms.vendor.categoryPh'), half: true },
      { name: 'cost', label: t('forms.vendor.cost'), type: 'number', value: v?.cost, half: true },
      {
        name: 'status',
        label: t('forms.vendor.status'),
        type: 'select',
        value: v?.status ?? 'inquiry',
        options: VENDOR_STATUSES.map((s) => ({ value: s, label: t(`status.vendor.${s}`) })),
        half: true,
      },
      {
        name: 'deposit',
        label: t('forms.vendor.deposit'),
        type: 'number',
        value: v?.deposit,
        half: true,
        showWhen: (values) => values.status === 'deposit',
      },
    ];
    if (hasContacts) {
      fields.push({
        name: 'contactId',
        label: t('forms.vendor.linkedContact'),
        type: 'select',
        value: v?.contactId ?? '',
        options: [
          { value: '', label: t('common.none') },
          ...state.contacts.map((c) => ({ value: c.id, label: c.name })),
        ],
      });
    }
    fields.push(
      {
        name: 'contact',
        label: linked ? t('forms.vendor.contactPersonLinked') : t('forms.vendor.contactPerson'),
        value: v?.contact,
        placeholder: t('forms.vendor.contactPersonPh'),
      },
      { name: 'phone', label: t('forms.vendor.phone'), value: v?.phone, half: true },
      { name: 'social', label: t('forms.vendor.social'), type: 'url', value: v?.social, placeholder: t('forms.vendor.socialPh'), half: true },
      { name: 'notes', label: t('forms.vendor.notes'), type: 'textarea', value: v?.notes, placeholder: t('forms.vendor.notesPh') },
    );
    return {
      eyebrow: editing ? t('forms.vendor.editEyebrow') : t('forms.vendor.newEyebrow'),
      title: editing ? t('forms.vendor.updateTitle') : t('forms.vendor.addTitle'),
      fields,
      submit: (values) => {
        if (!values.name.trim()) return t('forms.vendor.errName');
        const status = values.status as Vendor['status'];
        const data: Omit<Vendor, 'id'> = {
          name: values.name,
          category: values.category,
          cost: numOr(values.cost),
          status,
          // Only a down-payment vendor carries a deposit amount.
          deposit: status === 'deposit' ? numOr(values.deposit) : 0,
          contactId: hasContacts ? values.contactId : v?.contactId ?? '',
          contact: values.contact,
          phone: values.phone,
          social: values.social.trim(),
          notes: values.notes,
        };
        setState((s) => (v ? updateVendor(s, v.id, data) : addVendor(s, data)));
        return true;
      },
    };
  }

  function budgetForm(b?: BudgetItem): FormDescriptor {
    const editing = !!b;
    return {
      eyebrow: editing ? t('forms.budget.editEyebrow') : t('forms.budget.newEyebrow'),
      title: editing ? t('forms.budget.updateTitle') : t('forms.budget.addTitle'),
      fields: [
        { name: 'item', label: t('forms.budget.item'), value: b?.item, placeholder: t('forms.budget.itemPh') },
        { name: 'category', label: t('forms.budget.category'), value: b?.category, placeholder: t('forms.budget.categoryPh') },
        { name: 'estimated', label: t('forms.budget.estimated'), type: 'number', value: b?.estimated, half: true },
        { name: 'actual', label: t('forms.budget.actual'), type: 'number', value: b?.actual, half: true },
        { name: 'paid', label: t('forms.budget.paid'), type: 'checkbox', value: b?.paid ?? false },
      ],
      submit: (values, checks) => {
        if (!values.item.trim()) return t('forms.budget.errItem');
        const data: Omit<BudgetItem, 'id'> = {
          item: values.item,
          category: values.category,
          estimated: numOr(values.estimated),
          actual: numOr(values.actual),
          paid: !!checks.paid,
        };
        setState((s) => (b ? updateBudgetItem(s, b.id, data) : addBudgetItem(s, data)));
        return true;
      },
    };
  }

  function taskForm(task?: Task): FormDescriptor {
    const editing = !!task;
    return {
      eyebrow: editing ? t('forms.task.editEyebrow') : t('forms.task.newEyebrow'),
      title: editing ? t('forms.task.updateTitle') : t('forms.task.addTitle'),
      fields: [
        { name: 'title', label: t('forms.task.title'), value: task?.title, placeholder: t('forms.task.titlePh') },
        { name: 'due', label: t('forms.task.due'), type: 'date', value: task?.due, half: true },
        { name: 'cat', label: t('forms.task.cat'), value: task?.cat, placeholder: t('forms.task.catPh'), half: true },
        { name: 'url', label: t('forms.task.url'), type: 'url', value: task?.url, placeholder: t('forms.task.urlPh') },
        { name: 'attachment', label: t('forms.task.attachment'), type: 'file', value: serializeAttachment(task?.attachment) },
      ],
      submit: (values) => {
        if (!values.title.trim()) return t('forms.task.errTitle');
        const data = {
          title: values.title,
          due: values.due,
          cat: values.cat,
          url: values.url.trim(),
          attachment: parseAttachment(values.attachment),
        };
        setState((s) =>
          task
            ? updateTask(s, task.id, data)
            : addTask(s, data, nowTime(s.settings.lang)),
        );
        return true;
      },
    };
  }

  function shoppingForm(i?: ShoppingItem): FormDescriptor {
    const editing = !!i;
    return {
      eyebrow: editing ? t('forms.shopping.editEyebrow') : t('forms.shopping.newEyebrow'),
      title: editing ? t('forms.shopping.updateTitle') : t('forms.shopping.addTitle'),
      fields: [
        { name: 'name', label: t('forms.shopping.name'), value: i?.name, placeholder: t('forms.shopping.namePh') },
        { name: 'category', label: t('forms.shopping.category'), value: i?.category, placeholder: t('forms.shopping.categoryPh'), half: true },
        { name: 'store', label: t('forms.shopping.store'), value: i?.store, placeholder: t('forms.shopping.storePh'), half: true },
        { name: 'price', label: t('forms.shopping.price'), type: 'number', value: i?.price, half: true },
        { name: 'qty', label: t('forms.shopping.qty'), type: 'number', value: i?.qty ?? 1, half: true },
        {
          name: 'status',
          label: t('forms.shopping.status'),
          type: 'select',
          value: i?.status ?? 'toBuy',
          options: SHOP_ORDER.map((s) => ({ value: s, label: t(`status.shop.${s}`) })),
        },
        { name: 'url', label: t('forms.shopping.url'), type: 'url', value: i?.url, placeholder: t('forms.shopping.urlPh') },
        { name: 'image', label: t('forms.shopping.image'), type: 'image', value: i?.image },
        { name: 'notes', label: t('forms.shopping.notes'), type: 'textarea', value: i?.notes, placeholder: t('forms.shopping.notesPh') },
      ],
      submit: (values) => {
        if (!values.name.trim()) return t('forms.shopping.errName');
        const status = (SHOP_ORDER as readonly string[]).includes(values.status)
          ? (values.status as ShoppingItem['status'])
          : 'toBuy';
        const data: Omit<ShoppingItem, 'id'> = {
          name: values.name,
          category: values.category,
          store: values.store,
          price: numOr(values.price),
          qty: Math.max(1, Math.round(numOr(values.qty, 1))),
          status,
          url: values.url.trim(),
          image: values.image,
          notes: values.notes,
        };
        setState((s) => (i ? updateShopping(s, i.id, data) : addShopping(s, data)));
        return true;
      },
    };
  }

  function seserahanForm(i?: SeserahanItem): FormDescriptor {
    const editing = !!i;
    return {
      eyebrow: editing ? t('forms.seserahan.editEyebrow') : t('forms.seserahan.newEyebrow'),
      title: editing ? t('forms.seserahan.updateTitle') : t('forms.seserahan.addTitle'),
      fields: [
        { name: 'name', label: t('forms.seserahan.name'), value: i?.name, placeholder: t('forms.seserahan.namePh') },
        { name: 'category', label: t('forms.seserahan.category'), value: i?.category, placeholder: t('forms.seserahan.categoryPh'), half: true },
        { name: 'qty', label: t('forms.seserahan.qty'), type: 'number', value: i?.qty ?? 1, half: true },
        {
          name: 'status',
          label: t('forms.seserahan.status'),
          type: 'select',
          value: i?.status ?? 'pending',
          options: SES_ORDER.map((s) => ({ value: s, label: t(`status.ses.${s}`) })),
          half: true,
        },
        { name: 'cost', label: t('forms.seserahan.cost'), type: 'number', value: i?.cost, half: true },
        { name: 'notes', label: t('forms.seserahan.notes'), type: 'textarea', value: i?.notes, placeholder: t('forms.seserahan.notesPh') },
      ],
      submit: (values) => {
        if (!values.name.trim()) return t('forms.seserahan.errName');
        const status = (SES_ORDER as readonly string[]).includes(values.status)
          ? (values.status as SeserahanItem['status'])
          : 'pending';
        const data: Omit<SeserahanItem, 'id'> = {
          name: values.name,
          category: values.category,
          qty: Math.max(1, Math.round(numOr(values.qty, 1))),
          cost: numOr(values.cost),
          status,
          notes: values.notes,
        };
        setState((s) => (i ? updateSeserahan(s, i.id, data) : addSeserahan(s, data)));
        return true;
      },
    };
  }

  function contactForm(c?: Contact): FormDescriptor {
    const editing = !!c;
    return {
      eyebrow: editing ? t('forms.contact.editEyebrow') : t('forms.contact.newEyebrow'),
      title: editing ? t('forms.contact.updateTitle') : t('forms.contact.addTitle'),
      fields: [
        { name: 'name', label: t('forms.contact.name'), value: c?.name, placeholder: t('forms.contact.namePh'), half: true },
        { name: 'role', label: t('forms.contact.role'), value: c?.role, placeholder: t('forms.contact.rolePh'), half: true },
        { name: 'phone', label: t('forms.contact.phone'), value: c?.phone, half: true },
        { name: 'email', label: t('forms.contact.email'), type: 'email', value: c?.email, half: true },
        { name: 'notes', label: t('forms.contact.notes'), type: 'textarea', value: c?.notes, placeholder: t('forms.contact.notesPh') },
      ],
      submit: (values) => {
        if (!values.name.trim()) return t('forms.contact.errName');
        const data: Omit<Contact, 'id'> = {
          name: values.name,
          role: values.role,
          phone: values.phone,
          email: values.email,
          notes: values.notes,
        };
        setState((s) => (c ? updateContact(s, c.id, data) : addContact(s, data)));
        return true;
      },
    };
  }

  return { vendorForm, budgetForm, taskForm, seserahanForm, shoppingForm, contactForm };
}
