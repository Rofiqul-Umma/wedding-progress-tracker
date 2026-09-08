/** Vendor booking status. */
export type VendorStatus = 'inquiry' | 'booked' | 'deposit' | 'paid';

export const VENDOR_STATUSES: readonly VendorStatus[] = [
  'inquiry',
  'booked',
  'deposit',
  'paid',
] as const;

/** Seserahan preparation status. */
export type SeserahanStatus = 'pending' | 'onProgress' | 'finished';

/** Ordered lifecycle for cycling seserahan status on click. */
export const SES_ORDER: readonly SeserahanStatus[] = [
  'pending',
  'onProgress',
  'finished',
] as const;

/** Chip visual variant per seserahan status (keys map to i18n + styling). */
export const SES_CHIP_VARIANT: Record<SeserahanStatus, string> = {
  pending: 'gray',
  onProgress: 'warn',
  finished: 'lime',
};

/** Advance a seserahan status to the next stage in the cycle. */
export function nextSeserahanStatus(s: SeserahanStatus): SeserahanStatus {
  const i = SES_ORDER.indexOf(s);
  return SES_ORDER[(i + 1) % SES_ORDER.length];
}

/** Shopping progress status. */
export type ShoppingStatus = 'toBuy' | 'ordered' | 'purchased';

/** Ordered lifecycle for cycling shopping status on click. */
export const SHOP_ORDER: readonly ShoppingStatus[] = [
  'toBuy',
  'ordered',
  'purchased',
] as const;

/** Chip visual variant per shopping status (keys map to i18n + styling). */
export const SHOP_CHIP_VARIANT: Record<ShoppingStatus, string> = {
  toBuy: 'gray',
  ordered: 'warn',
  purchased: 'lime',
};

/** Advance a shopping status to the next stage in the cycle. */
export function nextShoppingStatus(s: ShoppingStatus): ShoppingStatus {
  const i = SHOP_ORDER.indexOf(s);
  return SHOP_ORDER[(i + 1) % SHOP_ORDER.length];
}

/** Icon id per category (EN + ID category labels). */
export const CAT_ICON: Record<string, string> = {
  Catering: 'restaurant',
  Attire: 'checkroom',
  Venue: 'location_on',
  Stationery: 'mail',
  Planning: 'event_note',
  Music: 'music_note',
  Photography: 'photo_camera',
  Florals: 'local_florist',
  Property: 'home',
  Business: 'work',
  Ibadah: 'auto_stories',
  Kecantikan: 'spa',
  Busana: 'checkroom',
  Makanan: 'lunch_dining',
  Aksesoris: 'diamond',
  Decor: 'celebration',
  Dekorasi: 'celebration',
  Favors: 'card_giftcard',
  Souvenir: 'card_giftcard',
  Jewelry: 'diamond',
  Perhiasan: 'diamond',
  // Base categories offered by the pickers (see `categories.ts`). Keyed by the
  // stored value, so an item keeps its icon whichever language is displayed.
  // (`Venue`, `Catering`, `Dekorasi`, `Busana`, `Aksesoris`, `Souvenir`,
  // `Perhiasan` and `Makanan` are already covered above.)
  Transportasi: 'directions_car',
  Undangan: 'mail',
  Hiburan: 'music_note',
  'Wedding Band': 'music_note',
  MC: 'call',
  WCC: 'groups',
  'Dekorasi Lamaran': 'celebration',
  'Perlengkapan & Dekorasi Acara': 'celebration',
  'Fotografer & Videografer': 'photo_camera',
  'Fotografer Lamaran': 'photo_camera',
  Preweeding: 'photo_camera',
  Dokumentasi: 'photo_camera',
  'MUA Lamaran': 'face',
  'Henna & Nail Art': 'brush',
  'Perlengkapan Pengantin': 'checkroom',
  'Buket Lamaran': 'local_florist',
  Perlengkapan: 'shopping_basket',
  Dokumen: 'description',
  Administrasi: 'description',
  Keuangan: 'receipt_long',
  Akomodasi: 'hotel',
  Seragam: 'checkroom',
  Makeup: 'face',
  Skincare: 'spa',
  'Body Care': 'spa',
  Toiletries: 'shopping_basket',
  'Pakaian Dalam': 'checkroom',
  'Alas Kaki': 'shopping_bag',
  Tas: 'local_mall',
  'Alat Ibadah': 'auto_stories',
};

/** Resolve an icon for a category, falling back to a generic flag. */
export function iconForCategory(category?: string): string {
  return (category && CAT_ICON[category]) || 'flag';
}

/**
 * Palette used to deterministically color category badges.
 *
 * CSS variables rather than literal hexes so the swatches can lift for
 * contrast in dark mode — the mid-tone greens and purples that read well on
 * white go muddy on a dark panel. Defined in `index.css`'s `:root`; consumers
 * drop them straight into an inline `style` (see `ui/Avatar`, `ui/ProgressBar`).
 */
export const CAT_COLORS = [
  'var(--color-cat-1)',
  'var(--color-cat-2)',
  'var(--color-cat-3)',
  'var(--color-cat-4)',
  'var(--color-cat-5)',
  'var(--color-cat-6)',
  'var(--color-cat-7)',
  'var(--color-cat-8)',
] as const;

/** Stable hash of a label to a palette color. */
export function categoryColor(name?: string): string {
  let h = 0;
  for (const c of name || '') {
    h = (h * 31 + c.charCodeAt(0)) % CAT_COLORS.length;
  }
  return CAT_COLORS[h];
}
