import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0% and animates to the target value', () => {
    render(<ProgressBar value={75} color="green" />);

    const bar = screen.getByRole('progressbar').querySelector('span')!;
    // Initially mounted at 0%
    expect(bar.style.width).toBe('0%');

    // Fast-forward the mount animation timer
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Filled to target width
    expect(bar.style.width).toBe('75%');
  });

  it('clamps values below 0 and above 100', () => {
    const { rerender } = render(<ProgressBar value={-20} color="red" />);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const bar = screen.getByRole('progressbar').querySelector('span')!;
    expect(bar.style.width).toBe('0%');

    rerender(<ProgressBar value={140} color="red" />);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(bar.style.width).toBe('100%');
  });

  it('respects animateOnMount={false}', () => {
    render(<ProgressBar value={60} color="blue" animateOnMount={false} />);
    const bar = screen.getByRole('progressbar').querySelector('span')!;
    expect(bar.style.width).toBe('60%');
  });
});
