import { cn } from '@presentation/lib/cn';

export interface Stat {
  label: string;
  value: string | number;
}

/**
 * Above this count the compact layout goes three-across instead of two.
 * Only the report strip (9 stats) is dense; every page strip has four.
 */
const DENSE_FROM = 6;

/** The horizontal stat row shown atop most pages. */
export function StatStrip({ items }: { items: Stat[] }) {
  const dense = items.length > DENSE_FROM;
  return (
    // Below 560px `flex-wrap` left an orphan on its own line (three stats fit,
    // the fourth dropped), costing a full extra row of height for one value.
    // An explicit grid packs them evenly instead.
    <div
      className={cn(
        'mb-1.5 flex flex-wrap gap-x-10 gap-y-3.5 border-b border-line pb-[18px] max-[560px]:mb-0 max-[560px]:grid max-[560px]:gap-x-3 max-[560px]:gap-y-2 max-[560px]:pb-3',
        dense ? 'max-[560px]:grid-cols-3' : 'max-[560px]:grid-cols-2',
      )}
    >
      {items.map((s) => (
        <div
          key={s.label}
          className="flex min-w-[90px] flex-col gap-1 max-[560px]:min-w-0 max-[560px]:gap-0.5"
        >
          <span
            className={cn(
              'truncate text-xs font-semibold text-muted',
              // Three-across columns are narrow enough that Indonesian labels
              // ("Vendor dianggarkan") clip mid-word, so they wrap instead —
              // the grid equalises rows, so it costs one line for the strip.
              dense
                ? 'max-[560px]:overflow-visible max-[560px]:whitespace-normal max-[560px]:text-[10.5px] max-[560px]:leading-tight'
                : 'max-[560px]:text-[11px]',
            )}
          >
            {s.label}
          </span>
          <span
            className={cn(
              'text-[18px] font-extrabold tracking-tight tnum',
              // The three-across values get one more step down so the widest of
              // them ("$54,420 / $42,000") is the only one that has to wrap.
              dense ? 'max-[560px]:text-[14px]' : 'max-[560px]:text-[15.5px]',
            )}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
