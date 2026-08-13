/**
 * Module-level external store for online/offline status, meant to be read
 * via React's useSyncExternalStore (see components/OfflineIndicator.tsx).
 *
 * Not implemented as component state + useEffect: this logic is genuinely
 * global (window event listeners, a service-worker message listener, a
 * self-clearing timer) rather than something scoped to one component
 * instance, and setting state synchronously inside an effect body trips
 * React's react-hooks/set-state-in-effect lint rule for exactly the reason
 * it exists — it risks cascading renders. useSyncExternalStore is the
 * primitive React ships specifically for subscribing to external,
 * mutable, non-React state like this.
 */

// How long an "offline" signal from the service worker (see SW_OFFLINE in
// public/service-worker.js) is trusted before double-checking against
// navigator.onLine and self-clearing if connectivity has actually returned.
const OFFLINE_SIGNAL_TIMEOUT_MS = 3000;

type Listener = () => void;

let isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;
const listeners = new Set<Listener>();
let clearTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function setOffline(value: boolean) {
  if (isOffline === value) return;
  isOffline = value;
  listeners.forEach((listener) => listener());
}

function markOffline() {
  setOffline(true);
  if (clearTimer) clearTimeout(clearTimer);
  // Self-expiring: covers the case where the page loaded while already
  // offline (navigator.onLine can misreport "online" for a navigation the
  // service worker ends up serving from cache — see bug.md), so the
  // browser's "online" transition event never fires to clear this later.
  clearTimer = setTimeout(() => {
    if (navigator.onLine) setOffline(false);
  }, OFFLINE_SIGNAL_TIMEOUT_MS);
}

function markOnline() {
  if (clearTimer) clearTimeout(clearTimer);
  setOffline(false);
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("offline", markOffline);
  window.addEventListener("online", markOnline);

  // navigator.onLine alone isn't reliable right after a service-worker
  // served reload, so also trust the SW's own observed fetch failures —
  // ground truth rather than a browser heuristic.
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "SW_OFFLINE") markOffline();
  });
}

export function subscribeOfflineStatus(callback: Listener): () => void {
  ensureInitialized();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getOfflineStatusSnapshot(): boolean {
  return isOffline;
}

/** Server is never meaningfully "offline" — avoids an SSR/hydration mismatch. */
export function getOfflineStatusServerSnapshot(): boolean {
  return false;
}
