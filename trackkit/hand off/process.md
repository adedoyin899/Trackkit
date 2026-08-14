# Build Process Log

How Trackkit's Phase 1 scaffold was actually built, in order, with the exact
commands used. Follow this top to bottom on a clean checkout and you should
land in the same place. Written after the fact from the real session — not a
cleaned-up ideal version — so the dead ends and the fix for the one real bug
(see [bug.md](./bug.md)) are included on purpose.

**Source docs driving this build:** `../PROMPT-PACK-PHASE-1.md` (the 5-prompt
sequence this follows), `../PHASE-1-MVP.md` (feature spec, schema, file
structure), `../family DESIGN (1).md` (design tokens — confirmed by the
project owner as the actual design system to build against, not placeholder
inspiration).

---

## 0. Prerequisites confirmed

```bash
node -v   # v22.17.0
npm -v    # 10.9.2
bun -v    # 1.3.14 (used only for scaffolding speed; npm for everything else)
git --version
```

## 1. Scaffold the Next.js project

Ran from the `Trackkit/` docs folder, creating `trackkit/` alongside the spec docs:

```bash
bunx create-next-app@latest trackkit \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```

This produced Next.js 16.3 + React 19 + Tailwind v4 (the spec says "Next.js
14" — we used current latest instead; noted as a deliberate deviation, not an
oversight). Tailwind v4 has no `tailwind.config.js` — theme tokens live in CSS
via `@theme inline` in `app/globals.css` instead. Keep that in mind before
looking for a config file that doesn't exist in this version.

`create-next-app` also auto-generates `AGENTS.md` — read it before writing
code against this Next.js version. It flags that v16 has breaking changes
from most models' training data and points at
`node_modules/next/dist/docs/` for the current API surface.

## 2. Install Phase 1 dependencies

```bash
npm install zustand @tanstack/react-query sql.js idb-keyval papaparse uuid
npm install -D @types/sql.js @types/papaparse
```

Chosen over `wa-sqlite` (the pack's other listed option) because sql.js is
simpler to get working reliably for a first pass: pure WASM, no custom VFS
setup. Persistence is handled manually — see step 4.

## 3. Create the folder structure

```bash
mkdir -p components hooks lib tests/hooks tests/e2e tests/fixtures
```

Matches the "File Structure (Phase 1)" section of `PHASE-1-MVP.md`.

## 4. Copy the sql.js WASM binary — and get the filename right

```bash
cp node_modules/sql.js/dist/sql-wasm-browser.wasm public/sql-wasm-browser.wasm
```

**This is not `sql-wasm.wasm`.** Next.js resolves sql.js's `"browser"` package
export condition, which loads `dist/sql-wasm-browser.js` — a different build
than the default entry — and that build fetches `sql-wasm-browser.wasm`
specifically. Copying the wrong one produces a runtime-only failure that
neither `npm run build` nor a `curl` health check catches. Full story in
[bug.md](./bug.md#2026-08-11--sqljs-loaded-the-wrong-wasm-binary-database-silently-failed-to-open).

## 5. Build the data layer (bottom-up)

Order matters here — each file only depends on the ones before it:

1. `lib/types.ts` — `Product`, `Transaction`, `NewProduct`, `ProductUpdate`, `InventoryStats` types, matching `DATABASE-SCHEMA.md`'s Phase 1 tables exactly.
2. `lib/sqlite-init.ts` — loads sql.js WASM (`locateFile: (file) => \`/${file}\`` — resolves to whatever the browser build actually asks for), creates the `products`/`transactions` schema on first run, persists the exported DB bytes to IndexedDB via `idb-keyval` after every mutation, exposes `initDB()` (async, browser-only) and `getDB()` (sync accessor once initialized).
3. `lib/sql-helpers.ts` — thin `queryAll`/`queryOne`/`execute` wrappers around sql.js's prepared-statement API, so call sites bind params by name (`:id`) instead of hand-rolling `stmt.step()`/`stmt.free()` everywhere.
4. `lib/products.ts` — `fetchProducts`, `fetchProduct`, `addProduct`, `updateProduct`, `softDeleteProduct`. Soft delete sets `deleted_at`, never actually removes the row (audit trail, per spec).
5. `lib/transactions.ts` — `fetchTransactions`, `logTransaction` (applies the qty delta to the product row *and* inserts the transaction record in one call, clamps at 0 rather than throwing so a stray double-tap on "−1" at zero stock doesn't crash the UI).
6. `lib/csv-export.ts` — builds the exact CSV header/format from `PHASE-1-MVP.md`'s example via PapaParse, plus a `downloadCsv()` blob-URL trigger.
7. `lib/store.ts` — Zustand store (`shopName`, `currency`, `currentTab`, `selectedProductId`), persisted to localStorage via Zustand's `persist` middleware.
8. `lib/db-context.tsx` — React context that calls `initDB()` once on mount and exposes `{ ready, error }`, so every data hook can gate its query on "DB actually initialized" instead of racing it.
9. `app/providers.tsx` — wraps the app in `QueryClientProvider` + `DatabaseProvider`.

## 6. Build the hooks

- `hooks/useLocalInventory.ts` — TanStack Query wrapping the `lib/products.ts` functions; `enabled: ready` so it doesn't query before the DB context resolves.
- `hooks/useTransactions.ts` — same pattern for `lib/transactions.ts`; invalidates both the transactions query and the shared `PRODUCTS_QUERY_KEY` on success (a logged sale changes the product's quantity too).
- `hooks/useInventoryStats.ts` — pure derived state (`useMemo`) over `useLocalInventory()`'s product list: low-stock filter/sort, total value (only computed if every product has a price set, otherwise `null` → UI shows "TBD" per spec).

## 7. Wire up design tokens

Originally the Family design tokens were inlined directly into `app/globals.css`.
**Later refactored** (see step 10) into a standalone `public/styles/tokens.css` so the
same file could be linked by both the live app and a static design-system
page. If you're rebuilding from scratch, skip straight to the step 10 version
— there's no reason to inline them first.

## 8. Build components, then the page

Components (in order, each one used by the next): `ProductCard.tsx` →
`ProductForm.tsx` → `LowStockAlert.tsx` → `Dashboard.tsx` → `ExportButton.tsx`
→ `app/page.tsx` (tab nav: Dashboard / Inventory / Settings) → `app/layout.tsx`
(swap the scaffold's default Geist font for Inter, wire in `Providers`, set
real metadata).

Also added: `public/manifest.json` (PWA manifest stub — full service-worker
wiring is Prompt 3, not done yet).

## 9. Verify — don't trust build success alone

This is the step that actually caught the wasm bug. In order:

```bash
npm run build     # confirms types + bundling — did NOT catch the wasm bug
npm run dev &
curl http://localhost:3000/   # confirms the server responds — also did NOT catch it
```

Then actually drove the app in a headless browser (no project `run` skill
existed yet for this repo, so used the generic browser-driven pattern):

```bash
npm install -D playwright
npx playwright install chromium --with-deps
```

Wrote a throwaway Playwright script (`node` script, not committed — see
"Cleanup" below) that: navigates to `localhost:3000`, waits for the loading
state to clear, adds a product through the real form, taps +1/−1, checks the
low-stock badge, switches tabs, triggers the CSV export download, reloads the
page and confirms the product persisted. This is what surfaced the "both
async and sync fetching of the wasm failed" error — a screenshot immediately
showed the real on-page error text, which a build log or curl status code
never would have.

**Takeaway for next time:** for any change touching client-only browser APIs
(WASM, IndexedDB, service workers), a green build is not sufficient
verification. Drive it in a browser.

## 10. Design system doc + shared tokens (added in a later session)

To let the token source be edited once and reflected everywhere:

1. Created `public/styles/tokens.css` — extracted from `app/globals.css`, expanded with:
   - The full Family palette (previously only a subset was pulled in)
   - A semantic layer (`--surface-canvas`, `--text-heading`, `--action-primary-bg`, etc.) so components *could* reference roles instead of raw color names — not yet adopted by the actual components, tracked as a follow-up.
   - Dark-mode values under `:root[data-theme="dark"]` — **not present in the source design doc**, which is light-only. These are an extrapolation (see the comment block at the top of `tokens.css` for the reasoning). Deliberately not wired to `@media (prefers-color-scheme: dark)` yet, because most live components still hardcode `bg-white`/`text-ink-black` etc. rather than the semantic tokens — auto-flipping on OS dark mode right now would half-theme the app and look broken.
2. Updated `app/globals.css` to `@import "../public/styles/tokens.css"` instead of duplicating the `:root` block, keeping the Tailwind `@theme inline` mapping unchanged so no component code needed to change.
3. Built a standalone static file (opens directly via `file://`, no build step) that `<link>`s `tokens.css` directly. Includes a JS-driven light/dark toggle (`data-theme` attribute + localStorage), a color/typography/spacing/radius/shadow token gallery, a component gallery (buttons, badges, cards, form inputs), and live replicas of the actual `ProductCard`/`LowStockAlert`/tab-nav components so token changes are checkable against real UI.
4. Verified with a throwaway Playwright script loading the file directly (`file://.../design-system.html`), screenshotting both theme states, checking zero console errors.
5. `npm run build` re-run after the `globals.css` refactor to confirm the live app still compiles identically.

### 10a. Moved both into `public/` so the dev server can serve them

Originally `tokens.css` lived at `styles/tokens.css` and `design-system.html`
at the project root — both openable via `file://` but not reachable through
`npm run dev`'s localhost server, since Next only serves `app/` routes and
`public/` assets. Requested a localhost link for the design system, so:

```bash
mkdir -p public/styles
mv styles/tokens.css public/styles/tokens.css
mv design-system.html public/design-system.html
```

...and updated `app/globals.css`'s import to `@import "../public/styles/tokens.css"`.
`design-system.html`'s own `<link href="./styles/tokens.css">` needed no
change — the relative path still resolves correctly since both files moved
together. Confirmed via `curl`:

```
http://localhost:3000/                    → 200 (the app)
http://localhost:3000/design-system.html  → 200
http://localhost:3000/styles/tokens.css   → 200, content-type: text/css
```

Re-verified the whole page (not just the network layer) with another
throwaway Playwright script loading the served URL, not `file://` — zero
console errors, screenshot matched the `file://` version pixel-for-pixel.

**Result:** editing a value in `public/styles/tokens.css` now changes both
`public/design-system.html` (via `http://localhost:3000/design-system.html`
*or* opened directly as a file) and the live app (`npm run dev`) — there is
exactly one file to edit for a token change, and the design system page has a
real localhost URL.

## 11. Swapped emoji placeholders for a real icon pack (Phosphor Icons)

The first pass used raw emoji as icons (✎ edit, ⚠️ low-stock, 🔴/🟡 status
dots, ✕ close) — quick to write, but inconsistent rendering across platforms/
fonts and not actually part of the Family design language. Requested "some
free icon pack, different style" (Phosphor named as an example) to replace
them.

```bash
npm install @phosphor-icons/react
```

1. `app/providers.tsx` — wrapped the app in Phosphor's `<IconContext.Provider
   value={{ size: 20, weight: "bold" }}>` so every icon defaults consistently
   without repeating props at every call site. Chose `bold` specifically
   because `PHASE-1-MVP.md` calls for "large, high-contrast" UI for a
   low-tech-literacy audience — bold reads better at small sizes than the
   default regular/thin weights.
2. Went component by component replacing every emoji/text glyph with the
   matching Phosphor icon: `PencilSimple` (edit), `Warning`/`WarningCircle`/
   `WarningOctagon` (low-stock states — `fill` weight override so they read
   as alerts, not outlines), `Minus`/`Plus` (stock adjust buttons), `X`
   (close modal), `Trash` (delete), `DownloadSimple` (export), plus new
   additions that weren't emoji before but improve the UI:
   `SquaresFour`/`Package`/`Gear` for the tab-nav (outline when inactive,
   `fill` when active — standard tab-bar convention), `Storefront` for the
   header logo badge and Shop Name field, `CloudArrowUp` for the Backup
   section heading.
3. Verified in a real browser after every batch of changes — screenshotted
   each tab, confirmed the pencil/warning/plus/minus icons render crisply at
   card scale, zero console errors.
4. Mirrored the same icon set in `public/design-system.html`: added
   `@phosphor-icons/web`'s CDN font build (`<script src="https://unpkg.com/@phosphor-icons/web">`)
   since that page has no build step, added a new "Icons" section (weight
   comparison row + a grid documenting every icon actually used in the app,
   generated from the same list a developer would grep for in `components/`),
   and updated the "App Patterns" live replicas (ProductCard, LowStockAlert,
   tab-nav) to use the real `<i class="ph-bold ph-...">` icons instead of
   emoji, so the replicas stay honest copies of the real components.
5. Re-verified `design-system.html` in both themes — icons use `currentColor`
   by default, so they flipped correctly with the dark-mode toggle with zero
   extra work.

**Files touched:** `app/providers.tsx`, `components/ProductCard.tsx`,
`components/LowStockAlert.tsx`, `components/Dashboard.tsx`,
`components/ProductForm.tsx`, `components/ExportButton.tsx`, `app/page.tsx`,
`public/design-system.html`.

## 12. Prompt 3 — offline-first service worker + PWA installability

Followed `PROMPT-PACK-PHASE-1.md`'s Prompt 3 almost exactly, with two
deliberate deviations from the literal spec, both explained inline:

**Skipped `next-pwa`.** The prompt offers "add `with-pwa` plugin (if using)
OR manually configure manifest" — went manual. `next-pwa`/`@ducanh2912/next-pwa`
wrap **webpack**; this project's `dev`/`build` both run on **Turbopack** by
default (Next 16 — confirmed by the `▲ Next.js 16.3.0 (Turbopack)` banner on
every build despite `--no-turbopack` at scaffold time, which apparently only
affects the initial template, not the runtime default in this version). A
webpack-only plugin wouldn't apply. Hand-rolling means no build-time
generated precache manifest for `_next/static/chunks/*.js` (those filenames
are content-hashed per build) — so this SW uses runtime caching
(stale-while-revalidate on every same-origin GET) instead of a precise
install-time precache list. Practical effect: "load once online, then works
offline" holds from the *second* visit on, not a completely cold first visit
with zero prior network access — which is inherent to any PWA regardless of
tooling; code can't run before it's ever been downloaded once.

1. **Icons.** `public/manifest.json` needed real 192px/512px PNGs; had
   neither uploaded artwork nor a raster/vector conversion tool handy beyond
   macOS's built-in `sips` (bitmap-only, no SVG input). Reused the already-
   validated Playwright + `@phosphor-icons/web` CDN technique from the
   design-system work: rendered a `Storefront` glyph (matching the header
   logo badge) on an ink-black background at exact 512×512 and 192×192
   viewports, screenshotted each. `sips -g pixelWidth -g pixelHeight` to
   confirm exact dimensions. Set `"purpose": "any maskable"` — the glyph sits
   comfortably inside the ~80% safe zone Android's adaptive-icon mask needs.

2. **`public/manifest.json`** — filled in real icons, `theme_color`
   changed from the prompt's literal `#1f2937` (a generic slate-gray not in
   this project's palette at all) to `#121212` (ink-black — the same
   "one moment of darkness" primary-action color used throughout the actual
   design system), `background_color` set to the cream canvas.
   `app/layout.tsx`'s `viewport.themeColor` updated to match, so the browser
   chrome and the PWA splash screen agree.

3. **`public/service-worker.js`** (plain JS, not `.ts` as the prompt names
   it — files under `public/` are served verbatim with no compile step, and
   a browser can't execute TypeScript directly). Cache-first with background
   revalidation for same-origin GETs only; explicitly precaches `/`,
   `/manifest.json`, `/sql-wasm-browser.wasm`, and both icons on install so
   those specific critical assets are guaranteed cached even on the very
   first activation, before any runtime caching kicks in.

4. **`lib/service-worker.ts`** — registration, update detection
   (`installing` → `statechange` → `installed` while a controller already
   exists = update available), and the `controllerchange` → reload handoff.

5. **`components/OfflineIndicator.tsx`** and **`components/UpdateBanner.tsx`**
   — mounted in `app/layout.tsx` above `<Providers>` so they're visible app-
   wide regardless of tab. Deliberately did **not** fabricate a "sync queue
   count" as the prompt's stub suggests ("Display sync queue count (Phase 2
   feature, stub for now)") — Phase 1 has no sync queue at all, and a fake
   number would misrepresent what's actually happening. The banner just says
   data is saved on-device, which is true and doesn't imply a feature that
   doesn't exist yet.

6. **Verification — this is where the real bugs were,** see
   [bug.md](./bug.md) for full writeups of each:
   - Registered via `window.addEventListener("load", …)` from inside a React
     `useEffect` — `load` had already fired by the time the effect ran, so
     registration silently never happened at all. Caught by checking
     `navigator.serviceWorker.getRegistration()` directly in a browser, not
     by reading the code.
   - `self.skipWaiting()` was called unconditionally in `install`, which
     silently auto-activated every update and meant the "new version
     available" banner never got a chance to appear — contradicted the very
     UI being built for it. Caught by simulating a version bump (edit a byte
     in the SW file, call `registration.update()`) and watching the banner
     never show.
   - `navigator.onLine` reports `true` (wrong) immediately after a
     service-worker-served offline reload, even though `window`
     `online`/`offline` events fire correctly for simpler non-reload
     transitions. Fixed by having the SW's own fetch handler tell clients
     about real, observed fetch failures (`postMessage({type:"SW_OFFLINE"})`)
     as a ground-truth supplement, with a self-expiring timer so a stale
     signal can't get the banner stuck.
   - `maximumScale: 1` in the viewport config blocked pinch-zoom — a real
     Lighthouse accessibility finding, unrelated to the SW work but caught in
     the same audit pass. Removed.

   All four fixed, then the **entire scenario re-verified end to end** against
   the real production build (`npm run build && npm run start`, not `next
   dev` — service workers behave more predictably outside Turbopack's dev
   HMR): first visit online → add a product → go offline
   (`context.setOffline(true)`) → reload → offline banner appears → existing
   product still visible, `+1` still works → **add an entirely new product
   while fully offline** → back online → banner clears → reload again →
   the offline-added product persisted. Zero console errors throughout.

7. **Lighthouse's PWA score no longer exists** (see bug.md) — Google removed
   the standalone PWA category around Lighthouse v10; this project has 12.8.2.
   Substituted Chrome's actual installability signal instead:
   `(await context.newCDPSession(page)).send("Page.getInstallabilityErrors")`
   → `{ installabilityErrors: [] }`. That's the same check Chrome itself runs
   to decide whether to offer "Install app," so it's arguably a more direct
   verification than a Lighthouse score would have been.

**Files added/changed:** `public/service-worker.js`, `lib/service-worker.ts`,
`components/OfflineIndicator.tsx`, `components/UpdateBanner.tsx`,
`public/manifest.json`, `public/icons/icon-192.png`,
`public/icons/icon-512.png`, `app/layout.tsx`, `app/providers.tsx` (icon
context untouched, no change needed there).

## 13. Prompt 4 — committed E2E suite

Followed `PROMPT-PACK-PHASE-1.md`'s Prompt 4. Unlike Prompts 1–3, this is the
first time verification scripts became **part of the deliverable** rather
than throwaway aids — see "Cleanup discipline" below for why that changes
where things live.

**Fixed two real spec-compliance gaps before writing tests for them** — see
[bug.md](./bug.md) for full writeups. Writing an assertion forces you to
read the exact acceptance-criteria wording, which caught things a "does it
look right" pass over Prompt 2 hadn't:
1. Low-stock items weren't pinned at the top of the Inventory list (only a
   separate Dashboard section did that) — added `lib/product-utils.ts`
   (`sortByLowStockFirst`), consolidating a previously-duplicated
   `isLowStock` helper along the way.
2. CSV export never included transaction history, only the product
   snapshot — `lib/csv-export.ts`'s `buildInventoryCsv` now takes a second
   `transactions` argument and appends a "Transaction History" section.

**Test runner setup:**
```bash
npm uninstall playwright
npm install -D @playwright/test
```
Swapped the standalone `playwright` package (used for ad hoc scripts in
Prompts 1–3) for `@playwright/test`, which is a superset — same
`chromium.launch()` API plus the actual `test`/`expect`/`defineConfig` test
runner. One package instead of two.

`playwright.config.ts`: `testDir: "./e2e"` (the empty `tests/e2e/` from
Prompt 1's scaffold was removed — this prompt names files as
`e2e/phase1-*.spec.ts` explicitly, a different convention than
`PHASE-1-MVP.md`'s original file-structure sketch; the more specific,
current instruction wins). `webServer` runs `npm run build && npm run
start` — production, not `next dev` — because the service worker's caching
behavior (Prompt 3) needs a real production server to test reliably.
`workers: process.env.CI ? 1 : undefined` — safe to parallelize locally
since each test gets its own isolated browser context (fresh
IndexedDB/localStorage) by default and the app's "database" is entirely
client-side, so the shared `webServer` itself is stateless; capped on CI
only for the runner's resource limits.

**`e2e/helpers.ts`** — shared `waitForAppReady`, `gotoTab`,
`addProductViaInventoryTab` so the five spec files don't each hand-roll the
same form-filling boilerplate.

**The five spec files**, one per user story, matching the prompt's exact
file list: `phase1-add-product.spec.ts`, `phase1-quick-adjust.spec.ts`,
`phase1-low-stock.spec.ts`, `phase1-offline.spec.ts` (formalizes the ad hoc
scenario from Prompt 3's verification into a permanent test),
`phase1-export.spec.ts`. 17 tests total. One honest gap documented inline in
`phase1-add-product.spec.ts`: `PHASE-1-MVP.md` calls for testing "unit
required" validation, but Unit is a `<select>` that always defaults to
"Carton" — there's no way to drive it into an empty state through the UI as
built, so that specific validation branch isn't reachable by a real user
either. Wrote a test that documents this constraint explicitly rather than
silently skipping it or faking a test that doesn't reflect reality.

**Ran the suite twice before trusting it green** (flakiness check, given
timing-sensitive bits like the offline self-clearing timer from Prompt 3):
17/17 both times, ~12–13s each.

**`npm run lint` turned up something `npm run build` never would have** —
`OfflineIndicator.tsx` (from Prompt 3) violated `react-hooks/set-state-in-
effect`. Nobody had run lint since it was added. Refactored to
`lib/offline-store.ts` + `useSyncExternalStore` instead of `useState` +
`useEffect` — see bug.md for the full reasoning. Re-ran the full suite
afterward (still 17/17) to confirm the refactor didn't change behavior.

**GitHub Actions** — `.github/workflows/e2e.yml`: checkout, setup-node,
`npm ci`, `npx playwright install --with-deps chromium`, `npm run
test:e2e`, upload the HTML report as an artifact on any outcome. **Caveat:**
this repo has no `git remote` configured (confirmed via `git remote -v`) and
`gh` isn't installed in this environment, so the workflow could not be
verified against real GitHub Actions — it follows Playwright's documented
CI recipe, but "written correctly" and "confirmed working on GitHub's
infrastructure" are different claims; only the first one is true here.

**Manual market-woman scenario** (the prompt's own suggested exploratory
pass, distinct from the five spec files): add 3 products online → go
offline → sell from each → add a 4th product offline → back online →
reload → export CSV. Ran once more as a final narrative-level smoke check
after the automated suite was green — all quantities correct, 4th product
present, CSV contained everything, zero console errors.

**"90%+ coverage" / `npm run test -- --coverage`:** the prompt pack's
acceptance criteria conflates E2E flow coverage with a unit-test code-
coverage command. This project has no unit test runner (Vitest was named in
`PHASE-1-MVP.md`'s tech stack but never set up in Prompts 1–3, which only
produced E2E-style browser verification) — there's no `npm run test` to run
`--coverage` against, and nothing to fabricate a percentage from. Read
"coverage" here as "all five user stories have tests, all their listed
sub-cases are covered" (true — see the spec files) rather than a literal
Istanbul/`c8` code-coverage number.

**Files added:** `playwright.config.ts`, `e2e/helpers.ts`,
`e2e/phase1-add-product.spec.ts`, `e2e/phase1-quick-adjust.spec.ts`,
`e2e/phase1-low-stock.spec.ts`, `e2e/phase1-offline.spec.ts`,
`e2e/phase1-export.spec.ts`, `.github/workflows/e2e.yml`,
`lib/product-utils.ts`, `lib/offline-store.ts`. **Files changed:**
`app/page.tsx`, `components/ProductCard.tsx`, `hooks/useInventoryStats.ts`,
`lib/csv-export.ts`, `components/ExportButton.tsx`,
`components/OfflineIndicator.tsx`, `package.json`.

## Cleanup discipline

Every Playwright verification script used **for Prompts 1–3, and for the
one-off manual-scenario check in Prompt 4,** was written to a `scripts/`
folder, run, screenshotted, and then **deleted** (`rm -rf scripts`) once it
had done its job — these were throwaway verification aids, not part of the
deliverable. Prompt 4 is the one exception by design: its whole point was a
**permanent, re-runnable** suite, so those five spec files live in the
committed `e2e/` directory instead and are meant to stay.

## 14. Prompt 5 — Vercel deploy (prep only; deploy itself needs your accounts)

This prompt is qualitatively different from 1–4: it asks to create a GitHub
repo, push to it, create/link a Vercel project, and deploy to a public URL —
all of which need the project owner's own GitHub and Vercel accounts.
Confirmed before starting that none of that exists yet in this environment:

```bash
which gh       # not found
which vercel   # not found
git remote -v  # empty — no remote configured
ls .vercel     # doesn't exist — no Vercel project linked
```

Asked the project owner how they wanted to handle the account-gated steps
rather than guessing; they chose **"prepare the files, skip the runbook for
now"** — so what follows is everything that could be done without an
account, with the account-linking walkthrough deferred until they're ready
to actually deploy.

**What was actually done:**

1. **`package.json` — added an `engines` field** (`"node": ">=20.9.0"`,
   matching `node_modules/next/package.json`'s own declared requirement
   exactly). Vercel's default Node runtime for new projects can vary by
   when the project was created; pinning this removes that ambiguity rather
   than hoping Vercel's default happens to satisfy Next 16's floor.
   Verified with a clean install (`rm -rf node_modules && npm ci`) —
   package-lock.json is in sync, no drift.

2. **`.github/workflows/deploy.yml`** — test → deploy → smoke-test, gated in
   that order, triggered on push to `main` only. Uses Vercel's own
   documented CLI-based deploy pattern (`vercel pull` → `vercel build` →
   `vercel deploy --prebuilt`), not a third-party GitHub Action, so it isn't
   dependent on some other project's maintenance. Requires three repo
   secrets that **don't exist in this repo yet** — `VERCEL_TOKEN`,
   `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — documented at the top of the
   workflow file itself with exactly where each one comes from. Until those
   are added, the workflow will run its test job successfully and then fail
   at the `vercel pull` step with an auth error — that's the expected,
   correct behavior for an unconfigured deploy target, not a bug in the
   workflow.

3. **Adjusted `e2e.yml`'s trigger** from `push + pull_request` to
   `pull_request` only, since `deploy.yml` now owns push-to-main (and runs
   the identical test suite as its own gate before deploying) — avoids
   running the same 17 tests twice on every push to main.

4. **Re-verified the whole build pipeline** after these changes: clean
   `npm ci`, `npm run build`, full `npm run test:e2e` (17/17), and validated
   both workflow YAML files parse correctly (`python3 -c "import yaml; ..."`).
   Everything Vercel would need to build and deploy this repo is in place
   and confirmed working locally — the only missing piece is the account
   linking, which is squarely outside what can happen without the project
   owner's credentials.

**Not done, deliberately, per the project owner's choice:** the step-by-step
account-linking runbook (create GitHub repo → push → vercel.com "New
Project" → import → set the three secrets above → first deploy). That's
still the actual remaining work for Prompt 5's acceptance criteria (live
URL, offline/PWA verified on that URL, first real push through the pipeline)
— ready to write whenever asked.

**Files added:** `.github/workflows/deploy.yml`. **Files changed:**
`package.json` (engines field), `.github/workflows/e2e.yml` (trigger).

## 15. GitHub sync — deploy key, repo merge, first push

None of this was logged at the time (tracked only in conversation, not
here) — reconstructed from git history for completeness.

The actual GitHub repo is `github.com/adedoyin899/Trackkit` — one level up
from this app (`trackkit/` is a subfolder of it, alongside all the
`PHASE-*.md`/`PRODUCT-OVERVIEW.md` planning docs). It already existed with
one commit (`10c240e`, vendoring a `.agent/skills/gstack` toolkit) before
this app's code touched it.

1. **Auth: dedicated SSH deploy key**, not a personal key. Generated
   `~/.ssh/id_ed25519_trackkit`, added a `Host github.com-trackkit` alias in
   `~/.ssh/config` (matching a `github.com-<project>` convention the
   machine already had for other repos), had the project owner add the
   public key as a repo Deploy Key (write access) via GitHub's UI —
   nothing about SSH keys can happen without that manual step. Verified
   with `ssh -T git@github.com-trackkit`.
2. **Merged `marketmate/`'s standalone git history into the one repo.**
   `marketmate/` (as it was still named then) had its own separate `.git`
   with a single "Initial commit from Create Next App" and everything
   since sitting uncommitted. Removed that nested `.git`, `git init`'d at
   the `Trackkit/` root instead, fetched the existing remote history,
   checked it out as the local `main`, then `git add -A` + commit — folding
   the app in as regular tracked files alongside the docs, on top of the
   pre-existing gstack commit. Confirmed via `git status --short` before
   committing that `node_modules`/`.next`/etc. were correctly excluded
   (the nested `marketmate/.gitignore` still applies to that subtree even
   without its own repo).
3. Added a root-level `.gitignore` for `.claude/` (local Claude Code
   session config — a permission allowlist with zero secrets, but still
   machine-specific, not project config) and `.DS_Store`.
4. Pushed. Verified local/remote `HEAD` matched via `git ls-remote`.

## 16. Renamed the project from MarketMate to Trackkit

Also not logged live. The product docs were written under a placeholder
name ("MarketMate"); the actual repo/project is Trackkit, so unified on
that everywhere per the project owner's request.

1. Inventoried every occurrence first: `grep -rliE "marketmate"` across
   the whole tree (excluding `node_modules`/build output) — 29 files, only
   two case variants used (`MarketMate`, `marketmate`), no stray
   ALL-CAPS or partial-word variants.
2. `git mv marketmate trackkit` (preserves rename detection in the
   subsequent commit).
3. Bulk `sed -i '' -e 's/MarketMate/Trackkit/g' -e 's/marketmate/trackkit/g'`
   across all 29 files. First attempt actually ran as a single bogus
   sed invocation against one giant concatenated "filename" — this
   shell's `for f in $FILES` (unquoted) doesn't word-split the way bash
   does; fixed by using a real array (`files=(...)`; `for f in
   "${files[@]}"`), which behaves correctly in both.
4. **The blind text replace missed one real occurrence**: `public/design-system.html`'s
   header had the wordmark split across HTML for accent-color styling —
   `Market<span>Mate</span>` — so the literal string `MarketMate` never
   appeared as one token for `sed` to match. Caught during a full diff
   review afterward (searched for any standalone `Market`/`Mate` word left
   over) and fixed by hand to `Track<span>kit</span>`, preserving the same
   "accent-color the last syllable" pattern.
5. Also renamed the `useMarketMateStore` hook to `useTrackkitStore`
   (the sed replace caught this too, since `MarketMate` is a literal
   substring of the old hook name) and regenerated `package-lock.json` via
   a clean `npm install` after changing `package.json`'s `name` field,
   rather than trusting a blind text edit on a generated file.
6. Re-verified after: clean `npm ci`, `npm run build`, `npm run lint`,
   full `npm run test:e2e` (17/17 at the time), plus a real-browser
   screenshot check of both the live app header and `design-system.html`
   in both themes to visually confirm the rename read correctly, not just
   pass automated checks.

## 17. Vercel 404 — Root Directory misconfigured

The project owner reported a Vercel 404 (`NOT_FOUND`, the `cpt1::...` ID
format that confirms it's a genuine Vercel-served response) shortly after
connecting the repo via Vercel's dashboard. Diagnosed and fixed via the
Vercel CLI, installed fresh for this (`npm install -g vercel`, then
`vercel login` — prints a device-auth URL, project owner confirmed it in
their own browser, CLI picked up the authenticated session automatically).

1. `vercel project inspect trackkit` showed the actual misconfiguration:
   **Root Directory: `.`** (the whole `Trackkit` repo root) and
   **Framework Preset: "Other."** Since the Next.js app lives in the
   `trackkit/` subfolder, Vercel found no app to build at the repo root
   and fell back to serving nothing there — hence the 404. (The dashboard
   "Import" flow evidently didn't prompt for/detect this — worth manually
   checking Root Directory any time a repo's app isn't at the repo root.)
2. `vercel project update trackkit --root-directory trackkit --framework nextjs`
   fixed both settings directly via CLI flags, no dashboard clicking
   needed.
3. **First redeploy attempt failed differently**: ran `vercel --prod` from
   inside `trackkit/` itself, which uploads only that folder's contents as
   the deployment source — so the *uploaded* artifact has no `trackkit/`
   subfolder for the "Root Directory: trackkit" setting to descend into,
   producing "The specified Root Directory 'trackkit' does not exist."
   Fixed by re-linking (`vercel link`) and deploying from the *parent*
   `Trackkit/` directory instead, matching what the real git-integration
   deploy path uploads.
4. Deploy succeeded — clean Next.js build, Vercel's own API reported
   `readyState: "READY"`, aliased to `trackkit-psi.vercel.app`.
5. **Could not personally curl-verify the live URL** — this sandboxed
   environment's network blocks DNS resolution to `*.vercel.app` (same
   category of restriction that blocked `api.github.com` earlier in the
   session; git protocol and npm registry access work, generic HTTPS to
   other hosts often doesn't). Asked the project owner to confirm the URL
   loads from their own machine instead of asserting it worked based on
   the API response alone.
6. **Found `ssoProtection: "all_except_custom_domains"` while checking
   protection settings** — Vercel's account-login wall currently covers
   the production URL too, since it's on the default `.vercel.app` domain
   (no custom domain yet). Flagged to the project owner as contradicting
   Phase 1's "no login needed" design; **they chose to leave it on for
   now** (their call — noted as a deliberate decision, not an oversight,
   in case it looks surprising later).

## 18. Phase 2 audit (2026-08-13) — reconstructing 5 undocumented commits

Opened this session to find `git log` showing 5 commits
(`b750096`..`112f701`) implementing most of Phase 2 — cost tracking,
margins, purchase history, supplier comparison, restock flow, SMS auth,
Sentry, unit tests, security headers — none of which happened in this
conversation, and **none of which touched bug.md, process.md, or
implementation-plan.md**. (`ls -la` on the three handoff files showed
`bug.md`/`process.md` "modified" the same day as a `hand off/` folder
move, but diffing confirmed their *content* was untouched since Prompt
5 — the timestamp was just from being moved into the new folder.)

Rather than assume anything about what was built or how it was verified,
re-derived it directly from the code and from running verification fresh:

1. **Read the diff stats for all 5 commits** (`git show --stat` each) to
   get an inventory before reading any actual code — auth API routes
   (`request-otp`/`verify-otp`/`refresh`/`logout`), a `margins` API +
   page, `AuthFlow`/`PriceUpdateModal`/`ProfitabilityDashboard` components,
   `useAuth`/`useMarginCalculation` hooks, `lib/supabase.ts`,
   `middleware.ts`; then purchase-history/supplier API routes,
   `PurchaseHistoryDashboard`/`RestockModal`; then Vitest + 3 unit test
   files, a `/api/health` route, `lib/sentry.ts`, security headers in
   `next.config.ts`; then the actual `@sentry/nextjs` wiring
   (`instrumentation.ts`, `sentry.*.config.ts`); then a CSP fix for
   Sentry's US ingest domain.
2. **Read the root `README.md`** (242 lines, new — written as part of the
   "Phase 2: Final" commit) since it's the most complete existing
   description of what the build claims to do, then treated every claim
   in it as something to verify rather than trust — this is what
   surfaced the "Cloud sync — Live ✅" vs. zero-Supabase-anything
   discrepancy (see bug.md).
3. **Re-ran the full verification stack from a clean state**: `rm -rf
   node_modules && npm install`, `npm run build` (passes, one new
   deprecation warning — Next.js wants `proxy.ts` instead of
   `middleware.ts` in this version), `npm run lint` (**11 errors, 5
   warnings — clearly never run since Phase 2 started**, same failure
   mode as the Prompt 3/4 `OfflineIndicator` lint miss, just at 5x the
   commit count this time), `npm test` (Vitest — 43/43 pass, 3 files),
   `npm run test:e2e` (28 tests now, up from 17 — **8 failed**).
4. **Root-caused every one of the 8 E2E failures individually** rather
   than assuming they were pre-existing flakiness — each turned out to
   trace to one of a small number of real causes, all written up in
   bug.md: the auth gate blocking the whole app (and offline reload
   specifically wiping the session), the `+1` button silently becoming a
   "open Restock modal" button, an ambiguous `input[type="number"]`
   selector in 3 of the new Phase 2 tests caused by `ProductCard` keeping
   its own cost field always visible, and one genuine app bug
   (`RestockModal`'s "Quick +1" discarding already-typed supplier/cost
   data).
5. **Did not fix any of it yet.** This audit's job was to establish
   ground truth and document it accurately — see implementation-plan.md
   for the prioritized list, surfaced to the project owner for a decision
   on what to fix first rather than unilaterally rewriting a large amount
   of code from a different working session.

**No files changed in this section** — audit and documentation only.

## 19. Working through the §18 priority list (2026-08-14)

Fixed items 1, 2, 4, 5, 6, 7, 8 from implementation-plan.md's priority
list in order, re-verifying after each before moving to the next rather
than batching changes and hoping. Item 3 (Supabase) is blocked on the
project owner's account — asked them how they wanted to handle it; they'll
create the project and share credentials, at which point running the
already-written migration and setting env vars is a short follow-up.

**Auth gate (§18 Blocker) and the lint fixes were done together** since 3
of the 9 lint errors lived in the same files the gate fix touched anyway,
same reasoning bug.md already flagged. Full before/after code for each is
in bug.md's individual entries — this section covers *how* each was
verified, not what changed.

**A genuinely tricky one: `phase1-offline.spec.ts` kept failing after the
auth-gate fix**, with the same "product missing after offline reload"
symptom the original audit had (incorrectly) attributed entirely to the
auth gate. Chased this down properly rather than assuming the fix would
also happen to resolve it:
- Reproduced with a throwaway Playwright script mirroring the test's exact
  steps — confirmed the failure wasn't about auth at all (auth was already
  fixed by this point).
- Direct `window.__db` and raw `indexedDB.open()` checks at each step
  showed the underlying SQLite data was intact and correctly written.
- Temporarily instrumented `persist()`/`loadDatabase()` in
  `lib/sqlite-init.ts` with `Date.now()` timestamps (removed before
  committing) to see the actual event ordering — confirmed the app's own
  `await persist(db)` genuinely does complete before the test proceeds,
  but a `page.reload()` issued immediately after can still race the
  browser's actual IndexedDB commit in headless Chromium. Confirmed this
  empirically: adding *any* extra scheduling gap (even a synchronous
  `console.log`) between the write and the reload reliably prevented the
  failure, and removing it reliably reproduced it.
- Fixed at the test level with a deterministic wait — `page.waitForFunction`
  polling the actual IndexedDB entry until it's confirmed present, instead
  of a guessed fixed delay. Full writeup in bug.md.

**Two real product bugs were found while re-verifying, not while reading
code for the audit** — both fixed and logged in bug.md:
- The supplier-comparison `savingsPercent` formula was computing against
  the wrong baseline (most expensive instead of cheapest), so the "X% more
  expensive than cheapest" warning silently never appeared for the
  supplier it's meant to flag. Same bug existed in both the local SQLite
  query (`lib/transactions.ts`) and the server API route
  (`app/api/suppliers/[productId]/route.ts`) — fixed both.
- `phase2-auth.spec.ts` had two tests asserting the *old*, mandatory-login
  behavior the auth-gate fix deliberately removed — rewrote both to assert
  the corrected, opt-in behavior instead of just deleting them, since they
  still cover real regressions (e.g. logout should clear the session
  without navigating anywhere).

**Full suite verification, done properly rather than declared from a
single green run:**
- `npm run build` — clean.
- `npm run lint` — 0 errors, 0 warnings (down from 9 errors / 5 warnings).
- `npm test` (Vitest) — 43/43 pass.
- `npx playwright test` — 28/28 pass, but not reliably on the first few
  attempts: some runs showed 1-2 unrelated failures (an offline test, a
  logout test) that didn't reproduce when re-run alone. Chased this too
  rather than dismissing it as "flaky": running the same suite with
  `--workers=1` (this repo's own `playwright.config.ts` already caps
  workers to 1 on CI, specifically "for the runner's resource limits, not
  correctness") passed 28/28 reliably across multiple runs, while the
  local default (5 parallel workers on a 10-core machine, all hammering a
  single dev server) intermittently didn't. Concluded this is genuine
  local-machine resource contention from this session's unusually heavy
  repeated test invocations, not a real bug — CI already avoids the
  triggering condition by design.

**Files changed this session:** `app/page.tsx`, `app/margins/page.tsx`,
`app/auth/login/page.tsx`, `hooks/useAuth.ts`, `components/ProductCard.tsx`,
`components/RestockModal.tsx`, `components/ProfitabilityDashboard.tsx`,
`components/PurchaseHistoryDashboard.tsx`, `lib/sqlite-init.ts`,
`lib/transactions.ts`, `app/api/suppliers/[productId]/route.ts`,
`middleware.ts` → `proxy.ts` (renamed), `e2e/phase1-offline.spec.ts`,
`e2e/phase2-auth.spec.ts`, `e2e/phase2-history.spec.ts`, `README.md`, plus
the new `trackkit/supabase/migrations/001_init_schema.sql`.

## 20. Supabase provisioning, completed with the project owner (2026-08-14)

The project owner created a real Supabase project and shared its
credentials in stages: URL + publishable key first, then a pooler
connection string, then the DB password, then the service role key.

- **Direct DB connection failed first** — `db.zrhftcgvnlltisaurgoa.supabase.co`
  only has an IPv6 DNS record (`host db....supabase.co` returned an
  `AAAA` only, no `A` record), and this environment has no outbound IPv6
  route (`supabase db push --dry-run` against it failed with
  `hostname resolving error`). Supabase's **Session Pooler** connection
  string (`aws-0-eu-west-2.pooler.supabase.com`) resolves over IPv4 and
  worked — this is Supabase's own documented workaround for IPv4-only
  networks, not something specific to this sandbox.
- Ran `supabase db push --db-url "<pooler connection string with real password>" --dry-run`
  first to confirm connectivity before applying anything, then re-ran
  without `--dry-run`. `supabase migration list` afterward confirmed
  `001` applied both locally and remotely.
- **Verified the schema is actually live**, not just that the CLI
  reported success: queried `https://<project>.supabase.co/rest/v1/products`
  directly (via Node's `fetch`, since `curl` in this environment
  couldn't resolve the `*.supabase.co` REST host even though Node could
  — an unexplained but consistent asymmetry, worth knowing about if this
  comes up again) and got back `[]`, an empty-but-real table.
- Set all 3 env vars (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in both
  `.env.local` and Vercel (all 3 environments via `vercel env add`,
  invoked from the parent `Trackkit/` directory where `.vercel/project.json`
  actually lives — same gotcha as the earlier 404 fix in §17).
- **Found one more real gap while verifying end-to-end rather than
  stopping at "env vars are set":** `POST /api/auth/request-otp` against
  the live project returns `{"error":"Unsupported phone provider"}` —
  Supabase's phone OTP needs an SMS provider (Twilio/MessageBird/Vonage)
  configured in its dashboard, a separate prerequisite from the project
  itself existing. Flagged in bug.md and implementation-plan.md rather
  than left undiscovered; needs the project owner to set up a provider
  account, not resolvable from here.
- The DB password and the pooler connection string were used only
  transiently (CLI flags, shell history) — never written into any
  repository file or committed. Only the 3 documented env var names went
  into `.env.local`/Vercel.

## What's next

Only one thing is left across the entire priority list: **configure an
SMS provider in Supabase's dashboard** so phone OTP requests stop failing
with "Unsupported phone provider" — see §20 and implementation-plan.md §9.
Everything else, including the Supabase project/schema/env vars
themselves, is done and verified live.
