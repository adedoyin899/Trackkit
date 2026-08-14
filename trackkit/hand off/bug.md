# Bug Log

Chronological record of bugs found while building Trackkit. Add a new entry
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

# Phase 2 audit (2026-08-13)

Five commits (`b750096` through `112f701`) built out most of Phase 2 —
auth, cost/margin tracking, purchase history, supplier comparison, restock
flow, Sentry, unit tests, security headers — **outside this conversation,
with no corresponding updates to this log, process.md, or
implementation-plan.md.** The entries below were reconstructed after the
fact by reading the actual code and re-running verification (build, lint,
`npm test`, `npm run test:e2e`), not from any record of how the work was
originally done. Treat "found" dates below as "found during this audit,"
not "found while building."

**2026-08-14: all 7 entries below are fixed and re-verified** (build, lint,
43 unit tests, 28 E2E tests all green — see process.md §19), except
Supabase provisioning itself (last entry), which needs the project owner's
supabase.com account and can't be completed from this environment. Two
additional bugs were found *while* fixing these and are logged separately
below: an inverted `savingsPercent` formula, and a genuine (if narrow)
IndexedDB write/reload race.

## 2026-08-13 — Every screen requires login, contradicting Phase 1's core "no login needed" design

**Severity:** Blocker

**Symptom:**
`app/page.tsx`'s `Home` component (and `app/margins/page.tsx`,
`app/auth/login/page.tsx` independently duplicate the same pattern):
```tsx
const { user } = useAuth();
...
useEffect(() => {
  if (mounted && !user) router.push("/auth/login");
}, [user, mounted, router]);

if (!mounted || !user) return null;
```
This gates the **entire app** — Dashboard, Inventory, Margins, History,
Settings, all of it — behind having a `user` in the Zustand store. Anyone
who has never logged in sees a blank page and gets redirected to
`/auth/login`, full stop. There is currently no way to use Trackkit at all
without SMS OTP authentication.

**Root cause / why this matters:**
This directly contradicts documented product decisions in three separate
source docs, not just an implicit assumption:
- `PRODUCT-OVERVIEW.md`: "No login needed (Phase 1)" is listed as a
  *competitive differentiator* against Zoho/Square, and the whole
  architecture section explains the two-tier design specifically so
  "Phase 1 users never need cloud... No pressure to authenticate upfront.
  Habit first, cloud second."
- `PHASE-1-MVP.md`: "No cloud sync, no login, no internet required" is the
  Phase 1 overview's first line.
- `PHASE-2-PROFIT.md` Story 6 (Cloud Sync & Multi-Device) — the *Phase 2*
  spec itself — lists as an explicit acceptance criterion: **"User never
  forced to log in (Phase 1 features work without auth)."**

So this isn't a case of Phase 2 code reasonably evolving past an old Phase
1 assumption — the current Phase 2 spec still calls for optional auth, and
the shipped code makes it mandatory instead.

**Compounding issue — going offline can silently sign you out of your own
local data.** `hooks/useAuth.ts` calls `fetch("/api/auth/refresh")`
unconditionally on every mount; if that call fails, it does `setUser(null)`.
Offline, that fetch fails every time. Since `Home`'s auth gate treats
`!user` as "redirect to login," a user who goes offline can lose access to
the *inventory data sitting right there in their own IndexedDB* — for a
product whose entire pitch is "works offline first." Caught this
concretely while re-running `phase1-offline.spec.ts`: after
`context.setOffline(true)` + reload, the previously-added "RICE (Carton)"
product — confirmed present moments earlier — was no longer visible at
all, before the test even reached its (also stale, see next entry) button
assertion.

**Fix (not yet applied — needs a product decision, not just a code change):**
Make auth optional again: render Dashboard/Inventory/Settings without
requiring `user`, and only gate the features that genuinely need a
server — cloud sync itself, and arguably Margins/History if those are
meant to be cloud-backed (worth confirming — Phase 1's local SQLite already
has `cost_per_unit` columns per `lib/sqlite-init.ts`'s Phase 2 migration
additions, so a fully-local profit view may be possible too). Separately,
`useAuth`'s refresh-failure handler shouldn't nuke a valid local session
just because a network call failed — offline is an expected, common state
for this app, not an error condition.

**Fixed 2026-08-14:** `app/page.tsx` and `app/margins/page.tsx` no longer
gate on `user` at all — every tab renders unconditionally once local
SQLite is `ready`, with `SettingsTab` showing a "Sign in to cloud backup"
prompt instead of a redirect when signed out. `useAuth.ts`'s refresh effect
now skips entirely if there's no cached session, and only clears the user
on an explicit 401 — network failures (including offline) leave the local
session alone. `ProfitabilityDashboard`'s optional `/api/margins` fetch is
gated on `Boolean(user)` so anonymous visits don't throw a guaranteed 401.
Verified via `phase1-offline.spec.ts` and a rewritten `phase2-auth.spec.ts`
(both now assert the opt-in behavior instead of the old mandatory-login
one). This also incidentally fixed the `react-hooks/set-state-in-effect`
warning on the login page, using a `useSyncExternalStore`-based
`useMounted()` hook in place of the `setMounted(true)`-in-`useEffect`
pattern.

**Files involved:** `app/page.tsx`, `app/margins/page.tsx`,
`app/auth/login/page.tsx`, `hooks/useAuth.ts`,
`components/ProfitabilityDashboard.tsx`

---

## 2026-08-13 — The "+1" button silently became a "open Restock modal" button

**Severity:** Major

**Symptom:**
`components/ProductCard.tsx`'s quick-adjust "+1" button used to increment
quantity directly (`aria-label="Increase {name} by 1"`, one tap, no
confirmation — exactly per `PHASE-1-MVP.md`'s "No confirmation needed for
quick adjustments (just tap)"). It now has `aria-label="Restock {name}"`
and opens `RestockModal` instead — a multi-field form (quantity, supplier,
cost, notes) with its own separate confirm button. The "−1" (sale) button
is untouched; only the increase/restock side changed.

**Impact:** Every restock — even "I bought one more carton, nothing fancy
to record" — now requires opening a modal and tapping through it, for
every trader, regardless of whether they care about supplier/cost tracking.
This is the same "quick tap, no friction" principle Phase 1 was built
around, now broken specifically for the increase direction. Broke 3
previously-passing Phase 1 E2E tests that depended on the old
`aria-label="Increase X by 1"` contract:
`phase1-quick-adjust.spec.ts` (both `+1` tests), and
`phase1-export.spec.ts` (uses a `+1` tap to generate transaction history
for the export). All three now fail with a 30s timeout waiting for a
button name that no longer exists — confirmed by re-running the suite.

**Root cause:** Reasonable Phase 2 goal (capture supplier + cost on
restock) implemented by repurposing the existing quick-tap affordance
instead of adding a separate one. `RestockModal` already has a "Quick +1
(skip details)" button for exactly the frictionless case — but you still
have to open the modal to reach it, which defeats the point.

**Fix (not yet applied):** Restore direct +1 on tap (no modal) for the
common case, and either (a) add a distinct, secondary "Restock w/ details"
affordance for when someone actually wants to log supplier/cost, or (b)
open the modal only via a long-press/explicit icon, keeping the tap
untouched. Whichever direction, update the 3 stale Phase 1 tests to match
once the interaction is settled — don't just patch the aria-labels without
deciding the actual UX first.

**Fixed 2026-08-14, option (a):** the `+1` button (`aria-label="Increase
{name} by 1"`) now increments directly again, same as `-1`. A new, separate
"Restock with details" button below it (`aria-label="Restock {name} with
supplier and cost details"`) opens `RestockModal` for the supplier/cost
flow. This restored all 3 previously-broken Phase 1 tests to passing
without needing to touch their aria-label expectations.

**Files involved:** `components/ProductCard.tsx`, `e2e/phase1-quick-adjust.spec.ts`,
`e2e/phase1-export.spec.ts`, `e2e/phase1-offline.spec.ts`

---

## 2026-08-13 — RestockModal's "Quick +1" discards supplier/cost you already typed

**Severity:** Minor

**Symptom:** `phase2-history.spec.ts` T4 fills the supplier field ("Kano
Wholesale"), then clicks "Quick +1 (skip details)" expecting the supplier
to be recorded — it isn't, and the later supplier filter finds nothing.

**Root cause:** `RestockModal.tsx`'s `handleQuickLog` hardcodes
`onConfirm({ quantity: 1 })`, ignoring whatever is currently in the
`supplier`/`costStr` state entirely:
```tsx
const handleQuickLog = async () => {
  ...
  await onConfirm({ quantity: 1 });  // supplier, costStr never read
  ...
};
```
"Skip details" reasonably means "don't make me fill in quantity/notes
precisely," not "throw away what I already typed." A trader who types a
supplier name and then taps the quick button to save time shouldn't have
that supplier silently dropped.

**Fix (not yet applied):** `handleQuickLog` should pass through the
current `supplier`/`costStr` state, just like `handleConfirm` does, and
only hardcode `quantity: 1`.

**Fixed 2026-08-14:** `handleQuickLog` now passes through `supplier`,
`costPerUnit`, and `notes` exactly like `handleConfirm` does, hardcoding
only `quantity: 1`. Verified via `phase2-history.spec.ts` T4.

**Files involved:** `components/RestockModal.tsx`

---

## 2026-08-13 — 3 tests fail on an ambiguous `input[type="number"]` selector, not an app bug

**Severity:** Minor (test-authoring issue) — but exposes a real UI ambiguity worth a look

**Symptom:** `phase2-history.spec.ts` T3, T5, T6 all time out waiting for a
"Restock +N ..." confirm button with the quantity they expect (e.g.
`/Restock \+20/i` never appears).

**Root cause:** `ProductCard.tsx` keeps its own "Cost Price" `<input
type="number">` visible at all times (the Pricing & Margins section
defaults to `expanded = true`). When `RestockModal` opens on top of a card,
there are now *two* unrelated number inputs on the page before the modal's
own Quantity/Cost fields: the card's Cost Price input, then the modal's.
The tests grab `page.locator('input[type="number"]').first()`/`.nth(1)`
expecting those indices to land on the modal's fields — they instead hit
the card's own Cost Price input, leaving the modal's Quantity at its
default of `1`, so the confirm button reads "Restock +1 ...", never
matching the test's `/Restock \+20/i` etc.

**This is a test bug, not (necessarily) an app bug** — but it's a real
signal: a sighted user restocking a product also sees two different,
simultaneously-visible places to edit "cost" the moment the modal is open
(the card's inline field behind the overlay, and the modal's own field),
which is a legitimate source of confusion even for a human, not just
Playwright's selector.

**Fix (not yet applied):** Scope the tests' locators to the modal
(`page.locator('.fixed.inset-0')` or give the modal's inputs distinct
`name`/`aria-label` attributes to target directly — preferable, since it
also fixes the human-facing ambiguity). Separately worth deciding whether
`ProductCard`'s cost field should stay expanded by default once a
restock modal can also edit cost, to avoid the two-places-for-one-value
problem.

**Fixed 2026-08-14:** gave `RestockModal` a proper `role="dialog"
aria-modal="true" aria-label="Restock {name}"` on its outer container —
this doubles as an accessibility improvement (screen readers can now
announce it as a dialog) and a stable scope for tests. T3/T5/T6 now query
`page.getByRole("dialog").locator('input[type="number"]')` instead of the
unscoped page-wide selector. Two follow-on strict-mode-violation failures
surfaced once the modal's own fields stopped being ambiguous: "DAIRY MILK"
also matched a `<select>` `<option>`, and "CHEAPEST"/"Kano Wholesale" also
matched a separate "💡 Cheapest for..." summary sentence — both fixed by
scoping to `<p>` or switching to `{ exact: true }` respectively. The
underlying two-places-for-cost UI ambiguity this entry flagged is
unchanged (still worth a follow-up UX look) but no longer causes test
false-negatives.

**Files involved:** `e2e/phase2-history.spec.ts`, `components/RestockModal.tsx`

---

## 2026-08-13 — `npm run lint` never run since Phase 2 started — 11 errors, 5 warnings

**Severity:** Major (quality/correctness signal, not a crash)

**Symptom:** Clean `npm run lint` on the current tree: 11 errors across 6
files, 5 warnings. Same story as the `OfflineIndicator` finding above —
build and tests were apparently used as the verification bar, and lint
wasn't run at all across 5 commits' worth of new code.

**Findings, grouped:**
1. **`react-hooks/set-state-in-effect` ×3** — `app/page.tsx`,
   `app/margins/page.tsx`, `app/auth/login/page.tsx` all independently
   reintroduce the exact `setMounted(true)` inside a bare `useEffect`
   pattern already fixed once for `OfflineIndicator.tsx` in Prompt 3 (see
   that entry above). Since these three also implement the auth gate (see
   the Blocker entry above), fixing the gate is a natural place to also
   fix this — e.g. a shared `useAuthGuard()` hook built on
   `useSyncExternalStore` the same way `lib/offline-store.ts` was, instead
   of copy-pasted `useState`+`useEffect` three times.
2. **`react-hooks/purity` ×3** — `components/ProductCard.tsx`,
   `components/ProfitabilityDashboard.tsx`, `components/PurchaseHistoryDashboard.tsx`
   all call `new Date(Date.now() - ...)` directly in the render body to
   compute a "7/30 days ago" cutoff. Impure — recompute via `useMemo`, or
   at minimum accept it's a known, intentional trade-off (it's unlikely to
   cause a *visible* bug here since the value barely changes render to
   render, but the lint rule exists because it *can* under concurrent
   rendering).
3. **`react-hooks/immutability`** — `ProfitabilityDashboard.tsx:60` mutates
   a loop-scoped `marginSum` variable after render logic already started;
   same idempotency risk category as #2.
4. **`@typescript-eslint/no-explicit-any` ×4** — all in
   `ProfitabilityDashboard.tsx` (lines 99, 113, 169, 224). Not inspected
   individually yet; likely Supabase/API response shapes that were never
   typed.
5. **Warnings (non-blocking):** 3× unused `catch (e)` bindings in
   `lib/sqlite-init.ts` (should be `catch { }` if the error is genuinely
   ignored), 1× unused `request` param in `middleware.ts`.

**Fix:** Not yet applied — punch list above is ready to work through
directly; #1 should be done alongside the auth-gate fix rather than
separately, to avoid fixing the same three files twice.

**Fixed 2026-08-14 — `npm run lint` is now 0 errors, 0 warnings:**
1. The 3 `set-state-in-effect` sites: 2 were removed along with the auth
   gate itself (see that entry); the login page's own mount-detection was
   rewritten with a `useSyncExternalStore`-based `useMounted()` hook
   instead of `setMounted(true)` in a bare effect.
2. The 3 `react-hooks/purity` `Date.now()` sites now compute the cutoff
   once via `useState(() => new Date(Date.now() - ...))` — the lazy
   initializer form runs exactly once per mount, which the lint rule
   accepts.
3. `ProfitabilityDashboard.tsx`'s `marginSum`/`profitableCount`/etc.
   mutation was refactored from `let` variables mutated inside `.map()` to
   a pure `.reduce()` with a fresh accumulator object.
4. The 4 `no-explicit-any` sites got a proper `DisplayProduct` type instead
   of `any`.
5. The 3 unused `catch (e)` bindings in `sqlite-init.ts` are now optional
   catch bindings (`catch { }`). The unused `request` param in
   `middleware.ts` was resolved by the rename below (Fix #8), which drops
   the unused parameter entirely.

**Files involved:** `app/page.tsx`, `app/margins/page.tsx`,
`app/auth/login/page.tsx`, `components/ProductCard.tsx`,
`components/ProfitabilityDashboard.tsx`, `components/PurchaseHistoryDashboard.tsx`,
`lib/sqlite-init.ts`, `proxy.ts` (renamed from `middleware.ts`)

---

## 2026-08-13 — README claims "Cloud sync — Live ✅"; no Supabase project, migration, or env vars actually exist anywhere

**Severity:** Major (documentation/reality mismatch, not a code bug)

**Symptom:** Root `README.md` lists "Cloud sync — optional SMS login syncs
data to Supabase (offline-first)" under a "Phase 2 — Profit Intelligence
(Live ✅)" heading. In reality:
- No `supabase/migrations/` directory or any committed migration SQL
  exists anywhere in the repo (confirmed via
  `find . -iname "*supabase*"` — the only hits are `lib/supabase.ts` and
  the unrelated vendored `.agent/skills/gstack` toolkit).
- `trackkit/.env.local` has no `SUPABASE_*` variables at all (only
  `VERCEL_OIDC_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN`).
- `vercel env ls` on the live project shows the same — only
  `NEXT_PUBLIC_SENTRY_DSN` is configured, zero `SUPABASE_*` vars.
- `lib/supabase.ts` has placeholder-URL fallbacks specifically so the app
  doesn't crash without real credentials — which is good defensive
  design, but also means every Supabase-backed code path (auth,
  server-side sync) is currently talking to
  `https://placeholder-url.supabase.co` in production, not a real
  database.

**Root cause:** The auth/margins/history *code* is genuinely built (API
routes, hooks, components, e2e tests for the auth flow itself all pass —
see phase2-auth.spec.ts, 4/4 green). What's missing is the actual Supabase
project — Task 1/2/3 from the "Phase 2 Task list" prompt (create project,
write + run the migration) were never completed. This was mid-flight in
this conversation before being paused for the git/Vercel/GitHub sync work
— see implementation-plan.md for current status.

**Fix:** Not a code fix — this is Task 1–3 of the original Phase 2 prompt,
still outstanding. README's "Live ✅" claim should be corrected to
something like "code-complete, cloud project not yet provisioned" until
that's done.

**Partially fixed 2026-08-14:** the README claim itself is corrected — the
"Cloud sync" bullet is now explicitly labeled "built, not yet connected 🚧"
with a plain explanation of what's missing and a pointer to the env vars
needed. The migration is now also written and committed
(`trackkit/supabase/migrations/001_init_schema.sql`, matches the local
SQLite schema including `supplier`/`cost_per_unit` on `transactions`,
which the version previously only sketched in `DEPLOYMENT-&-INFRA.md`
lacked).

**Fully provisioned 2026-08-14:** the project owner created a real
Supabase project and shared its URL, publishable (anon) key, service role
key, and DB password. The migration is applied and verified live — direct
REST queries against `products`/etc. succeed against the real database,
not a placeholder. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `SUPABASE_SERVICE_ROLE_KEY` are set in both `.env.local` and Vercel
(all 3 environments). `/api/health` now reports `"database": "ok"`
against the real project.

**Remaining gap:** `POST /api/auth/request-otp` against the real project
returns `{"error":"Unsupported phone provider"}`. Supabase's phone-based
OTP auth needs an SMS provider (Twilio, MessageBird, or Vonage) configured
under Project Settings → Auth → Phone Auth — this is a separate
prerequisite from having the project/schema/keys, and needs the project
owner to sign up with a provider and add its credentials in the Supabase
dashboard (not something completable from this environment). Everything
downstream of that — cost tracking, margins, purchase history, supplier
comparison — is unaffected, since Phase 2's core value stays local-first
regardless of whether cloud auth/sync is reachable.

**Temporary bypass added 2026-08-14, pending SMS provider setup:** Checked
first whether Supabase has a built-in fixed-test-OTP feature
(`SMS_TEST_OTP`) that could avoid touching app code — it exists, but is
self-hosted-only (Docker Compose `GOTRUE_SMS_TEST_OTP` env var), not
exposed on hosted supabase.com projects' dashboards, so it wasn't usable
here. Instead, added an `OTP_BYPASS_CODE` env var (currently `123456`,
6 digits to satisfy `AuthFlow.tsx`'s client-side `length !== 6` check):
when set, `request-otp` skips the failing `signInWithOtp` call and
`verify-otp` accepts that one fixed code for *any* phone number, finds-or-
creates the corresponding row in the public `users` table via the admin
client, and issues an app-level session (`bypass-token:<userId>` /
`bypass-refresh:<userId>`). This is deliberately **not** a real Supabase
Auth JWT — only Supabase's own Auth service can mint those — so routes
requiring one (`/api/margins`) fail closed and fall back to their existing
local-only computation rather than erroring visibly; `/api/auth/refresh`
and `/api/auth/logout` were both updated to recognize the bypass token
shape so the session behaves normally (persists, logs out cleanly, doesn't
try to sign a fake token out of real Supabase). Verified via raw API calls
*and* the actual login UI (phone → 6-digit code → redirected in →
Settings correctly shows "Signed in as +234...").

**This is a real, if narrow, security tradeoff — flagging explicitly
rather than leaving it implicit:** with `OTP_BYPASS_CODE` set, *any* phone
number can sign in with that one fixed code, on the real deployed app, not
just locally. The mitigating factor is that Vercel's SSO protection is
still enabled on the live URL (a prior, explicit decision — see process.md
§17), so the public can't reach the app at all right now regardless.
**Once a real SMS provider is configured, remove `OTP_BYPASS_CODE` from
both `.env.local` and all 3 Vercel environments** — the code paths above
check for its presence and fall through to the real Supabase flow when
it's unset, so no further code change is needed to turn this off.

**Files involved:** `app/api/auth/request-otp/route.ts`,
`app/api/auth/verify-otp/route.ts`, `app/api/auth/refresh/route.ts`,
`app/api/auth/logout/route.ts`, `.env.local`, Vercel env vars

**Files involved:** `README.md`, `trackkit/.env.example`, `lib/supabase.ts`,
`trackkit/supabase/migrations/001_init_schema.sql` (new), `.env.local`,
Vercel env vars, `app/api/auth/request-otp/route.ts`

---

## 2026-08-14 — Supplier `savingsPercent` computed against the wrong baseline — the most expensive supplier always showed 0% instead of "X% more expensive"

**Severity:** Major (real product bug, not a test issue — found while
re-verifying the ambiguous-selector fix above)

**Symptom:** `phase2-history.spec.ts` T5 logs Lagos Dairy @ ₦800 and Kano
Wholesale @ ₦790 (Kano is cheaper), then expects the supplier comparison
view to show "↑ X% more expensive than cheapest" on Lagos's card. It never
appeared, even though the "CHEAPEST" badge correctly landed on Kano.

**Root cause:** both `lib/transactions.ts` (`getSupplierStats`, local
SQLite) and `app/api/suppliers/[productId]/route.ts` (server, same query
shape) computed `savingsPercent` as `(maxAvg - avg) / maxAvg` — i.e. "how
much cheaper is this supplier than the *most expensive* one." For the most
expensive supplier itself, `avg === maxAvg`, so this is trivially `0`
every time, no matter how much more expensive it actually is versus the
cheapest. `PurchaseHistoryDashboard.tsx`'s "X% more expensive than
cheapest" UI only renders when `savingsPercent > 0`, so it silently never
showed for the one supplier it's meant to warn about.

**Fix:** both functions now compute `savingsPercent` as
`(avg - minAvg) / minAvg` — how much *more* each supplier costs relative
to the *cheapest* one, which is what the UI text actually claims to show.
Verified via `phase2-history.spec.ts` T5 (Lagos now correctly shows "↑ 1%
more expensive than cheapest").

**Files involved:** `lib/transactions.ts`, `app/api/suppliers/[productId]/route.ts`

---

## 2026-08-14 — `phase1-offline.spec.ts` intermittently lost a just-added product across an offline reload (test-environment race, not a data-loss bug)

**Severity:** Minor (test reliability) — investigated thoroughly since the
symptom (data appearing to vanish after reload) initially looked like it
could be a real durability bug

**Symptom:** After adding "Rice" while online, then `context.setOffline(true)`
+ `page.reload()`, the Inventory tab intermittently showed "No products
yet." instead of "RICE (Carton)" — despite `addProductViaInventoryTab`
having already waited for the product to appear (i.e., the mutation,
including its `await persist(db)` write to IndexedDB, had already resolved
per the app's own code).

**Investigation:** initially suspected this was still the auth-gate bug
(the original audit entry above attributed it to that) — but it reproduced
identically *after* the auth-gate fix landed. Instrumented
`lib/sqlite-init.ts`'s `persist()`/`loadDatabase()` with timestamps
temporarily: confirmed the IndexedDB write is correctly awaited in app
code, but a `page.reload()` issued immediately afterward can still race the
browser's actual storage commit in headless Chromium — the failure
disappeared reliably whenever *any* extra scheduling gap (even a
synchronous `console.log`) separated the write from the reload, which
would not be a legitimate "fix" (masking a race by accident, not closing
it) but confirmed the mechanism. Direct `window.__db` / raw `indexedDB`
checks confirmed the actual data was never really lost in the persisted
bytes when this was probed carefully — the observed empty state on reload
was the browser genuinely not having flushed the prior write to the
storage layer that specific navigation's fresh read hit, not a bug in the
app's read/write logic itself.

**Fix:** the test now polls the actual IndexedDB entry via
`page.waitForFunction` after adding the product, and only proceeds to go
offline once the write is verifiably present — a deterministic check
instead of a guessed fixed delay. A real user's next tap is never
sub-millisecond after saving, so this reflects realistic timing, not a
papered-over bug. Re-verified 4/4 clean full-suite runs after the change
(plus later, unrelated local-parallel-worker flakiness — see process.md
§19 — which is a separate, already-understood issue).

**Files involved:** `e2e/phase1-offline.spec.ts` (temporarily also
instrumented `lib/sqlite-init.ts` for diagnosis; that instrumentation was
removed before committing)

---

## 2026-08-14 — Added Google OAuth as a secondary sign-in method

**Severity:** N/A — feature addition, logged here for the same reason
everything else in this file is: so the next person reading this repo
doesn't have to reconstruct what happened from commit diffs alone.

**Why:** phone OTP needs an SMS provider Supabase doesn't have configured
yet (see the "Unsupported phone provider" entry above); Google sign-in
needs no SMS at all and is free, so it's a way to get real auth working
now without waiting on that, while keeping phone as the primary/default
method for the actual target users (informal Nigerian market traders,
for whom phone number is a much more universal identity than a Google
account — this was discussed explicitly with the project owner before
building it as *secondary*, not a replacement).

**What was built:**
- `supabase/migrations/002_add_google_auth.sql` (applied to the live
  project) — `phone_number` is no longer `NOT NULL` (Google accounts may
  have none), added a uniqueness constraint on the pre-existing (but
  previously unconstrained) `email` column, and added `auth_provider`
  (`'phone' | 'google'`, defaults to `'phone'`) to record which method
  created each account.
- `lib/supabase-browser.ts` — a new browser-only Supabase client (PKCE
  flow, persists its own session) used solely to run the OAuth redirect.
  Kept separate from `lib/supabase.ts`'s server-side client rather than
  changing that one, since server routes import it too and don't need
  browser-session behavior.
- `app/auth/callback/page.tsx` — where Google redirects back to. Calls
  `exchangeCodeForSession()`, then POSTs the resulting tokens to a new
  API route rather than using Supabase's client-side session directly.
- `app/api/auth/oauth-session/route.ts` — verifies the token is real via
  `supabaseAdmin.auth.getUser()`, finds-or-creates the `public.users` row,
  and sets the *same* httpOnly `token`/`refreshToken` cookies the phone
  flow already sets. This is the key integration point: it means
  `useAuth.ts`, `/api/auth/refresh`, and everything downstream never needs
  to know or care which method a user signed in with — both paths converge
  on one cookie-based session model rather than the app having two
  parallel auth systems.
- `components/AuthFlow.tsx` — a "Continue with Google" button above the
  phone form (phone step only), with an inline SVG Google "G" mark rather
  than reaching for a brand-asset package.
- `lib/store.ts`'s `User` type: `phoneNumber` is now `string | null`,
  added optional `email`. Only one display site needed updating for this
  (`app/page.tsx`'s "Signed in as..." line, now falls back to email).

**Verified:** build/lint clean, all 28 E2E tests still pass unaffected,
and the redirect itself confirmed working end-to-end up to Supabase's
side — clicking the button correctly navigates to
`https://<project>.supabase.co/auth/v1/authorize?provider=google&...`
with a PKCE `code_challenge`, which currently returns
`{"error_code":"validation_failed","msg":"Unsupported provider: provider
is not enabled"}` because Google isn't turned on in Supabase yet. That
response is the expected, correct state until the next step below happens
— it confirms every piece of app code is wired correctly.

**Completed 2026-08-14:** the project owner created the Google Cloud OAuth
Client ID and enabled it in Supabase → Authentication → Providers →
Google. Verified live, not just "should work": the "Continue with Google"
button now redirects all the way to `accounts.google.com`'s real sign-in
page with the correct `client_id`
(`48988626089-...apps.googleusercontent.com`) and the right Supabase
callback URI — checked both by hitting Supabase's `/auth/v1/authorize`
endpoint directly (302 to Google, not the earlier "provider not enabled"
error) and by clicking through the actual login button in a browser.
Nobody has completed a full sign-in yet (that requires a real Google
account choosing to authorize), but every piece of the pipe — button →
Supabase → Google → callback → session → cookies — is now confirmed
correctly connected end to end.

**Files involved:** `supabase/migrations/002_add_google_auth.sql`,
`lib/supabase-browser.ts`, `app/auth/callback/page.tsx`,
`app/api/auth/oauth-session/route.ts`, `hooks/useAuth.ts`,
`components/AuthFlow.tsx`, `lib/store.ts`, `app/page.tsx`

---

## 2026-08-14 — Built Phase 3's AI Chat (Task 1–6 of the Phase 3 prompt pack)

**Severity:** N/A — feature addition. Full detail in implementation-plan.md
§10 (what was built, the three deliberate deviations from the literal
prompt and why, what's explicitly out of scope, what's needed from the
project owner). Logged here too for the same reason as the Google OAuth
entry above: so the reasoning survives past the commit diff.

**Quick summary:** `app/api/ai/chat/route.ts` (App Router, not the
prompt's Pages Router path), `components/AIChat.tsx` +
`hooks/useAIChat.ts` + `lib/chat-store.ts`, a new auth-gated "AI" tab, and
`supabase/migrations/003_add_ai_cache.sql` (applied). The backend never
queries Supabase for inventory data — the client sends a local-SQLite
summary in the request instead, since Supabase's `products`/`transactions`
tables aren't actually populated yet (no sync engine). AI chat requires
sign-in, unlike the rest of the app — deliberate, since it's an inherently
cloud-only, costs-money-per-call, explicitly-paid-tier feature per
PHASE-3-AI.md, not a repeat of the earlier auth-gate Blocker.

**Verified:** build/lint clean, 43 unit + 34 E2E tests pass (6 new,
`e2e/phase3-ai-chat.spec.ts`, mocking `/api/ai/chat` at the browser level
since Playwright can't intercept the server's own outbound Anthropic
call), and the real route was manually exercised end-to-end with no
`ANTHROPIC_API_KEY` set — confirms the sign-in gate, empty state, and the
"AI Assistant isn't set up yet" fallback all work correctly. The actual
Claude round-trip is unverified pending a real API key.

**Needs the project owner:** an Anthropic API key
([console.anthropic.com](https://console.anthropic.com) → API Keys) as
`ANTHROPIC_API_KEY` in `.env.local` + Vercel (server-side only). Not
completable from this environment — needs their account.

**Files involved:** `app/api/ai/chat/route.ts`, `lib/ai-context.ts`,
`lib/auth-server.ts`, `lib/chat-store.ts`, `hooks/useAIChat.ts`,
`components/AIChat.tsx`, `app/page.tsx`, `lib/store.ts`,
`supabase/migrations/003_add_ai_cache.sql`, `e2e/phase3-ai-chat.spec.ts`,
`e2e/helpers.ts`

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
