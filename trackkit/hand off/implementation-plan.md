# Implementation Plan &amp; Status

Single place to see every plan that's driving this build, and honestly where
each piece actually stands. Status is based on what's verified working in
this repo right now, not what's merely written in a doc, a README, or a past
commit message — see [process.md](./process.md) for how each piece was
verified, and [bug.md](./bug.md) for full writeups of every open issue
referenced below.

**Last full audit: 2026-08-13.** Everything under §5 (Phase 2) and the
infrastructure rows in §2 were reconstructed from reading the actual code
and re-running verification from scratch — 5 commits' worth of Phase 2 work
landed in this repo with no corresponding update to this file, so treat
anything dated before 2026-08-13 in this doc as Phase-1-only and everything
from that date as the first real look at Phase 2's actual state.

**2026-08-14: the priority list in §7 has been worked through.** Items 1, 2,
4, 5, 6, 7, 8 are done and verified (build + lint + 43 unit tests + 28 E2E
tests all green — see process.md §19). Item 3 (Supabase) has its migration
written and ready but provisioning the actual project is blocked on the
project owner's Supabase account — see §2 and §7.3.

**2026-08-14 (later): Phase 3 Task 1–6 (AI Chat) built** — see §10. Google
OAuth added as a secondary sign-in method, and Supabase itself was fully
provisioned (project created, migrations applied, all env vars live) in
between the above and this — see bug.md for both.

---

## 1. The 3-phase product roadmap

Source: `../PRODUCT-OVERVIEW.md`. Full detail in `../PHASE-2-PROFIT.md` / `../PHASE-3-AI.md`.

| Phase | Goal | Revenue | Status |
|---|---|---|---|
| **1 — Know Your Stock** | Offline inventory tracking, low-stock alerts | Free | ✅ Feature-complete, tested, deployed (see §3–4) |
| **2 — Know Your Profit** | Cost tracking, margins, cloud sync | ₦500/mo | 🟡 Code-complete-looking, **one Blocker bug, cloud half not provisioned** — see §5 |
| **3 — Make Smarter Decisions** | AI chat, demand trends, reorder hints | ₦1,500/mo | 🟡 AI chat built (§10); trend charts/forecasting/seasonality not started |

Per `DELIVERY-SUMMARY.md`, Phase 2 was only supposed to start after Phase 1
was validated with real users (§6's gate) — that validation never happened
(no user cohort data exists anywhere in this repo). Phase 2 got built
anyway. Not a reason to revert it, but worth knowing the gate was skipped
when deciding how much to trust "Phase 2 is basically done."

---

## 2. Infrastructure status

| Piece | Status |
|---|---|
| **GitHub** | ✅ `github.com/adedoyin899/Trackkit` — dedicated SSH deploy key, whole project (docs + app) merged into one repo, pushed. See process.md §15. |
| **Vercel** | 🟡 Connected and deploying (`trackkit-psi.vercel.app`) after fixing a Root Directory misconfiguration that caused a 404 — see process.md §17. SSO/login protection is still on (`ssoProtection: all_except_custom_domains`), by the project owner's explicit choice, not an oversight — means the live URL currently requires Vercel account access to view at all, separate from the app's own auth gate (§5). |
| **Supabase** | 🟡 Project provisioned, migration applied and verified live (`products`/etc. queryable via REST against the real DB), all 3 env vars set in `.env.local` + Vercel (all environments). Real phone OTP still needs an SMS provider (Twilio/MessageBird/Vonage) configured in Supabase's dashboard — `/api/auth/request-otp` returns `"Unsupported phone provider"` without one. **Temporary workaround live:** `OTP_BYPASS_CODE=123456` env var lets any phone number sign in with that fixed code (see bug.md for the full security tradeoff/mitigations) until a provider is set up. |
| **Sentry** | 🟡 SDK wired (`@sentry/nextjs`, `instrumentation.ts`, `sentry.*.config.ts`), `NEXT_PUBLIC_SENTRY_DSN` **is** set in Vercel (all environments) — this is the one Phase 2 cloud integration that actually looks live. Not personally verified (would need to trigger a real error and check the Sentry dashboard, which needs account access this environment doesn't have). |

---

## 3. Phase 1 build plan — the 5 prompts

Source: `../PROMPT-PACK-PHASE-1.md`.

| # | Prompt | Status |
|---|---|---|
| 1 | Project Setup &amp; SQLite Initialization | ✅ Done |
| 2 | UI Components | ✅ Done |
| 3 | Service Worker &amp; Offline-First Caching | ✅ Done — 4 bugs found and fixed, see bug.md |
| 4 | E2E Tests &amp; Manual Test Suite | ✅ Done — 17 tests written, 2 spec-compliance gaps found and fixed |
| 5 | Deploy to Vercel &amp; GitHub Actions | ✅ Done — see §2 |

**Resolved 2026-08-14:** the `+1` button now increments quantity directly
again, exactly like `-1` does, with a separate "Restock with details"
button below it opening the modal for supplier/cost logging. All 17
original Phase 1 tests pass again — see bug.md and process.md §19.

Full acceptance-criteria-level detail for Prompts 1–5 is unchanged from the
original build and omitted here for length — see git history of this file
(or ask) if you need the granular per-criterion breakdown that used to live
in this section.

---

## 4. Phase 1 acceptance criteria — still accurate at the feature level

Source: `../PHASE-1-MVP.md`. All 5 user stories (Add Product, Quick Stock
Adjustment, Low-Stock Summary, Edit Product, Manual Data Export) remain
implemented as originally verified — see process.md §1–14 for the full
build history. The one behavior change since is the `+1` button described
in §3 above; everything else (validation, persistence, low-stock pinning,
CSV export format, edit flow) is untouched by Phase 2's changes.

---

## 5. Phase 2 status — feature by feature

Source: `../PHASE-2-PROFIT.md`. Reconstructed 2026-08-13 by reading the
actual code (`git show --stat` on each commit, then the files themselves)
and re-running `npm run build`, `npm run lint`, `npm test` (Vitest), and
`npm run test:e2e` from a clean install — see process.md §18.

### Story 1 — Log Cost per Unit
✅ Built. `ProductCard.tsx` has an inline "Pricing & Margins" section with
a cost-per-unit input (`onBlur`/Enter to save via `updateProduct`).
`RestockModal.tsx` also captures cost-per-unit at restock time. Local
SQLite schema extended with `cost_per_unit`/`supplier` columns
(`lib/sqlite-init.ts`). Not verified: whether editing cost preserves old
transactions' historical cost per the spec ("Can update cost without
losing sale history") — `lib/transactions.ts` captures `price_per_unit`
per-transaction per the diff stat, but this wasn't traced end-to-end.

### Story 2 — Auto-Calculate Margin %
✅ Built and unit-tested. `hooks/useMarginCalculation.ts` +
`__tests__/useMarginCalculation.test.ts` (14 tests, passing). Color-coded
red/yellow/green margin badge on `ProductCard` and `ProfitabilityDashboard`
matches the spec's thresholds.

### Story 3 — Profitability Dashboard
✅ Built and clean (`components/ProfitabilityDashboard.tsx`, `/margins`
page, `/api/margins` route). The `Date.now()`/mutation lint errors and
`any` types are fixed — the impure `Date.now()` call now runs once via
`useState`'s lazy initializer, and the summary stats (`profitableCount`,
`marginSum`, etc.) are derived with a pure `reduce()` instead of mutating
`let` variables from inside `.map()`. No longer gated behind an auth wall
— see Story 6.

### Story 4 — Pricing Recommendation Engine
🟡 Partially built. `components/PriceUpdateModal.tsx` exists (210 lines
per the commit diff) but wasn't traced in detail during this audit — worth
a closer look before calling this "done." Not covered by any E2E test
(`phase2-profit.spec.ts` covers margin display + a price update, not
specifically the recommendation-suggestion flow described in the spec's
Story 4 UI mockup).

### Story 5 — Purchase History & Cost Tracking
✅ Built (`PurchaseHistoryDashboard.tsx`, `/purchase-history` page,
`/api/purchase-history`, `/api/suppliers/[productId]`). The "Quick +1"
discard bug is fixed — it now includes whatever supplier/cost the user has
already typed instead of throwing it away. Also found and fixed during
this pass: the supplier-comparison "savingsPercent" math was backwards —
it computed each supplier's price against the *most expensive* supplier
(so the most-expensive supplier's own row always showed 0% instead of the
"X% more expensive" notice); it now correctly compares against the
*cheapest* supplier's price. Fixed in both `lib/transactions.ts` (local
SQLite) and `app/api/suppliers/[productId]/route.ts` (server), which had
the identical bug. Caught by re-running the E2E suite, not by inspection —
see process.md §19.

### Story 6 — Cloud Sync & Multi-Device
🟡 **Blocker resolved.** Auth is now opt-in exactly per the original spec:
- `app/page.tsx` no longer gates the app behind a logged-in user — every
  tab works from local SQLite with no session at all. Settings shows a
  "Sign in to cloud backup" prompt instead of forcing a redirect.
- `useAuth`'s refresh effect now only fires if a cached session actually
  exists, and only clears it on an explicit 401 — network failures or
  server errors while offline no longer sign anyone out of their own local
  data.
- `ProfitabilityDashboard`'s optional `/api/margins` call is gated on
  `Boolean(user)` so anonymous visits don't throw a guaranteed 401.
- Auth API routes (`/api/auth/request-otp`, `/verify-otp`, `/refresh`,
  `/logout`) are unchanged and still pass `phase2-auth.spec.ts` (now
  rewritten to assert the *correct*, opt-in behavior instead of the old
  mandatory-login one).
- **Now provisioned (§2):** the real Supabase project exists, schema is
  migrated, and `lib/supabase.ts` talks to the real project (not a
  placeholder) in both `.env.local` and Vercel. `/api/health` confirms
  reachability. **Not yet fully live:** phone OTP requests fail with
  "Unsupported phone provider" until an SMS provider is configured in
  Supabase's dashboard — see §2 and bug.md.
- **Google OAuth added as a secondary sign-in method, live 2026-08-14.** A
  "Continue with Google" button sits above the phone form in
  `AuthFlow.tsx`. Full flow verified working end to end through Supabase's
  side: clicking it now lands on Google's real sign-in page with the
  correct Client ID and Supabase callback URI (previously returned
  "provider is not enabled" until the project owner created the Google
  Cloud OAuth credentials and enabled the provider in Supabase's
  dashboard). Nobody has completed a full sign-in yet since that needs a
  real person authorizing with their own Google account, but every hop in
  the pipe is confirmed correctly connected. Migration
  `002_add_google_auth.sql` (applied) made `phone_number` nullable and
  added `auth_provider` + a uniqueness constraint on the pre-existing
  `email` column, since Google accounts won't have a phone number.

### Cross-cutting Phase 2 findings
- **Vitest:** 43/43 unit tests pass across 3 files (`productUtils`,
  `supplierStats`, `useMarginCalculation`).
- **Lint: clean.** All 9 errors + 5 warnings from the 2026-08-13 audit are
  fixed — impure `Date.now()` calls (3 sites) now use `useState`'s lazy
  initializer, the `marginSum`/`profitableCount` post-render mutation in
  `ProfitabilityDashboard` was refactored to a pure `reduce()`, the 4
  `no-explicit-any` errors got a proper `DisplayProduct` type, the
  `setState`-in-effect on the login page's mount-detection was replaced
  with a `useSyncExternalStore`-based `useMounted()` hook, and the 3
  unused catch-block bindings in `sqlite-init.ts` were dropped.
- **E2E: 28/28 pass** (verified with `--workers=1`, matching CI's actual
  serial config — see process.md §19 for why local parallel runs showed
  occasional unrelated flakiness that CI won't hit).
- Security headers in `next.config.ts` — not individually re-audited this
  pass.
- `middleware.ts` → `proxy.ts` — renamed, deprecation warning gone.

---

## 6. Phase 1 → Phase 2 gate (retroactively — was skipped)

From `PHASE-1-MVP.md` — these were supposed to gate the start of Phase 2
and never got measured:

- [ ] Retention ≥ 70% at 2-week mark
- [ ] Avg session duration ≥ 2 minutes
- [ ] Avg ≥ 10 transactions logged per user
- [ ] Zero data loss incidents
- [ ] NPS ≥ 45 (aim 50)

Not blocking anything at this point since Phase 2 is already built — noted
for the record, and because `PHASE-2-PROFIT.md`'s *own* success metrics
section repeats a similar gate for Phase 3 ("Go/No-Go Gateway (from Phase
1)"). Worth deciding explicitly whether to keep enforcing these gates
going forward or treat them as superseded.

---

## 7. Priority action list

Ordered by actual severity/blast-radius, not by how they were discovered.
**Status as of 2026-08-14:**

1. ✅ **Fix the auth gate** (bug.md, Blocker) — done, see Story 6 above.
2. ✅ **Restore direct `+1` tap** on `ProductCard`, with a separate
   "Restock with details" affordance for the modal flow — done.
3. 🟡 **Provision Supabase** — done. Project created by the owner,
   migration applied against the real database via the Session Pooler
   connection (the direct `db.*.supabase.co` host is IPv6-only and
   unreachable from this environment; the pooler host resolves over IPv4
   and worked), all 3 env vars set in `.env.local` and Vercel, verified
   live via a direct REST query. **Left over:** SMS provider not
   configured in Supabase Auth, so phone OTP requests fail with
   "Unsupported phone provider" — needs the owner to add a Twilio/
   MessageBird/Vonage account under Project Settings → Auth → Phone Auth.
4. ✅ **Fix the lint errors/warnings** — done, 0 errors/0 warnings.
5. ✅ **Fix `RestockModal`'s Quick +1** discarding supplier/cost data —
   done.
6. ✅ **Fix the 3 ambiguous-selector E2E tests** — done, scoped via a new
   `role="dialog"` on `RestockModal` instead of loose `input[type="number"]`
   selectors that collided with `ProductCard`'s own always-visible cost
   input.
7. ✅ **Correct README's "Cloud sync — Live ✅"** claim — done, now
   explicitly says "built, not yet connected" with a pointer to the env
   vars needed.
8. ✅ **Rename `middleware.ts` → `proxy.ts`** — done.
9. ⚪ Everything carried over from the original Phase 1 known-gaps list
   (semantic design tokens unmigrated, dark mode not wired into the live
   app, GitHub Actions CI unverified against a real run) — none of these
   got worse, none are urgent, full detail was in this file's previous
   revision if needed.

---

## 8. Design-system / documentation work (additive, outside the prompt pack)

Unchanged from the original Phase 1 build — `public/styles/tokens.css` +
`public/design-system.html` remain the single source of truth for design
tokens, linked by both the live app and the static preview page. The
Phase 2 UI (margin badges, restock modal, purchase history dashboard) was
**not** built against this token system — it uses ad hoc Tailwind
utilities and inline color values (e.g. `text-blue-600` in `ProductCard`'s
margin preview, which isn't a token in `tokens.css` at all). Worth deciding
whether to bring Phase 2 UI into the token system or treat the two as
intentionally separate design languages.

---

## 9. Next recommended step

Every item on the priority list is done except one: **configure an SMS
provider (Twilio, MessageBird, or Vonage) in Supabase → Project Settings →
Auth → Phone Auth**, so `POST /api/auth/request-otp` stops returning
"Unsupported phone provider." That needs the project owner to sign up
with a provider and enter its credentials in the Supabase dashboard —
not something completable from this environment. Once that's done, a real
end-to-end OTP round-trip (not just the mocked E2E session) should be
tried against the live app to confirm the whole auth flow works, not just
each piece in isolation.

**In the meantime**, `OTP_BYPASS_CODE=123456` lets the app be used
end-to-end (any phone number + that fixed code) without a real SMS
provider — see bug.md for exactly what it does and does not cover, and
remove it (from `.env.local` and all 3 Vercel environments) once a real
provider is live.

---

## 10. Phase 3 — AI Chat (Task 1–6 of the Phase 3 prompt pack)

Source: `../PHASE-3-AI.md` Story 1. Built 2026-08-14. **Note the spec's own
gate:** "Only start Phase 3 if Phase 2 achieves 60%+ retention, 15%+ paid
conversion" — that gate hasn't been measured (no real user cohort exists
yet), same situation as the Phase 1→2 gate in §6. Built anyway per the
project owner's direction; flagging for the same reason as §6, not as a
blocker.

**What's built and verified:**
- `app/api/ai/chat/route.ts` — POST endpoint, requires a session (see
  "Auth requirement" below), checks `ai_cache` for a hit before calling
  Claude, calls `claude-3-5-sonnet-20241022` via `@anthropic-ai/sdk` on a
  miss, caches successful responses for 7 days.
- `components/AIChat.tsx` + `hooks/useAIChat.ts` + `lib/chat-store.ts` —
  chat UI (message bubbles, suggested-prompt chips, loading state, clear
  history), backed by a dedicated Zustand store persisted to localStorage.
- New "AI" tab in the bottom nav, gated behind sign-in with a
  "Sign in to ask questions..." prompt when signed out.
- `supabase/migrations/003_add_ai_cache.sql` (applied) — the `ai_cache`
  table from the spec, RLS enabled.
- `e2e/phase3-ai-chat.spec.ts` — 6 tests covering the sign-in gate, empty
  state, sending a message (optimistic UI + response), suggested-prompt
  clicks, error handling, and history persistence/clearing. All mock
  `/api/ai/chat` at the browser level rather than the real Claude call —
  see the file's header comment for why (Playwright can't intercept the
  Next.js server's own outbound HTTPS calls, only what the browser does).
- Manually verified end-to-end against the real route (no mocking) with
  no `ANTHROPIC_API_KEY` set: signed-out → sign-in prompt; signed-in →
  empty state with prompts; sending a message → graceful "AI Assistant
  isn't set up yet" fallback, exactly the designed behavior for a missing
  key, not a crash.

**Three deliberate deviations from the literal Phase 3 prompt, each with a
concrete reason:**
1. **Routes live at `app/api/ai/chat/route.ts`, not `pages/api/ai/chat.ts`**
   — this project uses the App Router throughout; there is no `pages/`
   directory.
2. **The backend never queries Supabase for the user's products/transactions.**
   The real data lives in local SQLite — Supabase's `products`/
   `transactions` tables aren't populated (no sync engine pushes to them
   yet). A server-side query would return nothing for almost every user.
   Instead `lib/ai-context.ts` builds a compact summary client-side and
   sends it in the request body — which is what the spec's own "Technical
   Notes" already said to do ("Send to `/api/ai/chat` with context
   (user's data)"), just made explicit.
3. **AI chat requires sign-in; the rest of the app doesn't.** This is not
   a re-introduction of the auth-gate Blocker from §7.1/bug.md — that bug
   was about *offline-first core features* (inventory, margins) being
   wrongly locked. AI chat is inherently cloud-only (a live Claude call,
   real per-message cost, explicitly the new paid tier per the spec) and
   can never work offline regardless of auth, so gating just this one tab
   is a different, defensible call, not the same mistake.

**Not built from the full Phase 3 spec — intentionally out of scope for
this prompt's 6 tasks, left for the "next: trend visualization" work the
project owner flagged:** Story 2–6 (demand trends, reorder timing,
seasonality, margin optimization, supplier procurement), the
`analytics_daily`/`analytics_seasonal` tables, and the response's `sources`/
`suggestions` structured fields from the spec's example JSON (kept the
response to plain prose + a confidence score — asking Claude to reliably
emit a second structured field on every call adds fragility for a v1
feature without a clear payoff yet).

**What's needed from the project owner, not completable from this
environment:** an Anthropic API key
([console.anthropic.com](https://console.anthropic.com) → API Keys),
set as `ANTHROPIC_API_KEY` in `.env.local` and Vercel (server-side only,
no `NEXT_PUBLIC_` prefix). Until then, `/api/ai/chat` returns the
"isn't set up yet" fallback rather than erroring — verified, not assumed.

---

## 11. Phase 3 — Sales Trends (Story 2, "trend visualization")

Source: `../PHASE-3-AI.md` Story 2. Built 2026-08-14, same session as §10,
same Phase 3 gate caveat applies (not measured, built anyway per
direction). This prompt arrived truncated mid-Task-3 (cut off right after
"Example:", no Task 4–6 or acceptance criteria) — proceeded on the
strength of Tasks 1–3 plus PHASE-3-AI.md's Story 2 for the rest, rather
than waiting, and flagged the truncation at the time.

**What's built and verified:**
- New "Trends" tab (7th tab in the bottom nav — checked at a 390px mobile
  viewport that it doesn't crowd; labels stay legible). Unlike AI chat,
  this does **not** require sign-in — it's pure local computation, no
  cloud dependency, consistent with Margins/History.
- `lib/analytics.ts`'s `computeTrends()` — daily (week/month) or weekly
  (quarter) buckets, revenue/profit computed **per-transaction** using
  each sale's own product's current price (not a single shared price —
  see the bug below), plus a simple linear-regression forecast with a
  confidence score gated on having enough data points.
- `components/SalesChart.tsx` — a Recharts line chart (quantity/revenue/
  profit toggle, matching PHASE-3-AI.md's blue/green/orange color coding),
  `components/TrendsView.tsx` — the tab itself (product selector, period
  buttons, metric toggle, summary cards, forecast text).
- `e2e/phase3-trends.spec.ts` — 4 tests: works signed-out, real sales
  data flows through to the chart/summary correctly, product filter
  works, period/metric toggle buttons work.

**One real bug found and fixed during manual verification, not by
inspection:** the first pass computed revenue/profit using a single
`product` variable that was `null` whenever no specific product was
selected (the default "All Products" view) — so Revenue showed **₦0**
even with real sales recorded, silently, no error. Caught by actually
looking at the rendered numbers in a browser rather than trusting the
code read. Fixed by looking up each transaction's own product for its
price/margin rather than one shared value, and confirmed the corrected
math (4 units × ₦800 = ₦3,200 revenue, × ₦100 margin = ₦400 profit) in
both the "All Products" and single-product views.

**Same architectural deviation as §10, for the same reason:** the spec
calls for a server-side `analytics_daily` materialized view refreshed by
a nightly cron job (`pages/api/admin/refresh-analytics.ts` in the
prompt). Skipped entirely — there's no server-side transaction data to
aggregate (Supabase's tables aren't populated, no sync engine), and a
market trader's local transaction volume (hundreds to low-thousands of
rows) is fast enough to aggregate on demand in the browser. Nothing to
pre-compute or cache.

**Not built — out of scope for this prompt:** Story 3–6 (reorder timing,
seasonality, margin optimization, supplier procurement) and the
`analytics_daily`/`analytics_seasonal` tables themselves (no code reads
or writes them, so they were never created).
