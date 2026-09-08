import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import { useTheme } from '@presentation/state/ThemeStore';
import { THEME_KEY } from '@infrastructure/theme/themeStorage';
import { STORE_KEY } from '@infrastructure/persistence/storeKey';

/** Minimal consumer exercising the appearance switch. */
function Harness() {
  const { mode, resolved, setMode } = useTheme();
  return (
    <div>
      <p data-testid="mode">{mode}</p>
      <p data-testid="resolved">{resolved}</p>
      <button type="button" onClick={() => setMode('dark')}>
        to-dark
      </button>
      <button type="button" onClick={() => setMode('light')}>
        to-light
      </button>
    </div>
  );
}

describe('theme switching', () => {
  it('starts on light and paints data-theme onto the document', async () => {
    renderWithProviders(<Harness />);

    // No stored choice and the jsdom matchMedia stub reports no dark
    // preference, so `system` resolves to light.
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('system'),
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('flips the document to dark and remembers the choice per device', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('light'),
    );

    await user.click(screen.getByRole('button', { name: 'to-dark' }));

    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('dark'),
    );
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'to-light' }));

    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('light'),
    );
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('never writes the theme into the stored plan', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('light'),
    );
    const before = localStorage.getItem(STORE_KEY);

    await user.click(screen.getByRole('button', { name: 'to-dark' }));
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('dark'),
    );

    expect(localStorage.getItem(STORE_KEY)).toBe(before);
    expect(before).not.toContain('theme');
  });
});
