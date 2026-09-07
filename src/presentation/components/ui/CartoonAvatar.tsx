import type { ReactNode } from 'react';
import {
  AVATAR_FACES,
  parseAvatar,
  type AvatarColor,
  type AvatarFace,
  type AvatarFaceId,
} from '@domain/value-objects/avatars';
import { cn } from '@presentation/lib/cn';

/** Background + ring per swatch, from the existing theme tokens. */
const BG: Record<AvatarColor, string> = {
  lime: 'bg-lime-soft',
  info: 'bg-info-soft',
  warn: 'bg-warn-soft',
  ok: 'bg-ok-soft',
  bad: 'bg-bad-soft',
  neutral: 'bg-panel-2',
};

const FACE_BY_ID = new Map<AvatarFaceId, AvatarFace>(
  AVATAR_FACES.map((f) => [f.id, f]),
);

/**
 * The parts every face shares: shoulders, head, eyes, smile. Style-specific
 * hair is drawn behind (`back`) and in front of (`front`) this skeleton, which
 * is what lets twelve faces come from a handful of paths each.
 */
function Base({ skin }: { skin: string }) {
  return (
    <>
      <path d="M14 64c0-9.4 8.1-15 18-15s18 5.6 18 15z" fill={skin} />
      <circle cx="32" cy="33" r="16" fill={skin} />
      <circle cx="26" cy="32" r="1.9" fill="#2f2a26" />
      <circle cx="38" cy="32" r="1.9" fill="#2f2a26" />
      <path
        d="M27 39.5c1.6 2 3.2 3 5 3s3.4-1 5-3"
        stroke="#2f2a26"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

/**
 * The artwork, keyed by the face-id union so the compiler rejects a face that
 * has no drawing. Each entry is hair (and any accessory) around `Base`.
 */
const FACE_ART: Record<AvatarFaceId, (f: AvatarFace) => ReactNode> = {
  short: (f) => (
    <>
      <path d="M16 32a16 16 0 0 1 32 0v-3a16 16 0 0 0-32 0z" fill={f.hair} />
      <Base skin={f.skin} />
      <path d="M16 30c0-10 7-15 16-15s16 5 16 15c-3-6-8-8-16-8s-13 2-16 8z" fill={f.hair} />
    </>
  ),
  bun: (f) => (
    <>
      <circle cx="32" cy="11" r="6" fill={f.hair} />
      <Base skin={f.skin} />
      <path d="M16 31c0-10 7-15 16-15s16 5 16 15c-4-7-9-9-16-9s-12 2-16 9z" fill={f.hair} />
    </>
  ),
  long: (f) => (
    <>
      <path d="M14 30c0-11 8-17 18-17s18 6 18 17v22c-4 0-6-3-6-8V28H20v24c0 5-2 8-6 8z" fill={f.hair} />
      <Base skin={f.skin} />
      <path d="M16 30c0-10 7-15 16-15s16 5 16 15c-4-7-9-9-16-9s-12 2-16 9z" fill={f.hair} />
    </>
  ),
  curly: (f) => (
    <>
      <circle cx="20" cy="22" r="7" fill={f.hair} />
      <circle cx="32" cy="16" r="8" fill={f.hair} />
      <circle cx="44" cy="22" r="7" fill={f.hair} />
      <Base skin={f.skin} />
      <path d="M17 28c1-8 7-12 15-12s14 4 15 12c-4-6-9-8-15-8s-11 2-15 8z" fill={f.hair} />
    </>
  ),
  braids: (f) => (
    <>
      {/* Two rope braids, each a stack of beads so they read at 34px. */}
      {[16, 48].map((x) => (
        <g key={x} fill={f.hair}>
          <circle cx={x} cy="34" r="5" />
          <circle cx={x} cy="41" r="4.4" />
          <circle cx={x} cy="47" r="3.6" />
        </g>
      ))}
      <Base skin={f.skin} />
      <path d="M16 30c0-10 7-15 16-15s16 5 16 15c-4-7-9-9-16-9s-12 2-16 9z" fill={f.hair} />
    </>
  ),
  veil: (f) => (
    <>
      {/* The drape sits behind the head — an overlay across the face washed the
          whole avatar out to near-white at small sizes. */}
      <path d="M9 64c0-24 10-38 23-38s23 14 23 38z" fill="#ffffff" opacity=".9" />
      <path
        d="M9 64c0-24 10-38 23-38s23 14 23 38"
        stroke="#d8d8d2"
        strokeWidth="1.4"
        fill="none"
      />
      <Base skin={f.skin} />
      <path d="M17 29c1-9 7-14 15-14s14 5 15 14c-4-7-9-9-15-9s-11 2-15 9z" fill={f.hair} />
      {/* Tiara. */}
      <path
        d="M23 17c3-3 6-4.5 9-4.5s6 1.5 9 4.5"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="11.5" r="2.6" fill="#ffffff" stroke="#d8d8d2" strokeWidth="1" />
    </>
  ),
  hijab: (f) => (
    <>
      <path d="M32 11c11 0 19 8 19 20 0 12-6 19-9 22H22c-3-3-9-10-9-22 0-12 8-20 19-20z" fill={f.hair} />
      <circle cx="32" cy="34" r="13" fill={f.skin} />
      <circle cx="27" cy="33" r="1.8" fill="#2f2a26" />
      <circle cx="37" cy="33" r="1.8" fill="#2f2a26" />
      <path
        d="M28 39.5c1.4 1.8 2.8 2.7 4 2.7s2.6-.9 4-2.7"
        stroke="#2f2a26"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M19 47c4 2 8 3 13 3s9-1 13-3c4 4 6 9 6 17H13c0-8 2-13 6-17z" fill={f.hair} />
    </>
  ),
  beard: (f) => (
    <>
      <Base skin={f.skin} />
      <path d="M19 34c0 10 6 16 13 16s13-6 13-16c0 6-4 8-13 8s-13-2-13-8z" fill={f.hair} />
      <path
        d="M27 40c1.6 1.7 3.2 2.5 5 2.5s3.4-.8 5-2.5"
        stroke="#2f2a26"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M16 30c0-10 7-15 16-15s16 5 16 15c-4-7-9-9-16-9s-12 2-16 9z" fill={f.hair} />
    </>
  ),
  glasses: (f) => (
    <>
      <Base skin={f.skin} />
      <path d="M16 30c0-10 7-15 16-15s16 5 16 15c-4-7-9-9-16-9s-12 2-16 9z" fill={f.hair} />
      <g stroke="#2f2a26" strokeWidth="1.6" fill="none">
        <circle cx="26" cy="32" r="5" />
        <circle cx="38" cy="32" r="5" />
        <path d="M31 32h2M21 31l-3-1M43 31l3-1" strokeLinecap="round" />
      </g>
    </>
  ),
  bald: (f) => (
    <>
      <Base skin={f.skin} />
      <path
        d="M18 34c0-9 6-14 14-14s14 5 14 14"
        stroke={f.skin}
        strokeWidth="2"
        fill="none"
      />
    </>
  ),
  ponytail: (f) => (
    <>
      <path d="M46 24c6 2 9 8 9 15s-3 11-7 11c2-5 2-9 1-13s-3-9-3-13z" fill={f.hair} />
      <Base skin={f.skin} />
      <path d="M16 31c0-10 7-16 16-16s16 6 16 16c-4-8-9-10-16-10s-12 2-16 10z" fill={f.hair} />
    </>
  ),
  // Songkok: a flat-topped cylinder, not a domed cap — the app ships in
  // Indonesian and this is the everyday wedding headwear there.
  cap: (f) => (
    <>
      <Base skin={f.skin} />
      {/* Overlaps the crown (head top is y=17) so it sits on the head rather
          than hovering above it. */}
      <path d="M20 26a12 12 0 0 1 24 0z" fill={f.hair} />
      <rect x="20" y="15" width="24" height="12" rx="2" fill={f.hair} />
      <rect x="20" y="23" width="24" height="1.6" fill="#ffffff" opacity=".18" />
    </>
  ),
};

interface CartoonAvatarProps {
  /** The stored `"face:color"` value; '' or unrecognized falls back to `letter`. */
  value: string;
  /** Shown when no avatar is chosen — today's initial circle. */
  letter?: string;
  size?: number;
  className?: string;
}

/**
 * A round cartoon profile picture for one partner. Unrelated to `ui/Avatar`,
 * which is the squared, tinted category badge used in lists.
 */
export function CartoonAvatar({
  value,
  letter,
  size = 40,
  className,
}: CartoonAvatarProps) {
  const choice = parseAvatar(value);
  const face = choice && FACE_BY_ID.get(choice.face);

  if (!choice || !face) {
    return (
      <span
        aria-hidden
        className={cn(
          'grid flex-none place-items-center rounded-full bg-ink font-bold text-white',
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.41) }}
      >
        {letter || 'A'}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'block flex-none overflow-hidden rounded-full',
        BG[choice.color],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} role="presentation">
        {FACE_ART[face.id](face)}
      </svg>
    </span>
  );
}
