/**
 * Registers /public/service-worker.js and reports when an updated worker is
 * installed and waiting to take over, so the UI can prompt a refresh.
 */
export function registerServiceWorker(onUpdateAvailable?: () => void): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Registered directly, not gated behind window's "load" event: this
  // function only ever runs from inside a React useEffect (see
  // UpdateBanner.tsx), which itself only fires post-mount — by then "load"
  // has near-certainly already fired once, so an addEventListener("load", …)
  // callback attached this late would simply never run. (Found by testing:
  // registration silently never happened, caches stayed empty.)
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      // A worker was already waiting when we registered (e.g. this tab
      // was open across a deploy) — surface the update immediately.
      if (registration.waiting && navigator.serviceWorker.controller) {
        onUpdateAvailable?.();
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          const hasExistingController = Boolean(navigator.serviceWorker.controller);
          if (installingWorker.state === "installed" && hasExistingController) {
            onUpdateAvailable?.();
          }
        });
      });
    })
    .catch((error: Error) => {
      console.error("Service worker registration failed:", error);
    });

  let hasReloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  });
}

/** Tells the waiting service worker to activate now, triggering a reload via controllerchange. */
export function applyServiceWorkerUpdate(): void {
  navigator.serviceWorker.getRegistration().then((registration) => {
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}
