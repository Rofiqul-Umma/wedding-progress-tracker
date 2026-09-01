/** Vendor booking status. */
export type VendorStatus = 'inquiry' | 'booked' | 'paid';

export const VENDOR_STATUSES: readonly VendorStatus[] = [
  'inquiry',
  'booked',
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

/** Material Symbols icon name per category (EN + ID category labels). */
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
};

/** Resolve an icon for a category, falling back to a generic flag. */
export function iconForCategory(category?: string): string {
  return (category && CAT_ICON[category]) || 'flag';
}

/** Palette used to deterministically color category badges. */
export const CAT_COLORS = [
  '#2F9E44',
  '#3D74DA',
  '#C98A2C',
  '#D9564F',
  '#6B5B95',
  '#12876A',
  '#B4657A',
  '#4E7CA1',
] as const;

/** Stable hash of a label to a palette color. */
export function categoryColor(name?: string): string {
  let h = 0;
  for (const c of name || '') {
    h = (h * 31 + c.charCodeAt(0)) % CAT_COLORS.length;
  }
  return CAT_COLORS[h];
}
