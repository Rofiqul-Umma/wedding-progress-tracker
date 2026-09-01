import { cn } from '@presentation/lib/cn';

interface IconProps {
  name: string;
  /** Font size in px (Material Symbols scale). */
  size?: number;
  /** Use the filled variant. */
  fill?: boolean;
  className?: string;
}

/** A Material Symbols Rounded glyph. */
export function Icon({ name, size = 20, fill = false, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('msi', fill && 'fill', className)}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
