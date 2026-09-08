import { describe, it, expect, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalShell } from '@presentation/components/ui/ModalShell';
import { useBackDismiss } from '@presentation/hooks/useBackDismiss';
import {
  backDismissDepth,
  resetBackDismiss,
  setCanonicalUrl,
} from '@presentation/lib/backDismiss';

/** Press the browser Back button and let the popstate settle. */
async function goBack() {
  await act(async () => {
    window.history.back();
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** Let a queued reconcile microtask run. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** An overlay that mirrors the real shells: mounted only while open. */
function Overlay({ onClose }: { onClose: () => void }) {
  useBackDismiss(true, onClose);
  return <div data-testid="overlay">overlay</div>;
}

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      {open && <Overlay onClose={() => setOpen(false)} />}
    </div>
  );
}

beforeEach(() => {
  resetBackDismiss();
});

describe('back-button dismissal', () => {
  it('parks a history entry while open and dismisses on Back', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const before = window.history.length;
    await user.click(screen.getByRole('button', { name: 'open' }));
    await settle();

    expect(screen.getByTestId('overlay')).toBeInTheDocument();
    expect(backDismissDepth()).toBe(1);
    expect(window.history.length).toBe(before + 1);

    await goBack();

    await waitFor(() =>
      expect(screen.queryByTestId('overlay')).not.toBeInTheDocument(),
    );
    expect(backDismissDepth()).toBe(0);
  });

  it('consumes its entry when closed by a button, so Back is not swallowed', async () => {
    const user = userEvent.setup();

    function Closable() {
      const [open, setOpen] = useState(true);
      return open ? (
        <ModalShell onClose={() => setOpen(false)} ariaLabel="dialog">
          <button type="button" onClick={() => setOpen(false)}>
            cancel
          </button>
        </ModalShell>
      ) : null;
    }

    render(<Closable />);
    await settle();
    expect(backDismissDepth()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'cancel' }));
    await settle();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // The parked entry is gone, so the next Back belongs to the browser again.
    await waitFor(() => expect(backDismissDepth()).toBe(0));
  });

  it('unwinds nested overlays one layer per Back', async () => {
    function Nested() {
      const [outer, setOuter] = useState(true);
      const [inner, setInner] = useState(true);
      return (
        <>
          {outer && (
            <div data-testid="outer">
              <Overlay onClose={() => setOuter(false)} />
            </div>
          )}
          {inner && (
            <div data-testid="inner">
              <Overlay onClose={() => setInner(false)} />
            </div>
          )}
        </>
      );
    }

    render(<Nested />);
    await settle();
    expect(backDismissDepth()).toBe(2);

    await goBack();

    // The most recently registered overlay goes first; the other survives.
    await waitFor(() =>
      expect(screen.queryByTestId('inner')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('outer')).toBeInTheDocument();

    await goBack();

    await waitFor(() =>
      expect(screen.queryByTestId('outer')).not.toBeInTheDocument(),
    );
    expect(backDismissDepth()).toBe(0);
  });

  it('nets one entry when an overlay closes and another opens in the same tick', async () => {
    const user = userEvent.setup();

    // The preview → edit handoff: close one, open the next, same click.
    function Handoff() {
      const [which, setWhich] = useState<'a' | 'b'>('a');
      return (
        <>
          <button type="button" onClick={() => setWhich('b')}>
            swap
          </button>
          {which === 'a' ? (
            <Overlay key="a" onClose={() => {}} />
          ) : (
            <Overlay key="b" onClose={() => {}} />
          )}
        </>
      );
    }

    render(<Handoff />);
    await settle();
    const parked = window.history.length;
    expect(backDismissDepth()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'swap' }));
    await settle();

    // Coalesced: no push, no pop — Back still unwinds exactly one layer.
    expect(backDismissDepth()).toBe(1);
    expect(window.history.length).toBe(parked);
  });

  it('keeps a URL set while an overlay is open after the entry is popped', async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'open' }));
    await settle();

    const url = new URL(window.location.href);
    url.searchParams.set('room', 'abc123');
    setCanonicalUrl(url.toString());
    expect(window.location.search).toContain('room=abc123');

    await goBack();

    await waitFor(() =>
      expect(screen.queryByTestId('overlay')).not.toBeInTheDocument(),
    );
    // The share link survives the throwaway entry being thrown away.
    expect(window.location.search).toContain('room=abc123');
  });
});
