import type { ReactNode } from 'react';
import { cn } from '@presentation/lib/cn';

export type ChipVariant =
  | 'lime'
  | 'dark'
  | 'gray'
  | 'ok'
  | 'info'
  | 'warn'
  | 'bad';

const VARIANTS: Record<ChipVariant, string> = {
  lime: 'bg-lime-soft text-lime-ink',
  dark: 'bg-ink text-white',
  gray: 'bg-panel text-muted',
  ok: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
};

interface ChipProps {
  variant?: ChipVariant;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Chip({ variant = 'gray', dot, className, children }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[11px] py-1 text-xs font-bold',
        VARIANTS[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
