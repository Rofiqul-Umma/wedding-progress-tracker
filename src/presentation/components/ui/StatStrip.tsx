export interface Stat {
  label: string;
  value: string | number;
}

/** The horizontal stat row shown atop most pages. */
export function StatStrip({ items }: { items: Stat[] }) {
  return (
    <div className="mb-1.5 flex flex-wrap gap-x-10 gap-y-3.5 border-b border-line pb-[18px] max-[520px]:gap-x-7">
      {items.map((s) => (
        <div key={s.label} className="flex min-w-[90px] flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{s.label}</span>
          <span className="text-[18px] font-extrabold tracking-tight tnum">
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
