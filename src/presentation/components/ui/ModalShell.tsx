import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@presentation/lib/cn';

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
  labelledBy?: string;
  ariaLabel?: string;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Backdrop + centered dialog with a focus trap, Esc/backdrop close, and the
 * rest of the app marked `inert` while open (mirrors the legacy modal).
 */
export function ModalShell({
  onClose,
  children,
  size = 'md',
  labelledBy,
  ariaLabel,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const bg = ['app-shell']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    bg.forEach((el) => el.setAttribute('inert', ''));

    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    const focusTimer = window.setTimeout(() => first?.focus(), 40);

    return () => {
      window.clearTimeout(focusTimer);
      bg.forEach((el) => el.removeAttribute('inert'));
      previouslyFocused?.focus?.();
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && active === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-ink/40 backdrop-blur-[3px] pt-[calc(1.25rem+var(--sa-top))] pb-[calc(1.25rem+var(--sa-bottom))] pl-[calc(1.25rem+var(--sa-left))] pr-[calc(1.25rem+var(--sa-right))]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className={cn(
          // `max-h-full` resolves against the inset-padded backdrop, so the
          // dialog never slides under a notch or home indicator the way a
          // fixed `90vh` would.
          'max-h-full w-full overflow-auto rounded-[20px] bg-app shadow-lg',
          size === 'lg' ? 'max-w-[560px]' : 'max-w-[520px]',
        )}
      >
        {children}
      </div>
    </div>
  );
}
