import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { Topbar } from './Topbar';

describe('Topbar', () => {
  it('renders topbar title and search inputs', () => {
    renderWithProviders(<Topbar />);

    // Dashboard title is shown by default
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument();
  });

  it('toggles mobile search bar on clicking mobile search button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);

    // Mobile search button has accessible label 'Search'
    const searchButtons = screen.getAllByRole('button', { name: 'Search' });
    const mobileSearchBtn = searchButtons[0];
    expect(mobileSearchBtn).toBeInTheDocument();

    await user.click(mobileSearchBtn);

    // Cancel button should appear in the mobile search header
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    expect(cancelBtn).toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', { name: /search/i });
    await user.type(searchInput, 'Venue');
    expect(searchInput).toHaveValue('Venue');

    // Click cancel to close
    await user.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });
});
