import type { PageId } from '@presentation/state/NavStore';

export interface PageDef {
  id: PageId;
  icon: string;
}

/** Page order + icons for the sidebar and mobile nav (labels come from i18n). */
export const PAGES: PageDef[] = [
  { id: 'dashboard', icon: 'timeline' },
  { id: 'vendors', icon: 'storefront' },
  { id: 'budget', icon: 'account_balance_wallet' },
  { id: 'tasks', icon: 'checklist' },
  { id: 'shopping', icon: 'shopping_bag' },
  { id: 'seserahan', icon: 'redeem' },
  { id: 'contacts', icon: 'contacts' },
  { id: 'reports', icon: 'summarize' },
];
