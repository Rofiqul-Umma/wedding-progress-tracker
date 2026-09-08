import { useEffect, useRef } from 'react';
import { register, unregister } from '@presentation/lib/backDismiss';

/**
 * While `open`, make the browser/system Back button call `onDismiss` instead of
 * leaving the app. Overlays keep their existing Esc/backdrop handling — this
 * simply adds Back as one more exit path through the same callback.
 */
export function useBackDismiss(open: boolean, onDismiss: () => void): void {
  // Held in a ref so an inline arrow doesn't re-register on every render.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    const id = register(() => dismissRef.current());
    return () => unregister(id);
  }, [open]);
}
