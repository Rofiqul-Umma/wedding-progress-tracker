/**
 * Cartoon profile pictures for the couple.
 *
 * A small curated set of illustrated portraits, shipped as build assets and
 * referenced by id (see `CartoonAvatar`). The planner is offline-first and the
 * whole plan syncs as JSON, so what is *stored* has to cost a handful of bytes —
 * hence an id like `"bride_hijab"` rather than an uploaded data URL.
 *
 * The portraits carry their own background and skin tone, baked into the
 * artwork, so unlike the earlier code-drawn faces there is nothing to configure
 * beyond the choice itself.
 */

/**
 * The portrait ids, as a union rather than plain strings: the artwork map in
 * `CartoonAvatar` is keyed by this type, so adding an id here without supplying
 * an image is a compile error rather than a broken tile at runtime.
 */
export const AVATAR_FACE_LIST = [
  'bride_veil',
  'bride_hijab',
  'bride_long',
  'bride_sanggul',
  'groom_tux',
  'groom_koko',
  'groom_suit',
  'groom_beige',
] as const;

export type AvatarFaceId = (typeof AVATAR_FACE_LIST)[number];

/** Every portrait id, flattened — used for validation. */
export const AVATAR_FACE_IDS: ReadonlySet<string> = new Set(AVATAR_FACE_LIST);

/**
 * Ids written by the previous, code-drawn avatar set, mapped to the closest
 * portrait.
 *
 * Without this every plan saved before the redesign would silently fall back to
 * a bare initial. The mapping is by intent — a stored `hijab` becomes the hijab
 * portrait, a stored `cap` (peci) becomes the koko-and-peci one — so the user's
 * original choice survives rather than being thrown away.
 */
const LEGACY_FACES: Readonly<Record<string, AvatarFaceId>> = {
  short: 'groom_suit',
  bun: 'bride_sanggul',
  long: 'bride_long',
  sanggul: 'bride_sanggul',
  pashmina: 'bride_hijab',
  veil: 'bride_veil',
  hijab: 'bride_hijab',
  beard: 'groom_beige',
  glasses: 'groom_suit',
  bald: 'groom_tux',
  ponytail: 'bride_long',
  cap: 'groom_koko',
  // Retired one redesign earlier, for being the wrong culture entirely.
  curly: 'bride_long',
  braids: 'bride_long',
};

export interface AvatarChoice {
  face: AvatarFaceId;
}

const isFace = (v: string): v is AvatarFaceId => AVATAR_FACE_IDS.has(v);

/**
 * Parse the stored avatar value.
 *
 * Earlier versions stored `"face:color"` and then `"face:color:skin"`, because
 * the background and skin tone used to be separate choices. Both are part of
 * the artwork now, so any trailing segments are read and discarded — old plans
 * keep working without a migration.
 *
 * Returns `null` when nothing is chosen or the id resolves to no portrait, so
 * the caller falls back to the partner's initial. Same defensive posture as
 * `itemIcon`: a hand-edited backup or a hostile import renders a letter rather
 * than breaking the sidebar.
 */
export function parseAvatar(raw: string | undefined): AvatarChoice | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const [id] = trimmed.split(':').map((p) => p.trim());
  if (!id) return null;
  if (isFace(id)) return { face: id };
  const legacy = LEGACY_FACES[id];
  return legacy ? { face: legacy } : null;
}

export function serializeAvatar(choice: AvatarChoice): string {
  return choice.face;
}
