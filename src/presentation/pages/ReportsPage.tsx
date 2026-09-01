import { useTranslation } from 'react-i18next';
import { Card } from '@presentation/components/ui/Card';
import { Button } from '@presentation/components/ui/Button';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { usePlan } from '@presentation/state/PlanStore';
import { useFormat } from '@presentation/hooks/useFormat';
import { useToast } from '@presentation/components/ui/Toast';
import { downloadBlob, planFileSlug } from '@presentation/lib/download';
import { daysUntil } from '@domain/services/schedule';
import {
  buildReportModel,
  buildReportStats,
  formatCell,
  reportModelToCsv,
  type ReportFmt,
  type ReportSection,
} from '@application/use-cases/report';

export function ReportsPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { money, date } = useFormat();
  const toast = useToast();

  const fmt: ReportFmt = { t, money, date };
  const model = buildReportModel(state);
  const stats = buildReportStats(state, { money }).map((s) => ({
    label: t(s.labelKey),
    value: s.value,
  }));

  const { p1, p2, date: weddingDate, venue } = state.wedding;
  const couple = `${p1 || t('user.partnerFallback')} & ${p2 || ''}`.replace(/ & $/, '');
  const days = daysUntil(weddingDate);
  const todayIso = new Date().toISOString().slice(0, 10);

  function exportExcel() {
    try {
      // Prepend a BOM so Excel reads UTF-8 accents correctly.
      const csv = '﻿' + reportModelToCsv(model, fmt);
      downloadBlob(csv, `evermore-report-${planFileSlug(state)}.csv`, 'text/csv;charset=utf-8;');
      toast(t('report.exportedCsv'), { icon: 'table_view' });
    } catch {
      toast(t('toast.exportFail'));
    }
  }

  function exportPdf() {
    const prev = document.title;
    document.title = t('report.docTitle', { p1: p1 || t('user.partnerFallback'), p2: p2 || '' });
    const restore = () => {
      document.title = prev;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    toast(t('report.printHint'), { icon: 'picture_as_pdf' });
    window.print();
  }

  return (
    <div id="report-root" className="flex flex-col gap-6">
      {/* Export toolbar — hidden when printing */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 print:hidden">
        <Button variant="default" icon="table_view" onClick={exportExcel}>
          {t('report.exportExcel')}
        </Button>
        <Button variant="primary" icon="picture_as_pdf" onClick={exportPdf}>
          {t('report.exportPdf')}
        </Button>
      </div>

      {/* Report header */}
      <header className="border-b border-line pb-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t('report.generatedNote')} · {date(todayIso)}
        </div>
        <h2 className="mt-1 text-[26px] font-extrabold tracking-tight">{t('report.title')}</h2>
        <p className="mt-1 text-[15px] font-semibold text-ink-2">{couple}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {weddingDate ? date(weddingDate) : t('report.noDate')}
          {venue ? ` · ${venue}` : ''}
          {days !== null && days >= 0 ? ` · ${days} ${t('report.countdown')}` : ''}
        </p>
      </header>

      <StatStrip items={stats} />

      {model.sections.map((section) => (
        <SectionTable key={section.id} section={section} fmt={fmt} emptyLabel={t('report.empty')} />
      ))}
    </div>
  );
}

function SectionTable({
  section,
  fmt,
  emptyLabel,
}: {
  section: ReportSection;
  fmt: ReportFmt;
  emptyLabel: string;
}) {
  const numeric = (type: string) => type === 'money' || type === 'number';

  return (
    <section className="break-inside-avoid">
      <h3 className="mb-2.5 text-[15px] font-bold tracking-tight">{fmt.t(section.titleKey)}</h3>
      <Card>
        {section.rows.length === 0 ? (
          <div className="px-4 py-6 text-center text-[13px] text-faint">{emptyLabel}</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-panel/50 text-left">
                {section.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3.5 py-2.5 font-bold text-muted ${numeric(col.type) ? 'text-right tnum' : ''}`}
                  >
                    {fmt.t(col.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} className="border-b border-line last:border-b-0">
                  {section.columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2.5 ${numeric(col.type) ? 'text-right tnum' : ''}`}
                    >
                      {formatCell(row[col.key], col.type, fmt) || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
}
