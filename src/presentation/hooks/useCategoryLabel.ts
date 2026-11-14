import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BASE_CATEGORIES,
  categoryLabel,
  type CategoryKind,
} from '@domain/value-objects/categories';
import type { SelectOption } from '@presentation/components/ui/Select';

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

/**
 * Build localized category filter dropdown options for a collection.
 * Includes all base categories for `kind` plus any custom categories used in
 * `rawCategories`, with item counts in parentheses. Categories that have at
 * least one item are listed first, followed by unused base categories, each
 * sorted alphabetically by its localized display label.
 */
export function useCategoryFilterOptions(
  kind: CategoryKind,
  rawCategories: readonly (string | undefined)[],
): SelectOption[] {
  const { t } = useTranslation();
  const catLabel = useCategoryLabel();

  return useMemo(() => {
    const counts = new Map<string, number>();
    const values = new Set<string>(BASE_CATEGORIES[kind].map((c) => c.value));

    for (const raw of rawCategories) {
      const trimmed = raw?.trim() || '';
      if (trimmed) {
        values.add(trimmed);
        counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
      }
    }

    const sorted = [...values]
      .map((cat) => {
        const count = counts.get(cat) ?? 0;
        const name = catLabel(cat);
        return {
          value: cat,
          label: `${name} (${count})`,
          name,
          count,
        };
      })
      .sort((a, b) => {
        if ((a.count > 0) !== (b.count > 0)) return a.count > 0 ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return [
      { value: 'all', label: `${t('common.catAll')} (${rawCategories.length})` },
      ...sorted.map(({ value, label }) => ({ value, label })),
    ];
  }, [kind, rawCategories, catLabel, t]);
}
