import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { TasksPage } from './TasksPage';

/** Read the numeric value shown under a StatStrip label. */
function stat(label: string): number {
  const cell = screen.getByText(label).parentElement!;
  const value = cell.querySelector('span:last-child')!.textContent ?? '';
  return Number(value);
}

describe('TasksPage (integration)', () => {
  it('toggling a task updates the open count and shows a toast', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TasksPage />);

    const before = stat('Open');
    await user.click(
      screen.getByRole('button', {
        name: 'Mark task complete: Book catering tasting',
      }),
    );

    await waitFor(() => expect(stat('Open')).toBe(before - 1));
    expect(screen.getByRole('status')).toHaveTextContent('Task complete');
  });

  it('deleting a task shows an Undo toast that restores it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TasksPage />);

    expect(screen.getByText('Order wedding bands')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Delete Order wedding bands' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('Order wedding bands')).not.toBeInTheDocument(),
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('removed');
    await user.click(within(toast).getByRole('button', { name: 'Undo' }));

    await waitFor(() =>
      expect(screen.getByText('Order wedding bands')).toBeInTheDocument(),
    );
  });
});
