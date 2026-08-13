# Bug Log

Chronological record of bugs found while building MarketMate. Add a new entry
every time something breaks — even if you fix it in the same session. This is
what future-us (or whoever inherits this) reads to avoid re-discovering the
same failure modes.

**Format per entry:** Date · Severity · Symptom · Root cause · Fix · Files touched.

---

## 2026-08-11 — sql.js loaded the wrong WASM binary, database silently failed to open

**Severity:** Blocker (app unusable — every screen showed the DB error instead of content)

**Symptom:**
On first load, the app got stuck showing:
```
Could not open local database: both async and sync fetching of the wasm failed
```
`npm run build` and `npm run dev` both reported zero errors — this only showed up
when the app was actually opened in a browser and exercised.

**Root cause:**
`sql.js`'s `package.json` declares two entry points via the `exports` map:
- `default`: `dist/sql-wasm.js` → fetches `sql-wasm.wasm`
- `browser`: `dist/sql-wasm-browser.js` → fetches `sql-wasm-browser.wasm`

Next.js/webpack resolves the `"browser"` condition for client bundles, so the
app was actually running `sql-wasm-browser.js`, which requests
`sql-wasm-browser.wasm`. We'd copied `dist/sql-wasm.wasm` (the *other* build's
binary) into `public/`, so the fetch 404'd. sql.js has a synchronous
`XMLHttpRequest` fallback for when the async fetch fails, but that fallback
isn't available in a plain browser context (`za` is undefined outside a
worker/Node), so both paths failed and it threw the generic
"both async and sync fetching" error — which doesn't name the missing file,
making this harder to spot than a normal 404.

**How it was caught:**
A `curl` check against `/sql-wasm.wasm` returned 200 — which is misleading,
since that's not the file the running code actually requests. Only driving the
app in a real (headless) browser and reading the on-page error surfaced it.
Lesson: a passing build + a 200 on the file you *assume* is being fetched is
not the same as confirming the file the bundler *actually* resolved is being
served. Drive the app, don't just curl your assumptions.

**Fix:**
```bash
rm public/sql-wasm.wasm
cp node_modules/sql.js/dist/sql-wasm-browser.wasm public/sql-wasm-browser.wasm
```
No code change needed — `lib/sqlite-init.ts`'s `locateFile: (file) => \`/${file}\`` was
already correct; it just needed the right file sitting at that path.

**Files touched:** `public/sql-wasm-browser.wasm` (added), `public/sql-wasm.wasm` (removed)

**Prevention:** If you ever bump the `sql.js` version, re-check
`node_modules/sql.js/package.json`'s `exports` map before assuming the copied
`.wasm` filename is still correct — it's tied to which entry point the bundler
picks, not to the package version.

---

## 2026-08-11 — Edit Product had no working entry point

**Severity:** Major (a whole user story — "Edit Product" — was unreachable in the UI)

**Symptom:**
`ProductForm` fully supported edit mode (pre-filled fields, PATCH, delete with
confirmation) and worked correctly if you could get to it — but nothing in
the UI ever opened it in edit mode. Tapping a product's name in
`ProductCard.tsx` called `setSelectedProductId(product.id)`, but no component
anywhere read `selectedProductId` back out of the store to actually render
the form.

**How it was caught:**
Not runtime — caught by auditing the built app against `PHASE-1-MVP.md`'s
acceptance criteria one by one while writing `implementation-plan.md`.
`grep -rn "selectedProductId"` across `components/`, `hooks/`, `lib/`, `app/`
showed the setter being called but the value never consumed. A build/typecheck
pass can't catch this class of bug — the code is valid, it just doesn't wire
up to anything.

**Fix:**
1. `app/page.tsx` (`InventoryTab`): read `selectedProductId` from the store,
   resolve it against the loaded `products` list, and render
   `<ProductForm product={editingProduct} onClose={() => setSelectedProductId(null)} />`
   when it resolves to a product.
2. `components/ProductCard.tsx`: replaced the ambiguous "tap the product name"
   affordance (no visible indication it was interactive, and didn't work on
   touch since the `hover:` state never fires) with an explicit ✎ edit-icon
   button — this also satisfies the spec's "long-presses... **or taps an edit
   icon**" criterion via the icon path instead of implementing a long-press
   gesture.

Verified end-to-end in headless Chromium: add a product → tap ✎ → form opens
pre-filled with the right values → change the name → Save → card reflects the
new name → modal closes. Zero console errors.

**Files touched:** `app/page.tsx`, `components/ProductCard.tsx`

---

## 2026-08-11 — selectedProductId would have reopened a stale edit modal after reload

**Severity:** Minor (not yet observed in the wild — caught during code review while fixing the bug above, before it shipped)

**Symptom (would-be):**
`lib/store.ts`'s Zustand store uses the `persist` middleware to save the whole
state to `localStorage`, including `selectedProductId`. Once the edit-product
flow above was wired up to open `ProductForm` whenever `selectedProductId` is
non-null, this meant: open a product for editing, close the tab (or the app
crashes) without explicitly cancelling, and the next app launch would silently
reopen the edit modal for whatever product was last selected.

**Root cause:**
`selectedProductId` is transient UI state (which modal is open right now), not
data that should survive a reload — but the default `persist()` config
persists the entire store shape with no exclusions.

**Fix:**
Added a `partialize` option to the `persist` config in `lib/store.ts` that
whitelists `shopName`, `currency`, `syncEnabled`, and `currentTab` for
persistence, deliberately leaving `selectedProductId` out. Verified: reload
the app after leaving the edit modal open — no modal appears.

**Files touched:** `lib/store.ts`

**Prevention:** Any time a new field gets added to a `persist`-wrapped store,
ask whether it's actually meant to survive a reload before letting the
default (persist everything) behavior stand.

---

## 2026-08-11 — Service worker registration never actually ran (gated behind a "load" event that already fired)

**Severity:** Blocker (the entire Prompt 3 feature — offline-first — silently did nothing)

**Symptom:**
Built the service worker, registration code, and offline/update banners, wired
everything up, ran the app — and `navigator.serviceWorker.getRegistration()`
came back `undefined`. No console error, no thrown exception. Cache Storage
was completely empty. The whole feature was a no-op.

**Root cause:**
`lib/service-worker.ts`'s `registerServiceWorker()` wrapped the actual
`navigator.serviceWorker.register(...)` call inside
`window.addEventListener("load", () => { ... })` — a pattern copied from
older (pre-React, script-tag-in-`<head>`) service worker tutorials, where the
registration script runs synchronously during initial HTML parsing, well
before `window`'s `load` event fires.

But this function is only ever called from inside a React `useEffect` (in
`UpdateBanner.tsx`), and `useEffect` only runs *after* mount — which, for a
client-hydrated app this size, happens well after `window.load` has already
fired once. `addEventListener("load", …)` only fires for the event occurring
*after* the listener attaches; since `load` is a one-time, non-replayable
event that had already happened, the registration callback inside it simply
never ran. No error, because nothing was wrong from the browser's
perspective — the listener was correctly registered for an event that would
never come again.

**How it was caught:**
Not by inspection — by testing. Drove the app in headless Chromium, checked
`navigator.serviceWorker.getRegistration()` and `caches.keys()` directly via
`page.evaluate()`. Both came back empty. Added a second diagnostic script
that also listened for `context.on("serviceworker", …)` — it never fired at
all, confirming registration genuinely never happened, not just some later
step in the chain.

**Fix:**
Removed the `window.addEventListener("load", …)` wrapper entirely — register
directly when `registerServiceWorker()` is called. Since it's already invoked
from a post-mount `useEffect`, that's already a safe, sufficiently-late point
to register; the extra gate was solving a problem that only existed in a
different (non-React) architecture.

**Files touched:** `lib/service-worker.ts`

**Prevention:** `window.addEventListener("load", …)` (and similarly
`DOMContentLoaded`) are one-shot events — a handler attached from inside a
React effect, a dynamically-imported module, or anything else that runs
asynchronously post-mount may simply never see them fire. Check
`document.readyState` first if you need to handle "already loaded" too, or
just don't gate on these events from React code at all.

---

## 2026-08-11 — Update banner never appeared; every deploy would have silently reloaded the page mid-use

**Severity:** Major (defeats the explicit "notify user, don't surprise them" requirement — a market woman mid-sale would get yanked into a reload with no warning)

**Symptom:**
Simulated a new deploy (changed a byte in `service-worker.js`, called
`registration.update()`). Expected the `UpdateBanner` to appear so the user
could choose when to refresh. It never did — `bannerAppeared: false` in every
test run, no matter how long the wait.

**Root cause:**
`public/service-worker.js`'s `install` handler unconditionally called
`self.skipWaiting()` after precaching:
```js
caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting());
```
`skipWaiting()` tells the browser "activate me immediately, don't wait for
old clients to release control" — which is exactly the "silent, always-fresh"
pattern, and it's fundamentally incompatible with the "ask the user first"
pattern the registration code (`lib/service-worker.ts`) and `UpdateBanner.tsx`
were built around. With `skipWaiting()` firing automatically on every
install, a new worker never sits in the "installed / waiting" state long
enough for `registration.waiting` to be observed — it activates and claims
clients almost immediately, so the `statechange` listener's
`installingWorker.state === "installed"` check technically fires but by then
`clients.claim()` (in `activate`) has likely already taken over, and the
whole "wait for the user to click Refresh" premise never gets a chance to
matter. Two contradictory patterns were combined by mistake — the first
version of the SW was written from a generic "always-fresh cache" example,
while the registration/UI layer was written for the classic "install →
waiting → user consents → skipWaiting()" pattern.

**How it was caught:**
Testing, not inspection — same as the registration bug above. Simulated a
version bump, called `reg.update()`, waited for the "new version" text with a
generous 10s timeout; it never appeared.

**Fix:**
Removed the unconditional `self.skipWaiting()` from the `install` handler.
The *only* place `skipWaiting()` is now called is the existing `message`
listener, triggered by `UpdateBanner`'s "Refresh" button via
`applyServiceWorkerUpdate()` (`postMessage({ type: "SKIP_WAITING" })`). On a
first-ever install (no prior active worker for the scope) this doesn't
change anything — there's no old worker holding clients, so the new one
still activates automatically per spec, confirmed by re-running the full
offline-scenario test afterward. On an *update*, the new worker now correctly
parks in "waiting" until the user acts.

**Files touched:** `public/service-worker.js`

**Prevention:** `skipWaiting()` and "ask the user before updating" are
opposite designs — never include both without being deliberate about which
one wins. If you want silent always-fresh updates, drop the banner/consent
UI entirely rather than building it and having it silently do nothing.

---

## 2026-08-11 — `navigator.onLine` misreports "online" right after a service-worker-served offline reload

**Severity:** Major (the literal acceptance criterion — "offline indicator shows when disconnected" — failed on first test)

**Symptom:**
Went offline, reloaded the page (successfully served from the SW's cache —
confirmed working by this point), and the `OfflineIndicator` banner never
appeared. Direct check: `navigator.onLine` read `true` immediately after that
reload, despite the browser being genuinely offline (confirmed independently
— a plain, non-SW-controlled page correctly fails to reload at all when
offline, and `navigator.onLine` correctly flips to `false` for simple
offline/online toggles *without* an intervening reload).

**Root cause:**
Best explanation from testing (not confirmed against browser source): when a
service worker answers a navigation request from Cache Storage instead of
the network, the browser's top-level document navigation "succeeds" without
ever attempting — and failing — a real network connection for that request.
`navigator.onLine`'s value isn't a static flag toggled once by test tooling;
it appears to get re-derived around navigation, and without an actual failed
network attempt to anchor it, it falls back to a heuristic that says "online."
This only reproduces across a *reload while already offline* — the simpler
case (already-loaded page transitions from online to offline) worked
correctly, which is why the first, simpler manual check didn't catch it.

**Fix:**
Stopped relying on `navigator.onLine` alone. `service-worker.js`'s fetch
handler now calls `self.clients.matchAll()` and `postMessage({ type:
"SW_OFFLINE" })` to every open client whenever its own `fetch(request)` call
actually throws — that's ground truth (an observed failure), not a browser
heuristic. `OfflineIndicator.tsx` listens for that message in addition to the
standard `window` `online`/`offline` events. Because a stale/late
`SW_OFFLINE` message (from a background revalidation fetch that started
before connectivity returned) could otherwise get "stuck" showing offline
forever, each `SW_OFFLINE` signal also arms a 3-second self-clearing timer
that double-checks `navigator.onLine` and clears itself if nothing re-confirms
offline within that window — so recovery doesn't depend on any single event
firing reliably.

**Files touched:** `public/service-worker.js`, `components/OfflineIndicator.tsx`

**Prevention:** Don't trust `navigator.onLine` as the sole signal once a
service worker is in the picture — it's a heuristic, and this project found a
concrete case where it's wrong. Ground truth from an actual fetch failure is
more reliable when you have it.

---

## 2026-08-11 — Viewport blocked pinch-zoom (`maximumScale: 1`), failing an accessibility check

**Severity:** Minor

**Symptom:**
Ran a Lighthouse audit against the production build; the `meta-viewport`
audit scored 0: `[maximum-scale] attribute is less than 5`, which disables
pinch-to-zoom.

**Root cause:**
`app/layout.tsx`'s `viewport` export set `maximumScale: 1` — copied from a
generic mobile-app viewport snippet without considering that this directly
harms users who need to zoom to read small text, which is the *opposite* of
this app's own "large, high-contrast UI for a low-tech-literacy audience"
design goal from `PHASE-1-MVP.md`.

**Fix:** Removed `maximumScale` entirely, leaving zoom unrestricted.

**Files touched:** `app/layout.tsx`

---

## 2026-08-11 — `PROMPT-PACK-PHASE-1.md`'s Lighthouse PWA score checkpoint no longer exists

**Severity:** N/A (spec/tooling drift, not a code bug — logged so nobody goes looking for a Lighthouse PWA score that can't be found)

**Symptom:**
The prompt pack's verification step says: "Check PWA audit score (should be
90+)" via Lighthouse. Running `lighthouse http://localhost:3000
--only-categories=pwa` against this project produces zero scored categories.

**Root cause:**
Google removed the standalone "PWA" category (and its installability badge)
from Lighthouse starting around v10 (2023) — installability checks moved to
Chrome DevTools' Application panel instead. The version installed here is
12.8.2, well past that change; the prompt pack's instruction predates it.

**Resolution (not a fix, a substitution):**
Used the same underlying signal Chrome itself uses to decide whether to
offer "Install app" — the `Page.getInstallabilityErrors` CDP method — via a
Playwright script: `(await context.newCDPSession(page)).send("Page.getInstallabilityErrors")`.
Result: `{ "installabilityErrors": [] }`, i.e. zero blockers. This is a more
current and more direct check than a Lighthouse score would have been anyway.

**Files touched:** none (verification-only)

---

## 2026-08-11 — Two Phase 1 user stories didn't actually match `PHASE-1-MVP.md`'s spec (found while writing tests for them)

**Severity:** Minor (both features "worked," just not quite as specified)

**Symptom:**
Writing the E2E suite (Prompt 4) meant reading each user story's acceptance
criteria closely enough to assert against, which surfaced two mismatches
between the spec and what was actually shipped in Prompt 2:

1. **User Story 3 (Low-Stock Summary)** says "Low-stock items pinned at top
   of inventory list." The Inventory tab's product grid was never reordered
   for low-stock status at all — `fetchProducts()` orders by `created_at
   DESC` and nothing downstream changes that. Only the separate Dashboard
   tab's `LowStockAlert` section (a different, dedicated summary view) put
   low-stock items first. A market woman scanning the actual Inventory list
   would find low-stock items wherever they happened to fall by creation
   order, not pinned at top as promised.
2. **User Story 5 (Manual Data Export)**: the CSV only ever contained the
   product snapshot, never transaction history. `PHASE-1-MVP.md`'s own CSV
   format example only shows product columns too, so the original build
   matched *that* — but `PROMPT-PACK-PHASE-1.md`'s Prompt 4 acceptance
   criteria explicitly requires "CSV contains all products + transactions,"
   which the export genuinely couldn't satisfy; the data just wasn't there
   to export.

**Root cause:** Neither one was caught in Prompt 2's manual verification
pass, because verifying "does export work" and "does the low-stock badge
show up" both looked correct in isolation — nobody had cross-checked the
*exact* wording of the acceptance criteria at that point, and no test
existed yet to force that comparison.

**Fix:**
1. Added `lib/product-utils.ts` (`isLowStock`, `sortByLowStockFirst`),
   consolidating a helper that was previously duplicated in
   `ProductCard.tsx` and `useInventoryStats.ts`. `InventoryTab` now sorts
   through `sortByLowStockFirst` before rendering.
2. `lib/csv-export.ts`'s `buildInventoryCsv` now takes a `transactions`
   array and appends a second "Transaction History" section (Date, Product
   Name, Type, Quantity, Notes) after the products table. `ExportButton.tsx`
   fetches all transactions via `useTransactions()` (no `productId` — this
   hook already supported fetching everything, just wasn't being called
   that way) and passes them through.

**Files touched:** `lib/product-utils.ts` (new), `components/ProductCard.tsx`,
`hooks/useInventoryStats.ts`, `app/page.tsx`, `lib/csv-export.ts`,
`components/ExportButton.tsx`

**Prevention:** When a later prompt's acceptance criteria are more specific
than what an earlier prompt actually verified, trust the more specific one
— and treat "I need to write an assertion for this" as a forcing function
that catches spec drift review alone didn't.

---

## 2026-08-11 — `OfflineIndicator` set state synchronously inside a `useEffect`, tripping `react-hooks/set-state-in-effect`

**Severity:** Minor (lint-only; no observed runtime symptom — the app worked
correctly, this is a "shouldn't have shipped this way" finding, not a bug a
user would hit)

**Symptom:**
`npm run lint` hadn't actually been run since Prompt 3 added
`OfflineIndicator.tsx`. Running it while setting up CI for Prompt 4 turned up
`react-hooks/set-state-in-effect` on the component's mount effect, which
called `setIsOffline(...)` directly in the effect body — exactly the pattern
that rule exists to catch (can trigger cascading renders).

**Root cause:** The component modeled "subscribe to `navigator.onLine` +
`window` online/offline events + the SW's `SW_OFFLINE` messages + a
self-clearing timer" as component state initialized and mutated from inside
`useEffect` — a reasonable-looking pattern, but not the primitive React
actually ships for "subscribe to external, mutable, non-React state."

**Fix:** Extracted all of it into `lib/offline-store.ts` — a plain
module-level store (subscribe/getSnapshot/getServerSnapshot) holding the
window listeners, the SW message listener, and the self-clearing timer
entirely outside React. `OfflineIndicator.tsx` now just calls
`useSyncExternalStore(subscribeOfflineStatus, getOfflineStatusSnapshot,
getOfflineStatusServerSnapshot)` — no effect, no lint violation, and
`getServerSnapshot` returning `false` handles the SSR/hydration mismatch
more correctly than the old manual `undefined`-initial-state workaround did.
Re-ran the full offline E2E test afterward to confirm the refactor didn't
change behavior — still 17/17 passing.

**Files touched:** `lib/offline-store.ts` (new), `components/OfflineIndicator.tsx`

**Prevention:** Run `npm run lint` as part of routine verification, not just
`npm run build` — TypeScript/bundler errors and lint findings catch
different classes of problems, and this one sat unnoticed for an entire
prompt's worth of work.

---

<!--
Next entry template:

## YYYY-MM-DD — One-line summary

**Severity:** Blocker / Major / Minor

**Symptom:**


**Root cause:**


**Fix:**


**Files touched:**

-->
