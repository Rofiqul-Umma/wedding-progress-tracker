import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import { cn } from '@presentation/lib/cn';

type Variant = 'default' | 'primary' | 'lime' | 'ghost' | 'dangerGhost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: string;
  children?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-all duration-150 ease-planner disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  default:
    'border-line-2 bg-app text-ink hover:-translate-y-px hover:shadow-md',
  primary:
    'border-ink bg-ink text-white hover:bg-black hover:-translate-y-px hover:shadow-md',
  lime: 'border-lime bg-lime text-ink hover:bg-lime-2 hover:-translate-y-px hover:shadow-md',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-panel',
  dangerGhost:
    'border-[#F0D2D0] bg-transparent text-bad hover:bg-bad-soft',
};

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        BASE,
        VARIANTS[variant],
        size === 'sm' ? 'px-[13px] py-[9px] text-[13px]' : 'px-4 py-[11px] text-sm',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={19} />}
      {children}
    </button>
  );
}
