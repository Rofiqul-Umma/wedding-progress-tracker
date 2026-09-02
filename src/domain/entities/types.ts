import type {
  VendorStatus,
  SeserahanStatus,
  ShoppingStatus,
} from '@domain/value-objects/status';

/** UI language. */
export type Lang = 'en' | 'id';

/** A file or image attached to an entity, stored inline as a data URL. */
export interface Attachment {
  /** Original filename, e.g. "quote.pdf". */
  name: string;
  /** MIME type, e.g. "image/jpeg" or "application/pdf". */
  type: string;
  /** The file contents as a base64 `data:` URL. */
  data: string;
}

/** A wedding vendor (venue, caterer, photographer…). */
export interface Vendor {
  id: string;
  name: string;
  category: string;
  /** Free-text contact person, used when no `contactId` is linked. */
  contact: string;
  phone: string;
  /** Social media handle or website URL. */
  social: string;
  cost: number;
  status: VendorStatus;
  /** Amount paid as a down payment (only meaningful when status is 'deposit'). */
  deposit?: number;
  notes: string;
  /** Optional link to a Contact entity. */
  contactId?: string;
}

/** A single budget line item. */
export interface BudgetItem {
  id: string;
  category: string;
  item: string;
  estimated: number;
  actual: number;
  paid: boolean;
}

/** A to-do / planning task. */
export interface Task {
  id: string;
  title: string;
  /** ISO date `YYYY-MM-DD`, or '' when unset. */
  due: string;
  done: boolean;
  /** Category label, e.g. "Catering". */
  cat: string;
  /** Human-readable creation time, e.g. "09:05 AM". */
  created: string;
  /** Optional reference link (product page, doc, inspiration). */
  url?: string;
  /** Optional attached file or image, stored inline. */
  attachment?: Attachment | null;
}

/** A seserahan (gift tray) item. */
export interface SeserahanItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  cost: number;
  status: SeserahanStatus;
  notes: string;
}

/** A shopping item needed for the wedding (decor, attire, favors…). */
export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  /** Where to buy it (shop name or marketplace). */
  store: string;
  /** Unit price. */
  price: number;
  /** Quantity to buy. */
  qty: number;
  status: ShoppingStatus;
  /** Optional product / reference link. */
  url: string;
  /** Optional reference photo, stored inline as a data URL. */
  image: string;
  notes: string;
}

/** An important person (vendor coordinator, officiant, family…). */
export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  /** Social media profile or website URL (e.g. Instagram, TikTok). */
  social: string;
  notes: string;
}

/** Top-level wedding details. */
export interface Wedding {
  p1: string;
  p2: string;
  /** ISO date `YYYY-MM-DD`, or '' when unset. */
  date: string;
  venue: string;
  budget: number;
}

/** App-wide preferences. */
export interface Settings {
  currency: string;
  lang: Lang;
}

/** The entire persisted application state. */
export interface PlanState {
  settings: Settings;
  wedding: Wedding;
  vendors: Vendor[];
  budget: BudgetItem[];
  tasks: Task[];
  seserahan: SeserahanItem[];
  shopping: ShoppingItem[];
  contacts: Contact[];
}

/** The array-typed collections of a plan (used for generic CRUD). */
export type PlanCollectionKey =
  | 'vendors'
  | 'budget'
  | 'tasks'
  | 'seserahan'
  | 'shopping'
  | 'contacts';
