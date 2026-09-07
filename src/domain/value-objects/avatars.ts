/**
 * Cartoon profile pictures for the couple.
 *
 * Deliberately a small curated set drawn in code (see `CartoonAvatar`) rather
 * than uploaded images: the planner is offline-first and the whole plan syncs
 * as JSON, so an avatar has to cost a handful of bytes, not a data URL.
 */

/**
 * The face ids, as a union rather than plain strings: the artwork map in
 * `CartoonAvatar` is keyed by this type, so adding a face here without drawing
 * it is a compile error rather than a blank circle at runtime.
 */
export const AVATAR_FACE_LIST = [
  'short',
  'bun',
  'long',
  'curly',
  'braids',
  'veil',
  'hijab',
  'beard',
  'glasses',
  'bald',
  'ponytail',
  'cap',
] as const;

export type AvatarFaceId = (typeof AVATAR_FACE_LIST)[number];

/** One cartoon face. Skin/hair are baked in so the set stays visibly varied. */
export interface AvatarFace {
  id: AvatarFaceId;
  /** Face fill. */
  skin: string;
  /** Hair / head-covering fill. */
  hair: string;
}

/** Four warm skin tones and two dark hair tones, rotated across the set. */
const SKIN = ['#f2d3b6', '#e0b088', '#c48a5c', '#8d5a34'] as const;
const HAIR = ['#2f2a26', '#5a3a24'] as const;

export const AVATAR_FACES: AvatarFace[] = [
  { id: 'short', skin: SKIN[0], hair: HAIR[0] },
  { id: 'bun', skin: SKIN[1], hair: HAIR[0] },
  { id: 'long', skin: SKIN[2], hair: HAIR[1] },
  { id: 'curly', skin: SKIN[3], hair: HAIR[0] },
  { id: 'braids', skin: SKIN[3], hair: HAIR[0] },
  { id: 'veil', skin: SKIN[0], hair: HAIR[1] },
  { id: 'hijab', skin: SKIN[2], hair: HAIR[0] },
  { id: 'beard', skin: SKIN[1], hair: HAIR[0] },
  { id: 'glasses', skin: SKIN[0], hair: HAIR[1] },
  { id: 'bald', skin: SKIN[3], hair: HAIR[0] },
  { id: 'ponytail', skin: SKIN[2], hair: HAIR[1] },
  { id: 'cap', skin: SKIN[1], hair: HAIR[0] },
];

/** Every face id, flattened — used for validation. */
export const AVATAR_FACE_IDS: ReadonlySet<string> = new Set(AVATAR_FACE_LIST);

/** Background swatches. Each maps to an existing `--color-*` token pair. */
export const AVATAR_COLORS = [
  'lime',
  'info',
  'warn',
  'ok',
  'bad',
  'neutral',
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export interface AvatarChoice {
  face: AvatarFaceId;
  color: AvatarColor;
}

const isColor = (v: string): v is AvatarColor =>
  (AVATAR_COLORS as readonly string[]).includes(v);

const isFace = (v: string): v is AvatarFaceId => AVATAR_FACE_IDS.has(v);

/**
 * Parse the stored `"face:color"` string.
 *
 * Returns `null` when nothing is chosen or the value isn't one we can draw, so
 * the caller falls back to the partner's initial. Same defensive posture as
 * `itemIcon`: a hand-edited backup or a hostile import renders a letter rather
 * than breaking the sidebar.
 */
export function parseAvatar(raw: string | undefined): AvatarChoice | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const [face, color] = trimmed.split(':').map((p) => p.trim());
  if (!isFace(face)) return null;
  // An unrecognized colour is recoverable — the face is the part that matters.
  return { face, color: color && isColor(color) ? color : 'lime' };
}

export function serializeAvatar(choice: AvatarChoice): string {
  return `${choice.face}:${choice.color}`;
}
