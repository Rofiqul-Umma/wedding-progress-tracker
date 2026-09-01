import { Icon } from './Icon';
import { tint } from '@presentation/lib/cn';

interface AvatarProps {
  /** Category/name-derived color (hex). */
  color: string;
  /** Material Symbols icon; when omitted, `letter` is shown instead. */
  icon?: string;
  letter?: string;
  /** Size preset: list badge (40px) or timeline badge (36px). */
  size?: number;
}

/** A rounded, tinted icon/initial badge used across lists. */
export function Avatar({ color, icon, letter, size = 40 }: AvatarProps) {
  return (
    <div
      className="grid flex-none place-items-center rounded-[11px] font-bold"
      style={{
        width: size,
        height: size,
        background: tint(color),
        color,
        fontSize: 15,
      }}
    >
      {icon ? <Icon name={icon} size={19} /> : letter}
    </div>
  );
}
