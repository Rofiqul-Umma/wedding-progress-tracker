import { cn } from '@presentation/lib/cn';

export interface Segment<T extends string> {
  value: T;
  label: string;
  count: number;
}

interface SegmentedFilterProps<T extends string> {
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** The pill-style segmented filter used on vendors/budget/seserahan. */
export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
}: SegmentedFilterProps<T>) {
  return (
    // The pill strip already scrolls, so below 560px it gives up `inline-flex`
    // and shares the row with whatever sits beside it (sort dropdown, progress
    // bar) instead of claiming a line of its own.
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-panel p-1 [-ms-overflow-style:none] [scrollbar-width:none] max-[560px]:flex max-[560px]:min-w-0 max-[560px]:flex-1 max-[560px]:p-[3px] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-[13px] py-[7px] text-[13px] font-semibold transition-all duration-150 ease-planner max-[560px]:gap-1 max-[560px]:px-2.5 max-[560px]:py-1.5 max-[560px]:text-[12.5px]',
              on ? 'bg-app text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
            <span
              className={cn(
                'inline-grid h-[18px] min-w-[18px] place-items-center rounded-full px-[5px] text-[11px] font-bold max-[560px]:h-4 max-[560px]:min-w-4 max-[560px]:px-1 max-[560px]:text-[10px]',
                on ? 'bg-lime-soft text-lime-ink' : 'bg-panel-2 text-muted',
              )}
            >
              {o.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
