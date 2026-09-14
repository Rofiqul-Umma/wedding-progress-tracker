interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  id: string;
  label: string;
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
}

/** Labeled dropdown for list sorting. */
export function SortSelect({ id, label, value, options, onChange }: SortSelectProps) {
  return (
    <div className="inline-flex flex-none items-center gap-2 max-[560px]:gap-0">
      {/* Below 560px the control sits beside the filter pills, where the word
          "Sort" costs more width than it explains — the select still carries an
          accessible name through `aria-label`. */}
      <label htmlFor={id} className="text-xs font-semibold text-muted max-[560px]:sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-[10px] border border-line-2 bg-app px-[11px] py-2 text-[13px] font-semibold text-ink transition-colors focus:border-ink focus:outline-none max-[560px]:max-w-[116px] max-[560px]:px-1.5 max-[560px]:py-[5px] max-[560px]:text-[12px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
