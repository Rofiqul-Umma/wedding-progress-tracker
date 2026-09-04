import type {
  BudgetItem,
  Contact,
  Lang,
  PlanState,
  SeserahanContent,
  SeserahanItem,
  ShoppingItem,
  Task,
  Vendor,
  VendorItem,
} from '@domain/entities/types';
import { uid } from '@application/use-cases/id';

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => +(v as number) || 0;

/** Coerce arbitrary parsed data into well-formed vendor quote line items. */
function vendorItems(v: unknown): VendorItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map(asObj)
    .filter((i) => str(i.name).trim() !== '')
    .map((i) => ({
      id: str(i.id) || uid(),
      name: str(i.name),
      qty: Math.max(1, Math.round(num(i.qty)) || 1),
      price: Math.max(0, num(i.price)),
    }));
}

/** Coerce arbitrary parsed data into well-formed seserahan bundle contents. */
function seserahanContents(v: unknown): SeserahanContent[] {
  if (!Array.isArray(v)) return [];
  return v
    .map(asObj)
    .filter((c) => str(c.name).trim() !== '')
    .map((c) => ({
      id: str(c.id) || uid(),
      name: str(c.name),
      qty: Math.max(1, Math.round(num(c.qty)) || 1),
      done: c.done === true,
    }));
}

/**
 * Normalize an arbitrary parsed object (from localStorage or an imported
 * backup) into a well-formed PlanState. Fills defaults for missing settings,
 * language, wedding, and collections. Never throws.
 */
export function migrate(input: unknown): PlanState {
  const s = asObj(input);
  const settings = asObj(s.settings);
  const wedding = asObj(s.wedding);
  const lang: Lang = settings.lang === 'id' ? 'id' : 'en';

  return {
    settings: {
      currency: str(settings.currency) || 'USD',
      lang,
    },
    wedding: {
      p1: str(wedding.p1),
      p2: str(wedding.p2),
      date: str(wedding.date),
      venue: str(wedding.venue),
      budget: num(wedding.budget),
    },
    vendors: Array.isArray(s.vendors)
      ? (s.vendors as Obj[]).map((v) => ({
          ...(v as unknown as Vendor),
          // Field renamed email → social; carry legacy backups forward.
          social: str(v.social) || str(v.email),
          // Quote line items, added later. Legacy vendors get an empty list,
          // which keeps them behaving as flat-cost vendors.
          items: vendorItems(v.items),
          // Per-item icon, added later. '' means "use the category default".
          icon: str(v.icon),
        }))
      : [],
    budget: Array.isArray(s.budget) ? (s.budget as BudgetItem[]) : [],
    tasks: Array.isArray(s.tasks)
      ? (s.tasks as Obj[]).map((t) => ({
          ...(t as unknown as Task),
          icon: str(t.icon),
        }))
      : [],
    seserahan: Array.isArray(s.seserahan)
      ? (s.seserahan as Obj[]).map((i) => ({
          ...(i as unknown as SeserahanItem),
          // `url` / `image` were added after launch; legacy items lack them and
          // the form/preview code reads them as plain strings.
          url: str(i.url),
          image: str(i.image),
          // Bundle contents, added later still. Legacy items get an empty list,
          // which keeps them behaving as plain single-status trays.
          contents: seserahanContents(i.contents),
          icon: str(i.icon),
        }))
      : [],
    shopping: Array.isArray(s.shopping)
      ? (s.shopping as Obj[]).map((i) => ({
          ...(i as unknown as ShoppingItem),
          icon: str(i.icon),
        }))
      : [],
    contacts: Array.isArray(s.contacts)
      ? (s.contacts as Obj[]).map((c) => ({
          ...(c as unknown as Contact),
          // Field renamed email → social; carry legacy backups forward.
          social: str(c.social) || str(c.email),
        }))
      : [],
  };
}
