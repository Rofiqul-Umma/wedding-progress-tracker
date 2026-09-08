/**
 * Makes the browser/system Back button dismiss the topmost open overlay instead
 * of unloading the app.
 *
 * While any overlay is open we park one throwaway history entry per overlay, so
 * a Back press pops that entry and we translate it into a dismiss. With nothing
 * open we own no entries, so Back leaves the app exactly as it did before.
 *
 * The stack lives at module scope rather than in React state: the single
 * `popstate` listener and every mounted overlay have to agree on one ordering,
 * and that ordering has to survive React re-renders untouched.
 */

interface Entry {
  id: number;
  dismiss: () => void;
}

let entries: Entry[] = [];
/** History entries we have pushed and not yet consumed. */
let pushedDepth = 0;
let nextId = 1;
let listening = false;
let reconcileQueued = false;
/** Set while we are the ones calling `history.go` — that popstate isn't a user Back. */
let selfPop = false;
/** The URL the app considers real, independent of our throwaway entries. */
let canonicalUrl: string | null = null;

function browser(): boolean {
  return typeof window !== 'undefined' && typeof window.history !== 'undefined';
}

/**
 * Re-apply the app's real URL onto whichever entry we just landed on.
 *
 * Our entries are pushed without a URL, so they inherit whatever was current at
 * push time. Anything that changes the URL afterwards (the `?room=` share link)
 * would otherwise be stranded on an entry that Back throws away.
 */
function restoreUrl(): void {
  if (!canonicalUrl || window.location.href === canonicalUrl) return;
  window.history.replaceState(window.history.state, '', canonicalUrl);
}

function onPopState(): void {
  if (selfPop) {
    // Our own `go(-n)` landing. The entries are already gone from the stack.
    selfPop = false;
    restoreUrl();
    return;
  }
  if (!entries.length) return; // Nothing open — this Back is the user leaving.

  pushedDepth = Math.max(0, pushedDepth - 1);
  // Pop before dismissing: `dismiss()` only schedules a React update, so the
  // component's own cleanup (and its `unregister`) arrives later. Removing it
  // here keeps any reconcile that runs in the gap working from the truth.
  entries.pop()?.dismiss();
  restoreUrl();
}

function listen(): void {
  if (listening || !browser()) return;
  listening = true;
  canonicalUrl ??= window.location.href;
  window.addEventListener('popstate', onPopState);
}

/**
 * Bring the number of parked history entries back in line with the number of
 * open overlays.
 *
 * Deferred to a microtask, which is what makes the whole thing safe under:
 *  - StrictMode's mount → cleanup → mount double-invoke (the pair cancels out);
 *  - a close-then-open handoff in one tick, like the preview's Edit button
 *    (net zero churn, so Back from the edit form returns to the list rather
 *    than re-opening the preview).
 */
function scheduleReconcile(): void {
  if (reconcileQueued || !browser()) return;
  reconcileQueued = true;
  queueMicrotask(() => {
    reconcileQueued = false;
    const want = entries.length;
    if (want > pushedDepth) {
      for (let i = pushedDepth; i < want; i++) window.history.pushState(null, '');
      pushedDepth = want;
    } else if (want < pushedDepth) {
      const drop = pushedDepth - want;
      pushedDepth = want;
      selfPop = true;
      window.history.go(-drop);
    }
  });
}

/** Park a history entry and dismiss this overlay when Back consumes it. */
export function register(dismiss: () => void): number {
  listen();
  const id = nextId++;
  entries.push({ id, dismiss });
  scheduleReconcile();
  return id;
}

/** Release an overlay's entry. Idempotent — Back already removed it. */
export function unregister(id: number): void {
  const before = entries.length;
  entries = entries.filter((e) => e.id !== id);
  if (entries.length !== before) scheduleReconcile();
}

/**
 * Record a URL change as the app's real URL.
 *
 * Callers that would otherwise use `history.replaceState` go through here, so
 * the value survives our throwaway entries being popped.
 */
export function setCanonicalUrl(url: string): void {
  canonicalUrl = new URL(url, window.location.href).href;
  window.history.replaceState(window.history.state, '', canonicalUrl);
}

/** Test seam: drop all state so each case starts from a clean stack. */
export function resetBackDismiss(): void {
  entries = [];
  pushedDepth = 0;
  reconcileQueued = false;
  selfPop = false;
  canonicalUrl = null;
  if (listening && browser()) {
    window.removeEventListener('popstate', onPopState);
    listening = false;
  }
}

/** Test seam: how many entries we currently believe are parked. */
export function backDismissDepth(): number {
  return pushedDepth;
}
