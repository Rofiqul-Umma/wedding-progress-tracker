import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Providers } from '@presentation/app/providers';
import { seed } from '@infrastructure/persistence/seed';
import { STORE_KEY } from '@infrastructure/persistence/storeKey';

/**
 * Render a component tree inside the full provider stack (plan, nav, ui, toast,
 * i18n). The app itself starts blank on first run, but integration tests need
 * realistic data, so we pre-seed localStorage with the sample plan before
 * mounting (cleared automatically by the afterEach in vitest.setup).
 */
export function renderWithProviders(ui: ReactElement) {
  localStorage.setItem(STORE_KEY, JSON.stringify(seed()));
  return render(<Providers>{ui}</Providers>);
}
