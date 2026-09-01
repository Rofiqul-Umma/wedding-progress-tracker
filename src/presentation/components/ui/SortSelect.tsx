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
    <div className="inline-flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-[10px] border border-line-2 bg-app px-[11px] py-2 text-[13px] font-semibold text-ink transition-colors focus:border-ink focus:outline-none"
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
