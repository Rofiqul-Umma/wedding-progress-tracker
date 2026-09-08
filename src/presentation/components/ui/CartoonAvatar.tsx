import { parseAvatar, type AvatarFaceId } from '@domain/value-objects/avatars';
import { cn } from '@presentation/lib/cn';
import brideVeil from '@presentation/assets/avatars/bride_veil.webp';
import brideHijab from '@presentation/assets/avatars/bride_hijab.webp';
import brideLong from '@presentation/assets/avatars/bride_long.webp';
import brideSanggul from '@presentation/assets/avatars/bride_sanggul.webp';
import groomTux from '@presentation/assets/avatars/groom_tux.webp';
import groomKoko from '@presentation/assets/avatars/groom_koko.webp';
import groomSuit from '@presentation/assets/avatars/groom_suit.webp';
import groomBeige from '@presentation/assets/avatars/groom_beige.webp';

/**
 * The portraits, keyed by the id union so the compiler rejects an id that has
 * no image. Each is a 192px square WebP (~6 KB) whose pastel disc is part of
 * the artwork, so the tile needs no background of its own.
 */
const FACE_ART: Record<AvatarFaceId, string> = {
  bride_veil: brideVeil,
  bride_hijab: brideHijab,
  bride_long: brideLong,
  bride_sanggul: brideSanggul,
  groom_tux: groomTux,
  groom_koko: groomKoko,
  groom_suit: groomSuit,
  groom_beige: groomBeige,
};

interface CartoonAvatarProps {
  /** The stored portrait id; '' or unrecognized falls back to `letter`. */
  value: string;
  /** Shown when no avatar is chosen — today's initial circle. */
  letter?: string;
  size?: number;
  className?: string;
}

/**
 * A round illustrated profile picture for one partner. Unrelated to
 * `ui/Avatar`, which is the squared, tinted category badge used in lists.
 */
export function CartoonAvatar({
  value,
  letter,
  size = 40,
  className,
}: CartoonAvatarProps) {
  const choice = parseAvatar(value);
  const src = choice && FACE_ART[choice.face];

  if (!src) {
    return (
      <span
        aria-hidden
        className={cn(
          'grid flex-none place-items-center rounded-full bg-ink font-bold text-on-ink',
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.41) }}
      >
        {letter || 'A'}
      </span>
    );
  }

  return (
    <img
      aria-hidden
      alt=""
      src={src}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn(
        'block flex-none rounded-full object-cover',
        // The pastel disc is drawn edge to edge, so a nudged scale hides the
        // single-pixel seam the rounded clip would otherwise leave.
        'scale-[1.02]',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
