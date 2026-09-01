import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { renderWithProviders } from '../test/renderWithProviders';
import { usePlan } from '@presentation/state/PlanStore';
import { useFormat } from '@presentation/hooks/useFormat';

/** Minimal consumer exercising live language + currency switching. */
function Harness() {
  const { setState } = usePlan();
  const { t } = useTranslation();
  const { money } = useFormat();
  return (
    <div>
      <p data-testid="label">{t('nav.budget')}</p>
      <p data-testid="money">{money(1000)}</p>
      <button
        type="button"
        onClick={() =>
          setState((s) => ({ ...s, settings: { ...s.settings, lang: 'id' } }))
        }
      >
        to-id
      </button>
      <button
        type="button"
        onClick={() =>
          setState((s) => ({
            ...s,
            settings: { ...s.settings, currency: 'IDR', lang: 'id' },
          }))
        }
      >
        to-idr
      </button>
    </div>
  );
}

describe('language and currency switching', () => {
  it('flips visible labels from English to Indonesian', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await waitFor(() =>
      expect(screen.getByTestId('label')).toHaveTextContent('Budget'),
    );

    await user.click(screen.getByRole('button', { name: 'to-id' }));

    await waitFor(() =>
      expect(screen.getByTestId('label')).toHaveTextContent('Anggaran'),
    );
  });

  it('renders amounts as Rupiah when currency is set to IDR', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await waitFor(() =>
      expect(screen.getByTestId('money')).toHaveTextContent('$'),
    );

    await user.click(screen.getByRole('button', { name: 'to-idr' }));

    await waitFor(() =>
      expect(screen.getByTestId('money')).toHaveTextContent('Rp'),
    );
  });
});
