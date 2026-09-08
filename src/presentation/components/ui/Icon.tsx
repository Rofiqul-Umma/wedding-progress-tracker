import { cn } from '@presentation/lib/cn';
import { FALLBACK_ICON, ICON_MAP, type IconName } from './icons';

interface IconProps {
  /** An icon id from `ICON_MAP`; anything else draws the fallback. */
  name: string;
  /** Rendered size in px. */
  size?: number;
  className?: string;
}

/**
 * A Lucide glyph, looked up by the app's stable icon id.
 *
 * `name` stays a plain `string` rather than `IconName` because it often comes
 * from persisted data (`icon?` on vendors, tasks, shopping and seserahan),
 * where a hand-edited backup or an older plan can carry anything.
 */
export function Icon({ name, size = 20, className }: IconProps) {
  const Glyph = ICON_MAP[name as IconName] ?? FALLBACK_ICON;
  return (
    <Glyph
      aria-hidden="true"
      size={size}
      // Lucide's default of 2 reads noticeably lighter than the Material
      // Symbols glyphs this replaced, especially white-on-color at 19px.
      strokeWidth={2.25}
      className={cn('flex-none', className)}
    />
  );
}
