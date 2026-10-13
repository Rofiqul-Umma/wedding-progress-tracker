import { describe, it, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from '@presentation/app/providers';
import { seed } from '@infrastructure/persistence/seed';
import { STORE_KEY } from '@infrastructure/persistence/storeKey';
import { renderWithProviders } from '../../test/renderWithProviders';
import { GuestsPage } from './GuestsPage';

describe('GuestsPage (integration)', () => {
  it('renders guest cards and stat strip from seed data', () => {
    renderWithProviders(<GuestsPage />);

    expect(screen.getByText('Sofia & David Rossi')).toBeInTheDocument();
    expect(screen.getByText('Liam & Chloe Bennett')).toBeInTheDocument();
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('Aunt Beatrice')).toBeInTheDocument();
    expect(screen.getByText('Daniel Wu')).toBeInTheDocument();
  });

  it('renders empty state when there are no guests and loads sample guests on click', async () => {
    const user = userEvent.setup();
    const planWithoutGuests = { ...seed(), guests: [] };
    localStorage.setItem(STORE_KEY, JSON.stringify(planWithoutGuests));
    render(
      <Providers>
        <GuestsPage />
      </Providers>,
    );

    expect(screen.getByText('No guests yet')).toBeInTheDocument();
    const loadBtn = screen.getByRole('button', { name: 'Load sample guests' });
    expect(loadBtn).toBeInTheDocument();

    await user.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText('Sofia & David Rossi')).toBeInTheDocument();
    });
  });

  it('cycles a guest RSVP status on chip click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuestsPage />);

    // Marcus Vance starts as 'pending'
    const marcusChip = screen.getByRole('button', {
      name: /Marcus Vance RSVP: Pending/i,
    });
    expect(marcusChip).toBeInTheDocument();

    await user.click(marcusChip);

    // pending -> attending
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Marcus Vance RSVP: Attending/i,
        }),
      ).toBeInTheDocument();
    });
  });

  it('deleting a guest shows an Undo toast that restores them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuestsPage />);

    expect(screen.getByText('Aunt Beatrice')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Delete Aunt Beatrice' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('Aunt Beatrice')).not.toBeInTheDocument(),
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('removed');
    await user.click(within(toast).getByRole('button', { name: 'Undo' }));

    await waitFor(() =>
      expect(screen.getByText('Aunt Beatrice')).toBeInTheDocument(),
    );
  });

  it('filters guests using the segmented filter tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuestsPage />);

    // Click 'Declined' filter tab (which shows label + count badge "Declined 2")
    const declinedTab = screen.getByRole('button', { name: /^Declined\s+2$/i });
    await user.click(declinedTab);

    // Daniel Wu and Elena Rostova should be visible
    expect(screen.getByText('Daniel Wu')).toBeInTheDocument();
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.queryByText('Sofia & David Rossi')).not.toBeInTheDocument();
    expect(screen.queryByText('Marcus Vance')).not.toBeInTheDocument();
  });
});

