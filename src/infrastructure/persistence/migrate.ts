import type {
  BudgetItem,
  Contact,
  Lang,
  PlanState,
  SeserahanItem,
  ShoppingItem,
  Task,
  Vendor,
} from '@domain/entities/types';

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => +(v as number) || 0;

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
        }))
      : [],
    budget: Array.isArray(s.budget) ? (s.budget as BudgetItem[]) : [],
    tasks: Array.isArray(s.tasks) ? (s.tasks as Task[]) : [],
    seserahan: Array.isArray(s.seserahan) ? (s.seserahan as SeserahanItem[]) : [],
    shopping: Array.isArray(s.shopping) ? (s.shopping as ShoppingItem[]) : [],
    contacts: Array.isArray(s.contacts)
      ? (s.contacts as Obj[]).map((c) => ({
          ...(c as unknown as Contact),
          // Field renamed email → social; carry legacy backups forward.
          social: str(c.social) || str(c.email),
        }))
      : [],
  };
}
