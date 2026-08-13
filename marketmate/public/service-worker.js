// MarketMate offline-first service worker.
//
// Plain JS, not TS: this file is served verbatim from /public by Next.js and
// executed directly by the browser as a Worker script — there is no build
// step in front of it, so TypeScript wouldn't run.
//
// Strategy: cache-first with background revalidation (stale-while-revalidate)
// for same-origin GET requests. A hand-rolled worker like this can't
// precache Next's content-hashed /_next/static/chunks/*.js filenames at
// install time the way next-pwa/Workbox would (those need the build
// manifest) — next-pwa was skipped here because it wraps webpack, and this
// project's dev/build both run on Turbopack by default (Next 16), so a
// webpack-only plugin wouldn't apply. Instead, every same-origin GET the
// user actually makes gets cached as it happens, so "load once online, then
// works offline" holds from the second visit on. A cold visit that starts
// offline before ever loading once can't work — no service worker exists
// yet to intercept anything, which is inherent to any PWA, not specific to
// this approach.

const CACHE_NAME = "marketmate-v1";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/sql-wasm-browser.wasm",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  // Deliberately no self.skipWaiting() here. On the very first-ever install
  // for this scope there's no older worker to protect, so this one still
  // activates automatically without it. On an UPDATE, skipping this means
  // the new worker parks in "waiting" until the user clicks Refresh in
  // UpdateBanner (which posts SKIP_WAITING — see the message listener
  // below) — otherwise every deploy would silently reload the page out from
  // under whoever's mid-transaction. (Caught by testing: with an
  // unconditional skipWaiting() here, updates applied and reloaded silently
  // and the "new version available" banner never had a chance to show.)
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only same-origin GETs go through our cache. Everything else (POSTs,
  // cross-origin CDN requests from design-system.html, etc.) is left to the
  // browser's default handling.
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          }
          return response;
        })
        .catch(() => {
          // A real, observed fetch failure — tell clients so the offline
          // banner can be grounded in fact rather than only navigator.onLine,
          // which doesn't always update correctly for requests a service
          // worker ends up serving from cache instead of network.
          notifyClientsOffline();
          return cached;
        });

      return cached || networkFetch;
    }),
  );
});

function notifyClientsOffline() {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: "SW_OFFLINE" }));
  });
}
