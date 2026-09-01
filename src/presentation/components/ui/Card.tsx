import type { ReactNode } from 'react';
import { cn } from '@presentation/lib/cn';

interface CardProps {
  children: ReactNode;
  /** Add interior padding (card-pad in the legacy design). */
  pad?: boolean;
  className?: string;
}

/** The bordered, rounded surface that wraps lists and panels. */
export function Card({ children, pad, className }: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-line bg-app',
        pad && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
