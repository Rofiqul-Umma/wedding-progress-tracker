import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '@domain/value-objects/categories';

/**
 * Translate a stored category for display.
 *
 * Only the label changes — the stored value stays canonical, so grouping,
 * sorting keys, badge colors and icon lookups behave identically in either
 * language, and a category the user invented shows exactly as they typed it.
 */
export function useCategoryLabel() {
  const { t } = useTranslation();
  return useCallback((raw?: string) => categoryLabel(raw, t), [t]);
}
