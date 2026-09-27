import { useEffect, useState } from 'react';
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
  /** Animate from 0 on initial mount / tab switch (defaults to true). */
  animateOnMount?: boolean;
}

export function ProgressBar({
  value,
  color,
  height = 8,
  className,
  track = 'panel',
  animateOnMount = true,
}: ProgressBarProps) {
  const target = Math.max(0, Math.min(100, value));
  const [width, setWidth] = useState(() => (animateOnMount ? 0 : target));

  useEffect(() => {
    if (!animateOnMount) {
      setWidth(target);
      return;
    }
    const timer = setTimeout(() => {
      setWidth(target);
    }, 40);
    return () => clearTimeout(timer);
  }, [target, animateOnMount]);

  return (
    <div
      role="progressbar"
      aria-valuenow={target}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'overflow-hidden rounded-full',
        track === 'panel' ? 'bg-panel' : 'bg-line',
        className,
      )}
      style={{ height }}
    >
      <span
        className="block h-full rounded-full transition-[width] duration-700 ease-planner"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}
