import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { cn } from '@presentation/lib/cn';

const BASE =
  'group flex items-center gap-[13px] border-t border-line px-[18px] py-[13px] max-[520px]:gap-2.5 max-[520px]:px-3.5';

/** Interactive controls inside a row that should NOT trigger the row's activation. */
const INTERACTIVE = 'a,button,input,select,textarea,label';

/** A list row: flex layout, top divider, and a `group` for hover-reveal actions. */
export function Row({
  children,
  className,
  onActivate,
  activateLabel,
}: {
  children: ReactNode;
  className?: string;
  /** When set, clicking the row (outside its own controls) opens a preview. */
  onActivate?: () => void;
  activateLabel?: string;
}) {
  if (!onActivate) {
    return <div className={cn(BASE, className)}>{children}</div>;
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    // Let checkboxes, links and action buttons behave as their own targets.
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    onActivate();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Only activate when the row itself is focused, not a child control.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={activateLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        BASE,
        'cursor-pointer transition-colors hover:bg-panel/60 focus-visible:bg-panel/60 focus-visible:outline-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
