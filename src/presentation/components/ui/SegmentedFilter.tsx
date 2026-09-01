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
    <div className="inline-flex gap-1 rounded-xl bg-panel p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[9px] px-[13px] py-[7px] text-[13px] font-semibold transition-all duration-150 ease-planner',
              on ? 'bg-app text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
            <span
              className={cn(
                'inline-grid h-[18px] min-w-[18px] place-items-center rounded-full px-[5px] text-[11px] font-bold',
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
