import type { ReactNode } from 'react';
import { cn } from '@presentation/lib/cn';

/** A list row: flex layout, top divider, and a `group` for hover-reveal actions. */
export function Row({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-[13px] border-t border-line px-[18px] py-[13px]',
        className,
      )}
    >
      {children}
    </div>
  );
}
