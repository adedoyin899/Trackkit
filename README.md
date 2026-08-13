# Trackkit 📦

**Offline-first inventory tracker for market traders.**  
Know your stock. Know your profit. No internet required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adedoyin899/Trackkit)

**Live app:** https://trackkit-psi.vercel.app

---

## What is Trackkit?

Trackkit helps market women and small traders in Nigeria track their inventory and profit margins — even with no internet connection.

Built for the realities of Lagos markets:
- 🔋 Works offline (no data needed day-to-day)
- 📱 Installable as a PWA on any Android phone
- ₦ Designed for Nigerian prices and business patterns
- 📊 Shows real profit margins, not just sales volume

---

## Features

### Phase 1 — Offline Inventory (Live ✅)
- Add products with categories, units, and low-stock thresholds
- Quick +1 / −1 stock adjustments
- Low-stock alerts (highlighted in orange)
- Export inventory to CSV
- Fully offline — all data in local SQLite (via IndexedDB)

### Phase 2 — Profit Intelligence (Live ✅)
- **Cost tracking** — log what you paid per unit
- **Auto margin calculation** — `((Selling − Cost) / Cost) × 100%`
- **Color-coded margins** — 🟢 >30% / 🟡 10–30% / 🔴 <10%
- **Profitability dashboard** — rank products by profit, spot losers fast
- **Purchase history** — full log of all restocks with dates and costs
- **Supplier comparison** — compare prices across suppliers, highlight cheapest
- **Restock modal** — log supplier + purchase cost when restocking
- **Cloud sync** — optional SMS login syncs data to Supabase (offline-first)
- **Multi-device support** — same inventory on multiple phones

### Phase 3 — AI Insights (Roadmap 🔮)
- AI-powered pricing suggestions
- Sales trend forecasting
- Seasonal demand analysis

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Local DB | SQLite via sql.js + IndexedDB |
| Cloud DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Phone OTP (SMS) |
| Sync | Custom offline-first sync engine |
| Hosting | Vercel |
| Testing | Vitest (unit) + Playwright (E2E) |
| Icons | Phosphor Icons |
| State | Zustand + TanStack Query |

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Clone and install
```bash
git clone https://github.com/adedoyin899/Trackkit.git
cd Trackkit/trackkit
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials (optional for Phase 1)
```

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

Phase 1 features work immediately — no Supabase credentials needed.

---

## Testing

```bash
# Unit tests (Vitest)
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (Playwright — requires running dev server)
npm run test:e2e

# Interactive E2E test runner
npm run test:e2e:ui
```

### Test Coverage

| Suite | Tests | Coverage |
|---|---|---|
| Unit: `useMarginCalculation` | 14 tests | Margin formula, thresholds, edge cases |
| Unit: `productUtils` | 10 tests | isLowStock, sorting |
| Unit: `supplierStats` | 8 tests | Ranking, savings %, null handling |
| E2E: Phase 1 offline | 5 specs | Add, adjust, export, low-stock |
| E2E: Phase 2 auth | 1 spec | SMS OTP flow |
| E2E: Phase 2 profit | 1 spec | Margins + repricing |
| E2E: Phase 2 history | 1 spec | Purchase history + suppliers |

---

## Deployment

### Vercel (Production)
```bash
# Link to project (first time)
npx vercel link

# Deploy to production
npx vercel --prod --yes
```

### Required Environment Variables (Phase 2)
| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret!) |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io → Project Settings → Client Keys |

See [.env.example](trackkit/.env.example) for full documentation.

---

## Supabase Schema

Run the following SQL in your Supabase SQL Editor to set up the database:

```sql
-- See DEPLOYMENT-&-INFRA.md for the full migration SQL
-- Quick summary of tables:
-- users, products, transactions, prices, sync_metadata, audit_log
```

Full schema: [`DEPLOYMENT-&-INFRA.md`](DEPLOYMENT-&-INFRA.md)

---

## Architecture

```
Phone (offline-first)              Cloud (optional)
┌──────────────────────┐          ┌─────────────────────┐
│  Next.js PWA         │          │  Supabase            │
│  ┌────────────────┐  │ ←sync→  │  ┌───────────────┐   │
│  │  SQLite        │  │          │  │  PostgreSQL   │   │
│  │  (IndexedDB)   │  │          │  │  (RLS on)     │   │
│  └────────────────┘  │          │  └───────────────┘   │
│  ┌────────────────┐  │          │  ┌───────────────┐   │
│  │  Sync Queue    │  │          │  │  Auth (SMS)   │   │
│  │  (mutations)   │  │          │  └───────────────┘   │
│  └────────────────┘  │          └─────────────────────┘
└──────────────────────┘
```

Full architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## Project Structure

```
trackkit/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (auth, margins, purchase-history, suppliers, health)
│   ├── auth/login/         # SMS OTP login page
│   ├── margins/            # Profitability dashboard page
│   ├── purchase-history/   # Purchase history page
│   └── page.tsx            # Main app (Dashboard, Inventory, Margins, History, Settings tabs)
├── components/             # React components
│   ├── ProductCard.tsx     # Product card with margin display
│   ├── ProductForm.tsx     # Add/edit product form
│   ├── ProfitabilityDashboard.tsx  # Margin ranking dashboard
│   ├── PurchaseHistoryDashboard.tsx # Purchase history + supplier comparison
│   ├── RestockModal.tsx    # Restock with supplier + cost capture
│   └── PriceUpdateModal.tsx # Repricing suggestions
├── hooks/                  # React hooks
│   ├── useLocalInventory.ts
│   ├── useTransactions.ts  # + usePurchaseHistory, useSupplierStats
│   ├── useMarginCalculation.ts
│   └── useAuth.ts
├── lib/                    # Core utilities
│   ├── sqlite-init.ts      # Database schema + migrations
│   ├── products.ts         # Product CRUD
│   ├── transactions.ts     # Transaction logic + history queries
│   ├── supabase.ts         # Supabase client
│   └── sentry.ts           # Error tracking (pre-wired)
├── e2e/                    # Playwright E2E tests
└── __tests__/              # Vitest unit tests
```

---

## Monitoring

- **Health check:** `GET /api/health` — returns DB status and build version
- **Uptime:** UptimeRobot (5-minute checks on `/api/health`)
- **Errors:** Sentry (set `NEXT_PUBLIC_SENTRY_DSN` to activate)
- **Analytics:** Vercel Analytics (built-in)

---

## Contributing

This project is currently in private beta. Once Phase 2 is validated:
1. Open to contributors for Phase 3 (AI features)
2. Contact via Telegram for access

---

## License

Private — All rights reserved © 2026 Trackkit

---

*Built with ❤️ for market women across Nigeria.*
