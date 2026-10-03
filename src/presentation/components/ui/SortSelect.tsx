import { Select, type SelectOption } from './Select';

export type SortOption = SelectOption;

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
      <Select
        id={id}
        variant="compact"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        options={options}
      />
    </div>
  );
}
