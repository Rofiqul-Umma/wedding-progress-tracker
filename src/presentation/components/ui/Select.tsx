import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cn } from '@presentation/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectVariant = 'default' | 'compact';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: SelectVariant;
  options?: readonly SelectOption[] | SelectOption[];
  containerClassName?: string;
  iconName?: string;
  iconSize?: number;
  iconClassName?: string;
  children?: ReactNode;
}

const BASE_SELECT =
  'cursor-pointer appearance-none transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<SelectVariant, string> = {
  default:
    'w-full rounded-xl border border-line-2 bg-panel pl-[13px] pr-10 py-[11px] text-[14.5px] text-ink focus:border-ink focus:bg-app focus:ring-[3px] focus:ring-ink/10',
  compact:
    'rounded-[10px] border border-line-2 bg-app pl-[11px] pr-7 py-2 text-[13px] font-semibold text-ink focus:border-ink max-[560px]:max-w-[116px] max-[560px]:pl-2 max-[560px]:pr-6 max-[560px]:py-[5px] max-[560px]:text-[12px]',
};

/**
 * Dropdown component with a custom bottom arrow icon.
 *
 * Removes the browser default OS picker arrow with `appearance-none` and
 * replaces it with the design system's bottom chevron icon (`expand_more`).
 * The arrow icon has `pointer-events-none` so clicks directly activate the
 * underlying native `<select>` element.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    variant = 'default',
    options,
    children,
    className,
    containerClassName,
    iconName = 'expand_more',
    iconSize,
    iconClassName,
    ...rest
  },
  ref,
) {
  const isCompact = variant === 'compact';
  const defaultIconSize = isCompact ? 15 : 18;
  const currentIconSize = iconSize ?? defaultIconSize;

  return (
    <div
      className={cn(
        'group relative',
        isCompact ? 'inline-flex flex-none items-center' : 'w-full',
        containerClassName,
      )}
    >
      <select
        ref={ref}
        className={cn(BASE_SELECT, VARIANTS[variant], className)}
        {...rest}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <Icon
        name={iconName}
        size={currentIconSize}
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted transition-colors group-hover:text-ink',
          isCompact ? 'right-2 max-[560px]:right-1.5' : 'right-3.5',
          iconClassName,
        )}
      />
    </div>
  );
});
