# Implementation Plan &amp; Status

Single place to see every plan that's driving this build, and honestly where
each piece actually stands. Status is based on what's verified working in
this repo right now, not what's merely written in a doc — see
[process.md](./process.md) for how each piece was verified.

---

## 1. The 3-phase product roadmap

Source: `../PRODUCT-OVERVIEW.md`. Full detail in `../PHASE-2-PROFIT.md` / `../PHASE-3-AI.md`.

| Phase | Goal | Revenue | Status |
|---|---|---|---|
| **1 — Know Your Stock** | Offline inventory tracking, low-stock alerts | Free | 🟡 In progress (this repo) |
| **2 — Know Your Profit** | Cost tracking, margins, cloud sync | ₦500/mo | ⬜ Not started — blocked on Phase 1 validation gate (see §4) |
| **3 — Make Smarter Decisions** | AI chat, demand trends, reorder hints | ₦1,500/mo | ⬜ Not started |

Per `DELIVERY-SUMMARY.md`: **do not skip ahead.** Phase 2 doesn't start until
Phase 1 is validated with real users against the metrics in §4.

---

## 2. Phase 1 build plan — the 5 prompts

Source: `../PROMPT-PACK-PHASE-1.md`. This is the actual sequence being followed.

| # | Prompt | Scope | Status |
|---|---|---|---|
| 1 | Project Setup &amp; SQLite Initialization | Next.js + TS + Tailwind scaffold, sql.js schema, `useLocalInventory` hook, Zustand store | ✅ Done |
| 2 | UI Components | ProductCard, ProductForm, Dashboard, LowStockAlert, ExportButton, tab-nav page | ✅ Done (Storybook stories explicitly marked optional in the pack — skipped) |
| 3 | Service Worker &amp; Offline-First Caching | `service-worker.js`, PWA manifest, offline indicator, installability | ✅ Done — 4 real bugs found and fixed along the way, see bug.md |
| 4 | E2E Tests &amp; Manual Test Suite | Playwright suite under `e2e/`, 90%+ flow coverage, CI-wired | ✅ Done — 17 tests, 2 real spec-compliance gaps found and fixed while writing them, GitHub Actions wired (unverified against real CI, no git remote here) |
| 5 | Deploy to Vercel &amp; GitHub Actions | Live URL, CI/CD pipeline | 🟡 Prep done, deploy itself blocked on accounts — see below |

**Bottom line:** Prompts 1–4 complete and verified in a real browser (not
just build/typecheck — see process.md §12–§13 for why that distinction
mattered here specifically, twice). Prompt 5's deploy-readiness work is
done; the deploy itself needs the project owner's GitHub/Vercel accounts,
which this environment has no access to (confirmed: no `gh`, no `vercel`
CLI, no git remote, no linked Vercel project).

### Prompt 5 acceptance criteria — detailed status

Asked the project owner how to handle the account-gated steps rather than
guessing (see process.md §14); they chose **prepare the files, defer the
account-linking runbook**. Status reflects that scope:

- ⬜ App deployed to Vercel public URL — blocked on account access
- ⬜ Vercel URL is live + accessible — blocked (no URL exists yet)
- ⬜ All Phase 1 features / offline / PWA installable work on live URL —
  can't verify against a URL that doesn't exist; all three verified
  thoroughly against the local production build in Prompts 3–4 already
- ✅ GitHub Actions workflow set up — `.github/workflows/deploy.yml`, using
  Vercel's own documented CLI-based deploy pattern (`vercel pull` → `vercel
  build` → `vercel deploy --prebuilt`), not a third-party action
- 🟡 "Tests auto-run on every push" — true for the workflow as written
  (push to `main` triggers the `test` job first), but unverified against
  real GitHub Actions for the same reason as Prompt 4's CI (no remote here)
- ⬜ "Auto-deploy to Vercel on test pass" — the workflow is wired for this
  (`deploy` job `needs: test`), but will fail at `vercel pull` until
  `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` repo secrets exist,
  which requires the account-linking step that was explicitly deferred

**What's actually done:** `package.json` got an `engines` field
(`>=20.9.0`, matching Next 16's own declared floor) so Vercel's Node
version selection isn't ambiguous; `deploy.yml` is written and YAML-valid;
`e2e.yml`'s trigger was narrowed to `pull_request` only so it doesn't
duplicate `deploy.yml`'s own test gate on every push to main; a clean
`npm ci` + `npm run build` + full `npm run test:e2e` (17/17) all re-confirm
the repo builds and passes exactly as CI would run it. Full detail in
process.md §14.

### Prompt 4 acceptance criteria — detailed status

- ✅ All E2E tests pass: `npm run test:e2e` — 17/17, run twice to rule out
  flakiness (offline test has timing-sensitive bits)
- 🟡 "Coverage: 90%+ of user flows tested" — all 5 user stories and their
  listed sub-cases have tests; not a literal code-coverage percentage, since
  there's no unit test runner in this project to compute one from (see
  process.md §13 — the prompt pack's criterion conflates E2E flow coverage
  with a `--coverage` code-coverage command that has nothing to run against)
- ✅ Tests include online + offline modes — `phase1-offline.spec.ts`
- ✅ Tests verify data persistence — every spec file reloads and re-asserts
  at least once
- ✅ Tests verify validation — `phase1-add-product.spec.ts` (with an honest
  note on the one validation branch — empty `unit` — that the UI as built
  can't actually produce, since it's a `<select>` that always has a value)
- ✅ All user stories from `PHASE-1-MVP.md` have tests — one spec file per
  story, matching the prompt's exact naming
- ✅ Tests run in CI/CD (GitHub Actions) — `.github/workflows/e2e.yml`
  written per Playwright's documented CI recipe; **could not be verified
  against real GitHub Actions** (no `git remote` configured, `gh` not
  installed in this environment) — "written correctly" and "confirmed
  running on GitHub's infrastructure" are different claims, only the first
  is true here

### Prompt 3 acceptance criteria — detailed status

- ✅ Service Worker registers without errors — was silently broken (never
  actually registered), fixed; now verified via `getRegistration()` in a real
  browser
- ✅ All static assets cached on first visit — precache list (`/`,
  `/manifest.json`, `/sql-wasm-browser.wasm`, both icons) plus every
  same-origin GET gets runtime-cached; confirmed via Cache Storage inspection
  showing all `_next/static/chunks/*.js` picked up after one visit
- ✅ App works offline (reload while offline) — verified via
  `context.setOffline(true)` + `page.reload()` against the production build
- ✅ Offline mode: view/edit products — SQLite/IndexedDB never depended on
  network anyway; confirmed a brand-new product could be added while fully
  offline and persisted after going back online + reloading
- ✅ Offline mode: +/− buttons work — verified
- ✅ Offline mode: changes persist when going back online — verified (added
  a product while offline, went back online, reloaded, it was still there)
- ✅ PWA installable — verified via Chrome's own `Page.getInstallabilityErrors`
  CDP check (`{ installabilityErrors: [] }`); real device "Add to Home
  Screen" walkthrough not performed (no physical Android/iOS device in this
  environment)
- ✅ Offline indicator shows when disconnected — required a real fix
  (`navigator.onLine` alone is unreliable after a SW-served offline reload;
  see bug.md), now grounded in the SW's own observed fetch failures too
- 🟡 "Tests pass: Service Worker registration" — no committed automated test
  (that's Prompt 4's job); verified manually via real-browser Playwright
  scripts each session instead, consistent with how Prompts 1–2 were verified
- 🟡 "Manifest valid, Lighthouse PWA score 90+" — manifest confirmed valid
  JSON and installable; **the Lighthouse PWA score itself no longer exists**
  in the installed Lighthouse version (12.8.2 — Google removed that category
  around v10). Substituted the CDP installability check above, which is the
  more current equivalent. A real, unrelated accessibility finding
  (`maximumScale: 1` blocking pinch-zoom) turned up in the same Lighthouse
  pass and was fixed regardless.

---

## 3. Phase 1 acceptance criteria — detailed status

Source: `../PHASE-1-MVP.md` user stories. ✅ = implemented and verified, 🟡 = implemented but not fully verified against the exact criterion, ⬜ = not built.

### User Story 1 — Add Product
- ✅ "+ Add Product" opens a modal (`components/ProductForm.tsx`)
- ✅ Form fields: name, category, quantity, unit, low-stock threshold, selling price
- ✅ Validates name + unit required, quantity ≥ 0
- ✅ Persists to SQLite, survives reload (verified — see process.md §9)
- 🟡 Success toast ("Noodles added to your inventory") — **not built**; form just closes on save
- ✅ Form clears / closes on submit

### User Story 2 — Quick Stock Adjustment
- ✅ Product card shows name, qty, unit, low-stock indicator
- ✅ Large +1 / −1 buttons, optimistic update via TanStack Query invalidation
- ✅ Qty can't go negative (`logTransaction` clamps at 0; −1 also `disabled` in UI at qty 0)
- ✅ Each adjustment logs a `transactions` row
- ✅ Opens the edit/detail view via a dedicated ✎ edit-icon button on the card (satisfies the spec's "long-presses... **or taps an edit icon**" — chose the icon over implementing a long-press gesture, which needs touch-hold timing/scroll-disambiguation and is a common source of mobile-web bugs for comparatively little discoverability gain)
- ⬜ Tap-and-hold to bulk-increment by 5/10 — only the dedicated low-stock row has +5/+10 buttons; the main ProductCard only does ±1
- ⬜ Haptic feedback — not built (low priority, needs a real device to test anyway)

### User Story 3 — Low-Stock Summary
- ✅ Dashboard shows total products, low-stock count, inventory value (or "TBD" if any product lacks a price)
- ✅ Low-stock items sorted by urgency (closest to 0 first) in `useInventoryStats`
- ✅ Inline +5/+10 quick-restock on each low-stock row
- ✅ **"Pinned at top of inventory list" fixed (2026-08-11)** — this was
  previously only true of the separate Dashboard summary section, not the
  actual Inventory tab list the spec means. Found while writing
  `phase1-low-stock.spec.ts`. `lib/product-utils.ts`'s `sortByLowStockFirst`
  now sorts `InventoryTab`'s product grid; verified by test.
- ⬜ "Days to stock-out" — explicitly Phase 2 (needs sales velocity), correctly deferred

### User Story 4 — Edit Product
- ✅ `ProductForm` supports edit mode (pre-filled, same validation, PATCH via `updateProduct`)
- ✅ Delete with confirmation ("This will delete all history. Sure?"), soft-delete via `deleted_at`
- ✅ **Entry point fixed (2026-08-11)** — `InventoryTab` (`app/page.tsx`) now reads `selectedProductId` from the store, resolves it against the loaded product list, and renders `ProductForm` in edit mode when set. Verified end-to-end in a real browser: tap ✎ → form opens pre-filled → edit name → save → card updates → modal closes. See [bug.md](./bug.md) for the related persistence fix.
- ⬜ Creation/last-modified date display in the edit modal — not built

### User Story 5 — Manual Data Export
- ✅ Settings tab → "Export Data to CSV" button
- ✅ CSV format matches spec exactly (header, shop name, timestamp, columns) — `lib/csv-export.ts`
- ✅ Client-side only, no login, verified download works
- ✅ **Transaction history added to export (2026-08-11)** — the CSV
  previously only contained the product snapshot; `PROMPT-PACK-PHASE-1.md`'s
  Prompt 4 acceptance criteria requires "products + transactions," which
  wasn't satisfiable until this was built. `buildInventoryCsv` now appends a
  Transaction History section; verified in `phase1-export.spec.ts` by
  parsing both sections back out and checking columns/row counts.
- ⬜ Explicit "keep as backup, re-importable in Phase 2+" instructional copy — not added

### Cross-cutting
- ✅ Touch targets sized for mobile (48px+ buttons)
- ✅ Responsive at mobile viewport (verified at 390px width)
- ✅ **Offline-first service worker (2026-08-11)** — static assets + app
  shell cache after first visit; a subsequent fully-offline reload works.
  Note the honest caveat from process.md §12: this holds from the *second*
  visit on, since a hand-rolled worker (no next-pwa, see why in process.md)
  can't precache Next's content-hashed chunk filenames ahead of time — a
  completely cold visit with zero prior network access still can't work,
  which is inherent to any PWA regardless of tooling.
- ✅ **E2E test coverage (2026-08-11)** — 17 tests across 5 spec files under
  `e2e/`, one per user story, committed and CI-wired. No unit-test-level
  code coverage number (no Vitest in this project — see §3 Prompt 4
  criteria and process.md §13 for why that's a different, unmet claim from
  "flows are tested").

---

## 4. Phase 1 → Phase 2 gate (not yet applicable)

From `PHASE-1-MVP.md` — these require a real 10-woman test cohort and can't be
marked done from inside this repo:

- [ ] Retention ≥ 70% at 2-week mark
- [ ] Avg session duration ≥ 2 minutes
- [ ] Avg ≥ 10 transactions logged per user
- [ ] Zero data loss incidents
- [ ] NPS ≥ 45 (aim 50)

Don't start Phase 2 work until these are measured and pass.

---

## 5. Known gaps / follow-ups (not in the original prompt pack)

Found while building; not yet fixed:

1. ~~Edit-product entry point is dangling.~~ **Fixed 2026-08-11** — see User
   Story 4 above.
2. **Semantic design tokens exist but aren't adopted.** `public/styles/tokens.css`
   defines `--surface-canvas`, `--text-heading`, `--action-primary-bg`, etc.
   specifically so components could reference roles instead of raw colors —
   this would make a future dark-mode toggle in the live app trivial. Current
   components (`ProductCard.tsx`, `ProductForm.tsx`, etc.) still use the raw
   Tailwind classes (`bg-white`, `text-ink-black`) generated from the
   `@theme inline` block. Migrating them is a prerequisite for turning on
   in-app dark mode.
3. **Dark mode is design-system.html only.** The live app doesn't expose a
   theme toggle. `public/styles/tokens.css` has full dark values ready
   (`[data-theme="dark"]`), gap is purely component adoption (see #2) plus a
   toggle control + persistence in `lib/store.ts`.
4. ~~No PWA icons.~~ **Fixed 2026-08-11** — real 192px/512px PNGs generated
   (Storefront glyph on ink-black, matching the header logo badge), wired
   into the manifest with `"purpose": "any maskable"`.
5. ~~No committed E2E suite.~~ **Fixed 2026-08-11** — 17 tests under `e2e/`,
   see §2/§3 Prompt 4 status above.
6. **Semantic tokens still unmigrated (see #2/#3), now also relevant to the
   service worker.** `OfflineIndicator`/`UpdateBanner` use raw brand colors
   (`--color-ink-black`, `--color-link-blue`) directly rather than semantic
   tokens — fine today since the app is light-only, but will need
   revisiting alongside #2/#3 if dark mode ever gets wired into the live app.
7. **No unit test runner.** `PHASE-1-MVP.md`'s tech stack names Vitest for
   unit tests; it was never actually set up across Prompts 1–4, which only
   produced E2E-level browser verification. Not currently blocking anything
   (E2E coverage is solid — see Prompt 4 above), but `lib/product-utils.ts`,
   `lib/csv-export.ts`, and `lib/offline-store.ts`'s timer logic are exactly
   the kind of pure-function/small-module logic that's cheaper to unit test
   than to exercise only through a full browser E2E run.
8. **`.github/workflows/e2e.yml` is unverified against real CI.** No `git
   remote` configured in this repo, `gh` not installed here — the workflow
   file was written correctly per Playwright's documented recipe but has
   never actually run on GitHub's infrastructure. First push to a real
   GitHub remote should be watched closely rather than assumed to work.

---

## 6. Design-system / documentation work (additive, outside the prompt pack)

Not part of `PROMPT-PACK-PHASE-1.md`, done at the project owner's request
alongside it:

- `public/styles/tokens.css` — single source of truth for all design tokens, linked
  by both `app/globals.css` (live app) and `public/design-system.html` (static
  preview doc). Editing one file updates both.
- `public/design-system.html` — color/typography/spacing/radius/shadow token
  gallery + component gallery + live replicas of the real app components,
  with a working light/dark toggle. Dark values are an extrapolation beyond
  the source `family DESIGN (1).md` doc (which is light-only) — flagged
  inline in `tokens.css` and in the doc's footer, not presented as
  designer-approved.
- **Icon pack (2026-08-11):** `family DESIGN (1).md` specifies an icon style
  ("solid filled circles... mono-weight") but ships no actual icon set, so
  Phase 1's first pass used raw emoji (✎ ⚠️ 🔴 🟡 ✕) as placeholders — inconsistent
  rendering across platforms and not really "on brand." Replaced with
  [Phosphor Icons](https://phosphoricons.com) (MIT, free): `@phosphor-icons/react`
  in the live app (global `IconContext` default of `weight="bold"` for
  legibility on small screens — ties back to the spec's own "large,
  high-contrast" UI requirement for a low-tech-literacy audience), and the
  equivalent `@phosphor-icons/web` CDN font build on `design-system.html`
  with a new "Icons" section (weight comparison + full usage grid, one row
  per icon actually used in the app). Status icons (warnings) use `fill`
  weight instead of `bold` to read as alert state rather than outline.
- This file, [process.md](./process.md), and [bug.md](./bug.md) — the
  handoff docs this section lives in.

---

## 7. Next recommended step

Everything that can happen without the project owner's own accounts is
done. **The only remaining work in the entire Phase 1 sequence is the
account-gated part of Prompt 5:** create the GitHub repo, push, connect it
to Vercel, add the three `VERCEL_*` secrets, and let `deploy.yml` run for
real. Worth doing the GitHub-repo-and-push step first even before touching
Vercel — that gives the untested `e2e.yml`/`deploy.yml` workflows their
first real run somewhere lower-stakes than a production deploy, and any
YAML mistake surfaces on a test job failure rather than a broken live site.
Ask for the step-by-step runbook when ready — it was deliberately deferred
per the project owner's own choice this round, not skipped as an oversight.
