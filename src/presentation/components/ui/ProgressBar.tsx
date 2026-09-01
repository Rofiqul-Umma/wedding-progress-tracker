import { cn } from '@presentation/lib/cn';

interface ProgressBarProps {
  /** Fill percentage 0–100. */
  value: number;
  /** CSS color for the fill (accepts theme vars via arbitrary values). */
  color: string;
  /** Track height in px. */
  height?: number;
  className?: string;
  /** Use the lighter track (var(--line)) like the budget/category bars. */
  track?: 'panel' | 'line';
}

export function ProgressBar({
  value,
  color,
  height = 8,
  className,
  track = 'panel',
}: ProgressBarProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-full',
        track === 'panel' ? 'bg-panel' : 'bg-line',
        className,
      )}
      style={{ height }}
    >
      <span
        className="block h-full rounded-full transition-[width] duration-500 ease-planner"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}
