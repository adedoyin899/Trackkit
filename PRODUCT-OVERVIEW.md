# MarketMate — Complete Product Vision
## An Offline-First Inventory & Profit Intelligence Platform for Market Women

**Document:** PRODUCT-OVERVIEW.md  
**Audience:** Everyone (product, engineering, design, stakeholders)  
**Read time:** 10 minutes  
**Last updated:** 2026-08-11  

---

## Executive Summary

MarketMate is a mobile-first PWA designed for informal market traders in West Africa (Nigeria, Ghana, Ivory Coast, Senegal, etc.). It solves a real pain: market women lose ₦500k–₦1M annually from forgotten stock-outs, overbuying unprofitable goods, and operating from memory instead of data.

**Core thesis:** Offline-first architecture is the differentiator. In markets with unreliable internet, a tool that works without connection *and* syncs intelligently to the cloud is uniquely valuable.

**Business model:** Freemium. Phase 1 (inventory) is free forever. Phase 2 (cost tracking + margins) and Phase 3 (AI insights) unlock at ₦500–₦1,500/month tiers.

**Target user:** Market women, age 25–55, selling fast-moving consumer goods (FMCG: noodles, milk, sugar, spices, flour). No formal training in inventory management. Increasing smartphone adoption (especially 18–40 cohort). Willingness to pay if ROI is clear (saves ₦50k+/month).

**Market size:** 2M+ traders in West Africa; conservative TAM at 10% adoption + ₦1,000/month average = ₦200M+ ARR.

---

## The Problem

### Quantified Pain

Market women operate on intuition + paper + memory:

| **Loss Driver** | **Monthly Impact** | **Annual Cost per Trader** |
|---|---|---|
| Forgotten restocks (stock-outs on best sellers) | ₦5–15k | ₦60–180k |
| Overbuying slow-moving items | ₦3–8k | ₦36–96k |
| Pricing guesses (selling below cost) | ₦2–5k | ₦24–60k |
| Paper lists lost or illegible | ₦2–3k | ₦24–36k |
| **Total annual bleed** | **₦12–31k/month** | **₦144–372k/year** |

*(Conservative estimate. High-volume traders lose ₦500k+/year)*

### Why existing tools fail

- **Zoho Inventory, Odoo:** Cloud-dependent, ₦5k+/month, enterprise workflows, requires training
- **Square POS:** Designed for formal retail with electricity; doesn't work in informal markets
- **Local clones / Excel:** Basic stock tracking only; no cost analysis, no intelligence
- **Paper + memory:** 95% of market women default here; it fails under pressure

### Why offline-first matters

Market women operate in environments where:
- Mobile internet is **expensive** (₦50–200/MB)
- Coverage is **unreliable** (dead zones, congestion during peak hours)
- Their workflow is **time-pressured** (need to adjust stock *instantly* during sales)

A tool that requires internet for every sale/restock/lookup is **not viable for them**. Offline-first is not a luxury—it's table stakes.

---

## The Solution: MarketMate (Three Phases)

### Phase 1: Know Your Stock (MVP — 6–8 weeks)
**Goal:** Eliminate forgotten stock-outs and stock-level guessing.

**Core features:**
- Add/manage products (name, category, quantity, unit, low-stock alert threshold)
- Quick stock adjustments (+/− buttons for rapid sales/restocks)
- Selling price per unit (for Phase 2 margin calculation)
- Low-stock alerts (dashboard + visual warnings)
- Works completely offline (PWA + local SQLite)
- Optional manual data export (CSV)

**Success metric:** 80% of test group (10 market women) uses app 5+ days/week for 4+ weeks.

**Revenue:** Free tier only. Establishes habit, validates core UX.

---

### Phase 2: Know Your Profit (6–8 weeks, post-Phase-1)
**Goal:** Show which products are actually profitable; help traders reprice losers.

**New features:**
- Cost per unit tracking (what she paid the supplier)
- Auto-margin calculation (% profit per product)
- Purchase history (date, cost, quantity bought)
- Margin comparison (side-by-side: cost vs. selling price)
- Simple dashboard (total inventory value, margin %, low-stock summary)

**Example insight:** "Sugar: you paid ₦50/bag, selling at ₦60. Margin = 20%. If you sold 15 bags this week, profit = ₦150. But milk: you paid ₦800, selling at ₦810. Margin = 1.25%. You're losing money on this."

**Success metric:** 15%+ conversion to ₦500/month paid tier. Users identify ≥1 repriced product based on margin data. Retention > 60% at 30 days.

**Revenue:** ₦500/month for cost tracking + margins + dashboard.

---

### Phase 3: Make Smarter Decisions (8–12 weeks, parallel dev with Phase 2)
**Goal:** AI assistant that asks questions about stock, trends, and recommendations.

**New features:**
- AI chat ("How much milk sold this week?" → "24 tins at 1.5/tin average margin.")
- Demand trends (visual charts: weekly/monthly sales by product)
- Reorder timing hints ("At this week's pace, sugar stock runs out Tuesday")
- Supplier price comparison (track best deal per product over time)
- Bulk purchase hints ("Cocoa milk is consistently profitable; buy in bulk Fridays")

**Example:** Market woman asks, "Should I restock milk before Saturday?" AI says: "You've sold 12 tins this week. Saturday typically sees 3x velocity. You have 5 tins left. Recommend restocking Friday morning to avoid Saturday stock-out."

**Success metric:** 40%+ of users interact with AI chat monthly. Users credit AI insights with ≥1 buying decision. Retention +10% post-launch.

**Revenue:** ₦1,500/month for AI features + trend charts + predictive hints.

---

## User Journey

### Phase 1 (Baseline)
```
Day 1:  Market woman downloads app, opens it offline.
        - Adds 5 products (noodles, milk, sugar, flour, spices)
        - Sets low-stock alert: milk = 3 tins

Day 2:  Market opens. First customer buys 1 carton noodles.
        - Taps noodles → quantity goes 10 → 9 (one tap, no thinking)
        - Continues selling, tapping as she goes
        - End of day: app shows "milk at 4 tins, sugar at 12 bags, noodles at 7 cartons"
        - No paper list. No guessing. No forgotten count.

Week 1: She hasn't done a restock yet. App shows noodles at 7 (still healthy).
        She sees milk at 4 (close to alert = 3). She buys 10 tins from supplier.
        Opens app, taps "Restock milk" → adds 10 → milk now at 14.

Week 2: She checks app in the morning: "Sugar at 12, milk at 8, noodles at 3, 
        flour at 5." Sees noodles are low (alert would be ~5). Decides to restock
        noodles this week. App helps her plan the week.
```

### Phase 2 (Post-validation)
```
Week 3: She's paid ₦1,500 for Phase 2 upgrade.
        App now shows margins:
        - Noodles: bought ₦80/carton, sells ₦120 → ₦40 margin (50%)
        - Milk: bought ₦800/tin, sells ₦810 → ₦10 margin (1.25%) ⚠️
        - Sugar: bought ₦50/bag, sells ₦75 → ₦25 margin (50%)
        
        Sees milk is a margin killer. Considers repricing to ₦850 (56% margin).
        Tests new price Thursday–Friday: demand holds, profit jumps 5x.
        
        App shows: "Milk margin improved 45% this week."
```

### Phase 3 (Intelligence)
```
Week 4: AI feature unlocked (₦1,500/month).
        She asks: "What should I restock before the weekend?"
        
        AI: "Cocoa milk sold 22 units last week, margin 35%. Saturday you typically
            see 3x velocity. Recommend 30 tins by Friday 5pm. Sugar is slower;
            hold this week."
        
        She restocks cocoa milk, hits a busy Saturday, sells out at peak margin.
        "This app just made me an extra ₦3k this week," she thinks.
```

---

## Architecture at a Glance

**Offline-first is the foundation:**
1. **Phone:** SQLite + React (all data local, encrypted)
2. **Service Worker:** Queues mutations when offline, syncs when connection returns
3. **Cloud (optional):** PostgreSQL + Next.js API, reconciles conflicts, stores audit trail
4. **Sync strategy:** Conflict-free reconciliation (last-write-wins + timestamp checks)

**Why two-tier?**
- Phase 1 users never need cloud. Data stays on phone. Privacy ✅
- Phase 2+ users opt into cloud sync for backup + cross-device access
- No pressure to authenticate upfront. Habit first, cloud second.

---

## Competitive Positioning

| **Attribute** | **MarketMate** | **Zoho Inventory** | **Square** | **Paper** |
|---|---|---|---|---|
| **Offline-first** | ✅ Core | ❌ Cloud-only | ❌ Cloud-only | ✅ Works |
| **Low price** | ₦0–1,500/mo | ₦5k+/mo | ₦3k+/mo | ₦0 |
| **No login needed (Phase 1)** | ✅ Yes | ❌ Requires account | ❌ Requires account | ✅ Yes |
| **Margin analysis** | ✅ Phase 2 | ✅ Yes | ✅ Yes | ❌ No |
| **AI insights** | ✅ Phase 3 | ❌ No | ❌ No | ❌ No |
| **Market context** | ✅ Built for her | ❌ For enterprises | ❌ For formal retail | ✅ Familiar |

**Moat:** Execution + market intimacy. We're not trying to be Zoho-lite. We're building for *her*, not adapting enterprise software.

---

## Business Model & Monetization

### Freemium Tiers

| **Tier** | **Price** | **Features** | **Target User** |
|---|---|---|---|
| **Free (Phase 1)** | ₦0 | Inventory, low-stock alerts, offline | Early adopters, habit builders |
| **Paid (Phase 2)** | ₦500/mo | Cost tracking, margin calc, dashboard | High-volume traders, profit-focused |
| **Premium (Phase 3)** | ₦1,500/mo | AI chat, trend charts, reorder hints | Ambitious traders, scale-focused |

### Financial Model (Year 1 Conservative)

**Assumptions:**
- Month 1–3: 10 free users (test group)
- Month 4–6: 50 users (50% free, 50% Phase 2 trial)
- Month 7–12: 500 users (70% free, 20% Phase 2, 10% Phase 3)

| **Metric** | **Month 6** | **Month 12** | **Year 1 Total** |
|---|---|---|---|
| **Free users** | 25 | 350 | $0 |
| **Paid users (Phase 2)** | 20 | 100 | ₦300k |
| **Premium users (Phase 3)** | 5 | 50 | ₦900k |
| **MRR** | ₦10k | ₦125k | ~₦60k avg |
| **ARR run rate** | ₦120k | ₦1.5M | — |

**Cost structure (Year 1):**
- Vercel: ₦10–50k/mo
- Supabase: ₦25–100k/mo (cloud storage, auth, RLS)
- SMS/WhatsApp auth (Phase 2+): ₦50–200k/mo at scale
- **Total COGS:** ₦100–300k/mo at 500 users

**Unit economics:**
- Average revenue per user (blended): ₦600/mo
- LTV (assuming 12-month retention): ₦7,200
- CAC (organic, Telegram + word-of-mouth): ₦500–1,000
- LTV/CAC ratio: 7–14x ✅ (healthy)

---

## Success Metrics (By Phase)

### Phase 1: Know Your Stock
- **Primary:** 80% of test users (10 market women) use app 5+ days/week for 4+ weeks
- **Secondary:** 0 data loss incidents (robust offline storage)
- **NPS:** 50+ (very good for SMB tools)
- **Onboarding:** <3 minutes from download to first product added

### Phase 2: Know Your Profit
- **Primary:** 15%+ conversion from free → paid tier (₦500/mo)
- **Secondary:** Users identify ≥1 repriced product based on margin data
- **Retention (30-day):** 60%+
- **User base expansion:** 50+ active traders

### Phase 3: Make Smarter Decisions
- **Primary:** 40%+ of users interact with AI chat monthly
- **Secondary:** Users report taking ≥1 action based on AI hints (qualitative survey)
- **Retention +10%** post-AI launch
- **Target:** 1,000+ active users, ₦500k+ MRR

---

## Risk Mitigation

| **Risk** | **Impact** | **Mitigation** |
|---|---|---|
| **Habit formation fails** | 🔴 Critical | Early user interviews (weekly calls), UX so simple it takes 30 sec/entry, Telegram community for peer pressure |
| **Sync conflicts** (offline data + cloud) | 🟡 High | Phase 1: no sync. Phase 2: conflict-free design (CRDTs + LWW). Heavy testing. |
| **Data loss** | 🔴 Critical | Phase 1: encourage exports. Phase 2: auto-backup, restore capability. |
| **Privacy/Regulatory** (data residency) | 🔴 Critical | Explicit privacy policy. RLS from day 1. Regional Supabase instances if needed. |
| **Feature creep** | 🟡 Medium | Strict phase gates. Only advance if retention >70% + success metrics met. |
| **AI quality** (wrong hints) | 🟡 Medium | Start conservative. "Estimated based on your sales pace" (not prescriptive). User feedback loop. |
| **Competitor clones** | 🟢 Low | Moat is execution + market relationships, not tech. Keep iterating. |

---

## Timeline & Phasing

| **Phase** | **Duration** | **Launch Target** | **Key Milestones** |
|---|---|---|---|
| **Phase 1 (MVP)** | 6–8 weeks | Week 8 (internal) | Feature complete, 10-user cohort test, iterate UX |
| **Phase 1 public** | 2 weeks | Week 10 | Soft launch, Telegram groups, market associations |
| **Phase 2** | 6–8 weeks (parallel dev) | Week 16 | Cost tracking, margin analysis, freemium gate |
| **Phase 2 public** | 2–4 weeks | Week 18 | Expand to 100+ users, collect feedback |
| **Phase 3** | 8–12 weeks (parallel) | Week 24–28 | AI chat, trend charts, reorder hints |
| **Phase 3 public** | 2 weeks | Week 30 | Public launch, target 1k users, ₦500k+ MRR |

**Parallel development:** Phase 2 and 3 development runs in parallel post-Phase-1-launch, accelerating time-to-full-product.

---

## What's Next

This document provides the complete vision. Detailed specs live in phase-specific docs:

- **PHASE-1-MVP.md** — Everything you need to build Phase 1 (user stories, acceptance criteria, API, database schema)
- **PHASE-2-PROFIT.md** — Phase 2 detailed spec (cost tracking, margins, dashboard)
- **PHASE-3-AI.md** — Phase 3 detailed spec (AI chat, trends, predictions)
- **ARCHITECTURE.md** — Infrastructure: offline sync, cloud architecture, conflict resolution
- **DATABASE-SCHEMA.md** — Complete SQL schema (all phases, with annotations)
- **API-REFERENCE.md** — All endpoints (all phases)
- **OFFLINE-SYNC-STRATEGY.md** — Deep dive: sync algorithm, testing, edge cases
- **DEPLOYMENT-&-INFRA.md** — Vercel + Supabase setup, scaling plan, monitoring

**Start here:** Phase 1 MVP spec is the next document to review.
