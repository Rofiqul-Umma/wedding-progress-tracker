import { iconForCategory } from './status';

/** A named group of pickable icons, shown as one section of the picker. */
export interface IconGroup {
  /** i18n key for the group heading, e.g. 'icons.group.venue'. */
  labelKey: string;
  /** Material Symbols Rounded glyph names. */
  names: string[];
}

/**
 * The icons offered by the picker. Deliberately a curated set rather than the
 * whole Material Symbols catalog: an unknown name renders as literal text, so
 * only names verified to exist in the Rounded font belong here.
 */
export const ICON_GROUPS: IconGroup[] = [
  {
    labelKey: 'icons.group.venue',
    names: [
      'location_on',
      'home',
      'church',
      'celebration',
      'local_florist',
      'chair',
      'lightbulb',
      'table_restaurant',
      'deck',
      'park',
    ],
  },
  {
    labelKey: 'icons.group.food',
    names: [
      'restaurant',
      'lunch_dining',
      'cake',
      'local_bar',
      'local_cafe',
      'icecream',
      'bakery_dining',
      'set_meal',
      'dinner_dining',
      'liquor',
    ],
  },
  {
    labelKey: 'icons.group.attire',
    names: [
      'checkroom',
      'spa',
      'diamond',
      'content_cut',
      'watch',
      'face',
      'brush',
      'dry_cleaning',
      'iron',
      'shopping_basket',
    ],
  },
  {
    labelKey: 'icons.group.gifts',
    names: [
      'card_giftcard',
      'redeem',
      'favorite',
      'shopping_bag',
      'shopping_cart',
      'volunteer_activism',
      'local_mall',
      'toys',
      'auto_awesome',
      'star',
    ],
  },
  {
    labelKey: 'icons.group.planning',
    names: [
      'event_note',
      'mail',
      'auto_stories',
      'photo_camera',
      'music_note',
      'work',
      'receipt_long',
      'description',
      'checklist',
      'groups',
      'call',
      'movie',
    ],
  },
  {
    labelKey: 'icons.group.other',
    names: [
      'directions_car',
      'flight',
      'hotel',
      'palette',
      'umbrella',
      'pets',
      'stroller',
      'medical_services',
      'cleaning_services',
      'flag',
    ],
  },
];

/** Every pickable name, flattened — used for validation and search. */
export const ICON_NAMES: ReadonlySet<string> = new Set(
  ICON_GROUPS.flatMap((g) => g.names),
);

/**
 * The icon an item should draw: its own choice when set and recognized, else
 * the category default. Validating against `ICON_NAMES` means an imported or
 * hand-edited backup carrying a bogus name still renders a real glyph rather
 * than the raw string.
 */
export function itemIcon(icon: string | undefined, category?: string): string {
  const chosen = icon?.trim();
  return chosen && ICON_NAMES.has(chosen) ? chosen : iconForCategory(category);
}
