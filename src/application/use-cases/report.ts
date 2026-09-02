import type { PlanState } from '@domain/entities/types';
import {
  totalSpent,
  totalBudget,
  remaining,
  paidTotal,
  vendorsTotal,
  categoryRollup,
} from '@domain/services/budget';
import {
  tasksDone,
  openTasks,
  sesDone,
  shopBought,
  vendorsBooked,
} from '@domain/services/progress';
import { getNotifications } from '@domain/services/schedule';

/** How a column's cell values should be interpreted and formatted. */
export type ColType = 'text' | 'money' | 'number' | 'date';

export interface ReportColumn {
  key: string;
  /** i18n key resolved by the presentation/CSV layer. */
  labelKey: string;
  type: ColType;
}

export interface ReportSection {
  id: string;
  /** i18n key for the section heading. */
  titleKey: string;
  columns: ReportColumn[];
  /** Raw values keyed by column key (numbers for money/number, ISO for date). */
  rows: Record<string, string | number | null>[];
}

export interface ReportStat {
  labelKey: string;
  /** Pre-formatted display string. */
  value: string;
}

export interface ReportModel {
  sections: ReportSection[];
}

/** Formatters + translator the CSV serializer needs from the caller. */
export interface ReportFmt {
  /** i18next-compatible translator (supports count/amount interpolation). */
  t: (key: string, opts?: Record<string, unknown>) => string;
  money: (n: number) => string;
  date: (s: string) => string;
}

/**
 * Build a typed, presentation-agnostic model of the whole plan. Pure: no React,
 * no DOM, no wall-clock (notifications use the injectable `now`). The same model
 * drives both the on-screen report tables and the CSV export, so the two never
 * drift apart.
 */
export function buildReportModel(
  state: PlanState,
  now: Date = new Date(),
): ReportModel {
  const sections: ReportSection[] = [];

  // Budget by category
  sections.push({
    id: 'budgetByCategory',
    titleKey: 'report.sec.budgetByCategory',
    columns: [
      { key: 'name', labelKey: 'report.col.category', type: 'text' },
      { key: 'estimated', labelKey: 'report.col.estimated', type: 'money' },
      { key: 'actual', labelKey: 'report.col.actual', type: 'money' },
      { key: 'over', labelKey: 'report.col.status', type: 'text' },
    ],
    rows: categoryRollup(state.budget).map((c) => ({
      name: c.name,
      estimated: c.estimated,
      actual: c.actual,
      over: c.over ? 'report.overTarget' : 'report.onTarget',
    })),
  });

  // Budget line items
  sections.push({
    id: 'budgetItems',
    titleKey: 'report.sec.budgetItems',
    columns: [
      { key: 'item', labelKey: 'report.col.item', type: 'text' },
      { key: 'category', labelKey: 'report.col.category', type: 'text' },
      { key: 'estimated', labelKey: 'report.col.estimated', type: 'money' },
      { key: 'actual', labelKey: 'report.col.actual', type: 'money' },
      { key: 'paid', labelKey: 'report.col.paid', type: 'text' },
    ],
    rows: state.budget.map((b) => ({
      item: b.item,
      category: b.category,
      estimated: b.estimated,
      actual: b.actual,
      paid: b.paid ? 'report.yes' : 'report.no',
    })),
  });

  // Vendors
  sections.push({
    id: 'vendors',
    titleKey: 'report.sec.vendors',
    columns: [
      { key: 'name', labelKey: 'report.col.vendor', type: 'text' },
      { key: 'category', labelKey: 'report.col.category', type: 'text' },
      { key: 'cost', labelKey: 'report.col.cost', type: 'money' },
      { key: 'deposit', labelKey: 'report.col.deposit', type: 'money' },
      { key: 'status', labelKey: 'report.col.status', type: 'text' },
      { key: 'contact', labelKey: 'report.col.contact', type: 'text' },
      { key: 'phone', labelKey: 'report.col.phone', type: 'text' },
    ],
    rows: state.vendors.map((v) => ({
      name: v.name,
      category: v.category,
      cost: v.cost,
      deposit: v.status === 'deposit' ? v.deposit ?? 0 : null,
      status: `status.vendor.${v.status}`,
      contact: v.contact,
      phone: v.phone,
    })),
  });

  // Tasks
  sections.push({
    id: 'tasks',
    titleKey: 'report.sec.tasks',
    columns: [
      { key: 'title', labelKey: 'report.col.task', type: 'text' },
      { key: 'cat', labelKey: 'report.col.category', type: 'text' },
      { key: 'due', labelKey: 'report.col.due', type: 'date' },
      { key: 'done', labelKey: 'report.col.status', type: 'text' },
    ],
    rows: state.tasks.map((t) => ({
      title: t.title,
      cat: t.cat,
      due: t.due,
      done: t.done ? 'report.done' : 'report.open',
    })),
  });

  // Seserahan
  sections.push({
    id: 'seserahan',
    titleKey: 'report.sec.seserahan',
    columns: [
      { key: 'name', labelKey: 'report.col.item', type: 'text' },
      { key: 'category', labelKey: 'report.col.category', type: 'text' },
      { key: 'qty', labelKey: 'report.col.qty', type: 'number' },
      { key: 'cost', labelKey: 'report.col.cost', type: 'money' },
      { key: 'status', labelKey: 'report.col.status', type: 'text' },
    ],
    rows: state.seserahan.map((s) => ({
      name: s.name,
      category: s.category,
      qty: s.qty,
      cost: s.cost,
      status: `status.ses.${s.status}`,
    })),
  });

  // Shopping
  sections.push({
    id: 'shopping',
    titleKey: 'report.sec.shopping',
    columns: [
      { key: 'name', labelKey: 'report.col.item', type: 'text' },
      { key: 'category', labelKey: 'report.col.category', type: 'text' },
      { key: 'store', labelKey: 'report.col.store', type: 'text' },
      { key: 'price', labelKey: 'report.col.price', type: 'money' },
      { key: 'qty', labelKey: 'report.col.qty', type: 'number' },
      { key: 'status', labelKey: 'report.col.status', type: 'text' },
    ],
    rows: state.shopping.map((s) => ({
      name: s.name,
      category: s.category,
      store: s.store,
      price: s.price,
      qty: s.qty,
      status: `status.shop.${s.status}`,
    })),
  });

  // Contacts
  sections.push({
    id: 'contacts',
    titleKey: 'report.sec.contacts',
    columns: [
      { key: 'name', labelKey: 'report.col.name', type: 'text' },
      { key: 'role', labelKey: 'report.col.role', type: 'text' },
      { key: 'phone', labelKey: 'report.col.phone', type: 'text' },
      { key: 'social', labelKey: 'report.col.social', type: 'text' },
    ],
    rows: state.contacts.map((c) => ({
      name: c.name,
      role: c.role,
      phone: c.phone,
      social: c.social,
    })),
  });

  // Action items (overdue/soon tasks + outstanding payments)
  sections.push({
    id: 'actionItems',
    titleKey: 'report.sec.actionItems',
    columns: [
      { key: 'title', labelKey: 'report.col.item', type: 'text' },
      { key: 'area', labelKey: 'report.col.area', type: 'text' },
      { key: 'detail', labelKey: 'report.col.detail', type: 'text' },
    ],
    rows: getNotifications(state, now).map((n) => ({
      title: n.title,
      area: `nav.${n.page}`,
      // Encode the i18n descriptor so the caller can resolve it with counts.
      detail: JSON.stringify(n.message),
    })),
  });

  return { sections };
}

/** Summary headline figures for the report's stat strip. */
export function buildReportStats(
  state: PlanState,
  fmt: Pick<ReportFmt, 'money'>,
): ReportStat[] {
  return [
    {
      labelKey: 'report.stat.budgetUsed',
      value: `${fmt.money(totalSpent(state.budget, state.vendors))} / ${fmt.money(totalBudget(state.wedding))}`,
    },
    {
      labelKey: 'report.stat.remaining',
      value: fmt.money(remaining(state.wedding, state.budget, state.vendors)),
    },
    {
      labelKey: 'report.stat.paid',
      value: fmt.money(paidTotal(state.budget)),
    },
    {
      labelKey: 'report.stat.vendorsCommitted',
      value: fmt.money(vendorsTotal(state.vendors)),
    },
    {
      labelKey: 'report.stat.tasks',
      value: `${tasksDone(state.tasks)} / ${state.tasks.length}`,
    },
    {
      labelKey: 'report.stat.openTasks',
      value: String(openTasks(state.tasks)),
    },
    {
      labelKey: 'report.stat.vendorsBooked',
      value: `${vendorsBooked(state.vendors)} / ${state.vendors.length}`,
    },
    {
      labelKey: 'report.stat.seserahan',
      value: `${sesDone(state.seserahan)} / ${state.seserahan.length}`,
    },
    {
      labelKey: 'report.stat.shopping',
      value: `${shopBought(state.shopping)} / ${state.shopping.length}`,
    },
  ];
}

/** Resolve one cell to its display string using the caller's formatters. */
export function formatCell(
  value: string | number | null,
  type: ColType,
  fmt: ReportFmt,
): string {
  if (value === null || value === '') return '';
  if (type === 'money') return fmt.money(Number(value));
  if (type === 'number') return String(value);
  if (type === 'date') return fmt.date(String(value));
  // text: value may be an i18n key, a JSON action descriptor, or plain text.
  return resolveText(String(value), fmt);
}

/** Resolve a `text` cell: JSON descriptor → i18n string → key lookup → literal. */
function resolveText(raw: string, fmt: ReportFmt): string {
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const d = JSON.parse(raw) as { key: string; count?: number; amount?: number };
      if (d && typeof d.key === 'string') {
        if (typeof d.amount === 'number') return fmt.t(d.key, { amount: fmt.money(d.amount) });
        if (typeof d.count === 'number') return fmt.t(d.key, { count: d.count });
        return fmt.t(d.key);
      }
    } catch {
      /* fall through to literal */
    }
  }
  // A dotted key like "status.vendor.paid" resolves via i18n; unknown keys
  // return themselves from i18next, which is fine for plain-text cells.
  return /^[a-z][\w]*(\.[\w]+)+$/i.test(raw) ? fmt.t(raw) : raw;
}

/** Escape a single field for RFC-4180 CSV. */
function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Serialize the model to a single stacked CSV (opens directly in Excel). Money
 * and number columns emit raw numeric values so Excel can sum them; dates and
 * text are localized via the passed formatters. Sections are separated by a
 * title row and a blank line.
 */
export function reportModelToCsv(model: ReportModel, fmt: ReportFmt): string {
  const lines: string[] = [];

  for (const section of model.sections) {
    lines.push(csvField(fmt.t(section.titleKey)));
    lines.push(section.columns.map((c) => csvField(fmt.t(c.labelKey))).join(','));

    for (const row of section.rows) {
      lines.push(
        section.columns
          .map((col) => {
            const value = row[col.key];
            if (value === null || value === undefined || value === '') return '';
            if (col.type === 'money' || col.type === 'number') return String(Number(value));
            if (col.type === 'date') return csvField(fmt.date(String(value)));
            return csvField(resolveText(String(value), fmt));
          })
          .join(','),
      );
    }

    lines.push('');
  }

  return lines.join('\r\n');
}
