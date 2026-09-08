/**
 * A base category offered by the pickers.
 *
 * `value` is what gets written into the plan and is never translated: it is the
 * grouping key for `categoryRollup`, the hash input for `categoryColor`, the
 * lookup key for `CAT_ICON` and a search token, all at once. Renaming one would
 * re-bucket an existing budget report and orphan icons, so these strings are a
 * contract with data already on users' devices.
 */
export interface BaseCategory {
  /** The string stored on the entity. Never translated, never renamed. */
  value: string;
  /** i18n key under `categories.*` used to render it. */
  key: string;
}

/** Which collection a category list is offered for. */
export type CategoryKind = 'vendor' | 'budget' | 'task' | 'shopping' | 'seserahan';

const c = (value: string, key: string): BaseCategory => ({ value, key });

/**
 * The categories each collection suggests, kept deliberately disjoint: vendors,
 * tasks, seserahan and shopping share no category in practice, so offering one
 * combined list would bury `Toiletries` under `Wedding Band`.
 *
 * Users are never limited to these — the picker has an "add new" escape hatch,
 * and any label typed there is stored and displayed verbatim.
 */
export const BASE_CATEGORIES: Record<CategoryKind, readonly BaseCategory[]> = {
  vendor: [
    c('Catering', 'catering'),
    c('Venue', 'venue'),
    c('Dekorasi', 'dekorasi'),
    c('Dekorasi Lamaran', 'dekorasiLamaran'),
    c('Perlengkapan & Dekorasi Acara', 'perlengkapanDekorasiAcara'),
    c('Fotografer & Videografer', 'fotograferVideografer'),
    c('Fotografer Lamaran', 'fotograferLamaran'),
    c('Preweeding', 'preweeding'),
    c('MUA Lamaran', 'muaLamaran'),
    c('Henna & Nail Art', 'hennaNailArt'),
    c('Perlengkapan Pengantin', 'perlengkapanPengantin'),
    c('Buket Lamaran', 'buketLamaran'),
    c('Wedding Band', 'weddingBand'),
    c('MC', 'mc'),
    c('WCC', 'wcc'),
    c('Hiburan', 'hiburan'),
    c('Undangan', 'undangan'),
    c('Souvenir', 'souvenir'),
    c('Transportasi', 'transportasi'),
  ],
  budget: [
    c('Venue', 'venue'),
    c('Catering', 'catering'),
    c('Dekorasi', 'dekorasi'),
    c('Busana', 'busana'),
    c('Dokumentasi', 'dokumentasi'),
    c('Hiburan', 'hiburan'),
    c('Undangan', 'undangan'),
    c('Souvenir', 'souvenir'),
    c('Transportasi', 'transportasi'),
  ],
  task: [
    c('Perlengkapan', 'perlengkapan'),
    c('Dokumen', 'dokumen'),
    c('Dokumentasi', 'dokumentasi'),
    c('Administrasi', 'administrasi'),
    c('Keuangan', 'keuangan'),
    c('Akomodasi', 'akomodasi'),
  ],
  shopping: [
    c('Seragam', 'seragam'),
    c('Dekorasi', 'dekorasi'),
    c('Souvenir', 'souvenir'),
    c('Undangan', 'undangan'),
    c('Perlengkapan', 'perlengkapan'),
  ],
  seserahan: [
    c('Makeup', 'makeup'),
    c('Skincare', 'skincare'),
    c('Body Care', 'bodyCare'),
    c('Toiletries', 'toiletries'),
    c('Busana', 'busana'),
    c('Pakaian Dalam', 'pakaianDalam'),
    c('Aksesoris', 'aksesoris'),
    c('Perhiasan', 'perhiasan'),
    c('Alas Kaki', 'alasKaki'),
    c('Tas', 'tas'),
    c('Alat Ibadah', 'alatIbadah'),
    c('Makanan', 'makanan'),
  ],
};

/** Every base value → i18n key, flattened across all kinds. */
const KEY_BY_VALUE: ReadonlyMap<string, string> = new Map(
  Object.values(BASE_CATEGORIES).flatMap((list) =>
    list.map((cat) => [cat.value, cat.key] as const),
  ),
);

/** Every base value, flattened — used for tests and membership checks. */
export const BASE_CATEGORY_VALUES: ReadonlySet<string> = new Set(KEY_BY_VALUE.keys());

/**
 * The label to show for a stored category.
 *
 * Unknown strings — every category a user added themselves — pass through
 * unchanged, which is right: they are already in the user's own words. `t` is
 * passed in so this stays free of any i18n dependency.
 */
export function categoryLabel(
  raw: string | undefined,
  t: (key: string) => string,
): string {
  if (!raw) return '';
  const key = KEY_BY_VALUE.get(raw);
  return key ? t(`categories.${key}`) : raw;
}

/**
 * The report's `text` cells resolve a dotted key through i18n and pass anything
 * else through literally, so emitting the key for a base category localizes it
 * in both the on-screen table and the CSV, exactly as `status.vendor.*` does.
 */
export function categoryCell(raw: string | undefined): string {
  if (!raw) return '';
  const key = KEY_BY_VALUE.get(raw);
  return key ? `categories.${key}` : raw;
}
