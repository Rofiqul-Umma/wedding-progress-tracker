import { describe, it, expect } from 'vitest';
import type { PlanState } from '@domain/entities/types';
import { seed } from '@infrastructure/persistence/seed';
import { migrate } from '@infrastructure/persistence/migrate';
import {
  buildReportModel,
  buildReportStats,
  reportModelToCsv,
  type ReportFmt,
} from './report';

// Identity-ish formatters: keep i18n keys verbatim so assertions are stable,
// but resolve the {{count}}/{{amount}} placeholders the way the app does.
const fmt: ReportFmt = {
  t: (k) => k,
  money: (n) => `$${n}`,
  date: (s) => (s ? `D(${s})` : ''),
};

function sectionIds(state: PlanState): string[] {
  return buildReportModel(state).sections.map((s) => s.id);
}

describe('buildReportModel', () => {
  it('includes every section', () => {
    expect(sectionIds(seed())).toEqual([
      'budgetByCategory',
      'budgetItems',
      'vendors',
      'tasks',
      'seserahan',
      'shopping',
      'contacts',
      'actionItems',
    ]);
  });

  it('row counts match the plan collections', () => {
    const state = seed();
    const model = buildReportModel(state);
    const byId = Object.fromEntries(model.sections.map((s) => [s.id, s.rows]));
    expect(byId.budgetItems).toHaveLength(state.budget.length);
    expect(byId.vendors).toHaveLength(state.vendors.length);
    expect(byId.tasks).toHaveLength(state.tasks.length);
    expect(byId.seserahan).toHaveLength(state.seserahan.length);
    expect(byId.shopping).toHaveLength(state.shopping.length);
    expect(byId.contacts).toHaveLength(state.contacts.length);
  });

  it('yields all sections with zero rows for an empty plan', () => {
    const empty = migrate({});
    const model = buildReportModel(empty);
    expect(model.sections).toHaveLength(8);
    for (const s of model.sections) expect(s.rows).toHaveLength(0);
  });
});

describe('buildReportStats', () => {
  it('summarizes budget and progress figures', () => {
    const state = seed();
    const stats = buildReportStats(state, fmt);
    const byLabel = Object.fromEntries(stats.map((s) => [s.labelKey, s.value]));
    const done = state.tasks.filter((t) => t.done).length;
    expect(byLabel['report.stat.tasks']).toBe(`${done} / ${state.tasks.length}`);
    // budget used shows spent / total
    expect(byLabel['report.stat.budgetUsed']).toContain('/');
  });
});

describe('reportModelToCsv', () => {
  it('emits a title row and header row per section', () => {
    const csv = reportModelToCsv(buildReportModel(seed()), fmt);
    expect(csv).toContain('report.sec.vendors');
    expect(csv).toContain('report.col.vendor');
    expect(csv).toContain('report.sec.budgetItems');
  });

  it('emits raw numbers for money/number columns', () => {
    const state = migrate({
      vendors: [
        { id: 'v1', name: 'Ivy', category: 'Venue', contact: '', phone: '', social: '', cost: 14500, status: 'paid', notes: '' },
      ],
    });
    const csv = reportModelToCsv(buildReportModel(state), fmt);
    // raw 14500, not "$14500"
    expect(csv).toMatch(/(^|,)14500(,|\r|\n)/);
    expect(csv).not.toContain('$14500');
  });

  it('escapes fields containing commas and quotes', () => {
    const state = migrate({
      contacts: [
        { id: 'c1', name: 'Adler, Reneé', role: 'Says "hi"', phone: '', email: '', notes: '' },
      ],
    });
    const csv = reportModelToCsv(buildReportModel(state), fmt);
    expect(csv).toContain('"Adler, Reneé"');
    expect(csv).toContain('"Says ""hi"""');
  });

  it('still emits headers for an empty plan', () => {
    const csv = reportModelToCsv(buildReportModel(migrate({})), fmt);
    expect(csv).toContain('report.sec.contacts');
    expect(csv).toContain('report.col.email');
  });
});
