# Phase 1: Know Your Stock — Detailed MVP Specification
## The Baseline: Inventory Management + Low-Stock Alerts + No Internet Required

**Document:** PHASE-1-MVP.md  
**Audience:** Engineering, Product  
**Read time:** 20 minutes  
**Status:** Ready for build  

---

## Overview

Phase 1 is the MVP: offline-first inventory tracking with low-stock alerts and selling prices (for Phase 2 margin calc). **No cloud sync, no login, no internet required.** Data lives on the phone only. Optional manual exports for backup.

**Target duration:** 6–8 weeks  
**Success metric:** 80% of test users (10 market women) use app 5+ days/week for 4+ weeks, NPS 50+

---

## User Stories

### 1. Add Product
**As a** market woman  
**I want to** add a new product to track  
**So that** I can monitor its stock level

**Acceptance Criteria:**
- [ ] User taps "+ Add Product" button
- [ ] Modal opens with form: Product Name, Category (dropdown), Current Quantity (number), Unit (Carton/Tin/Bag/custom), Low-Stock Threshold (number)
- [ ] Form validates: Name required, Quantity ≥ 0, Threshold ≥ 0, Unit required
- [ ] On save: Product created, added to top of inventory list
- [ ] Product persists in local SQLite (survives app restart)
- [ ] User sees success toast: "Noodles added to your inventory"
- [ ] Form clears on submit, ready for next product

**UI/UX Notes:**
- Keep form minimal (4 fields max). Market women are busy.
- Category dropdown includes: Noodles, Dairy, Sugar/Flour, Spices, Oil, Custom
- Unit dropdown: Carton, Tin, Bag, Box, Crate, Custom (allow 1 custom input per product)
- Use large touch targets (48px min) for mobile
- Selling price can be added later (edit product → add price)

**Technical Notes:**
- Form state managed in React (Zustand)
- Write to SQLite via `useLocalInventory()` hook
- Optimistic UI: add to list immediately, persist async
- Sync queue: queue this CREATE for Phase 2 cloud sync (even though Phase 1 has no cloud)

---

### 2. Quick Stock Adjustment (Sale / Restock)
**As a** market woman  
**I want to** quickly adjust stock quantity (decrease for sales, increase for restocks)  
**So that** I can track stock in real-time as I sell or reorder

**Acceptance Criteria:**
- [ ] User sees each product as a card with: Product name, Current qty, Unit, Low-stock indicator
- [ ] Card has large "+1 carton" (restock) and "−1 carton" (sale) buttons
- [ ] Tapping +/− immediately updates quantity on screen (optimistic)
- [ ] Quantity cannot go negative (−1 button disables at 0)
- [ ] On each adjustment: record transaction (type, qty, timestamp) in local SQLite
- [ ] User can long-press product card to open detail view (edit, delete, see history)
- [ ] Adjustment persists across app restarts

**UI/UX Notes:**
- Huge, high-contrast +/− buttons (green for +, red for −). No confirmation needed.
- Card shows large current qty (font size 24pt+)
- Low-stock indicator: yellow/orange background if qty ≤ threshold
- Allow bulk adjustments: tap and hold +/− button to increment by 5, 10, etc.
- Haptic feedback on each tap (if phone supports it)

**Example:**
```
┌─────────────────────────────┐
│  NOODLES (Carton)           │
│  Current: 7 cartons         │
│  Alert threshold: 5         │
│                             │
│  [   −1   ]  [   +1   ]     │
│                             │
│  Tap −1 → "NOODLES: 7→6"    │
└─────────────────────────────┘
```

**Technical Notes:**
- Each adjustment triggers `logTransaction()` hook
- Transactions table: `{ id, product_id, type: 'sale'|'restock', quantity, timestamp, notes? }`
- Inventory view uses TanStack Query for infinite scroll / pagination (if 50+ products)
- Service worker caches UI for instant loads even if offline from start

---

### 3. View Low-Stock Summary
**As a** market woman  
**I want to** see at a glance which items are running low  
**So that** I can prioritize what to restock this week

**Acceptance Criteria:**
- [ ] Home screen shows dashboard with: Total products count, Low-stock count (highlight in red), Total inventory value (Phase 2, for now show as TBD)
- [ ] Low-stock items pinned at top of inventory list (yellow/orange background)
- [ ] Low-stock items sorted by urgency: qty closest to 0 first
- [ ] Tapping low-stock card shows "Days to stock-out" if sales velocity known (Phase 2)
- [ ] Each low-stock item has inline quick-restock button (tap to add 5/10/20)

**Example:**
```
┌──────────────────────────────┐
│ YOUR STOCK TODAY             │
│ Total items: 8               │
│ ⚠️  Low stock: 2              │
│                              │
│ LOW STOCK (Alert soon!)      │
│ ─────────────────────────    │
│ 🔴 Milk: 2/10 tins           │ ← Lowest first
│    [+5]  [+10]               │
│                              │
│ 🟡 Sugar: 8/12 bags          │
│    [+5]  [+10]               │
│                              │
│ ALL STOCK (Status good)      │
│ ─────────────────────────    │
│ ✅ Noodles: 7/5 cartons      │
│ ✅ Flour: 12/10 bags         │
│ ...                          │
└──────────────────────────────┘
```

**Technical Notes:**
- Dashboard computed via `useInventoryStats()` hook
- Low-stock = `product.quantity <= product.low_stock_threshold`
- Compute total inventory value as: `SUM(qty * selling_price_per_unit)` (Phase 2 only; show placeholder in Phase 1)
- Refresh on every transaction log

---

### 4. Edit Product
**As a** market woman  
**I want to** edit a product (name, category, unit, selling price, low-stock threshold)  
**So that** I can fix mistakes or update as my business changes

**Acceptance Criteria:**
- [ ] User long-presses a product card or taps an edit icon
- [ ] Edit modal opens with all product fields pre-filled
- [ ] User can change: Name, Category, Unit, Low-stock threshold, Selling price per unit
- [ ] Selling price field is optional in Phase 1 (required in Phase 2+)
- [ ] Form validates (same rules as Create)
- [ ] On save: Product updated in local SQLite, list refreshes
- [ ] On cancel: Modal closes, no changes applied
- [ ] Delete option available (confirmation: "This will delete all history. Sure?")

**UI/UX Notes:**
- Keep modal compact (mobile screen-width)
- Add clear "Delete" button at bottom in red
- Show creation date and last modified date

**Technical Notes:**
- Use same form component as "Add Product", just pre-populate and switch endpoint to PATCH
- On delete: soft-delete by setting `deleted_at` timestamp; don't actually remove rows (audit trail)
- In Phase 2 sync, soft deletes sync to cloud

---

### 5. Manual Data Export
**As a** market woman  
**I want to** export my data to CSV (email or download)  
**So that** I have a backup if my phone breaks

**Acceptance Criteria:**
- [ ] Settings screen has "Export Data" button
- [ ] Tapping export generates CSV file with: Date, All products (name, qty, unit, selling price, category)
- [ ] CSV is downloadable or shareable (WhatsApp, email)
- [ ] Export includes timestamp so user knows how fresh it is
- [ ] No login required; export happens locally

**CSV Format Example:**
```
MarketMate Inventory Export
Exported: 2026-08-11 14:30
Shop Name: (user can set in settings)

Product Name,Category,Current Qty,Unit,Selling Price,Low-Stock Threshold
Noodles,FMCG,7,Carton,120,5
Milk,Dairy,2,Tin,800,3
Sugar,Sugar/Flour,8,Bag,75,10
```

**Technical Notes:**
- Use a library like PapaParse (CSV generation on client)
- No server call; all local
- Include instructions: "Keep this file as backup. You can import it if you reinstall the app" (Phase 2+)

---

## Database Schema (Phase 1)

**Design principle:** Minimal, focused on tracking inventory and transactions. Audit-ready.

```sql
-- Phase 1 Core Schema

CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Unique identifier (will be synced to cloud in Phase 2)
  
  user_id TEXT DEFAULT NULL,
  -- NULL in Phase 1 (single-user offline)
  -- Populated in Phase 2 when cloud sync added
  
  name TEXT NOT NULL,
  -- "Noodles", "Milk", "Sugar", etc.
  
  category TEXT,
  -- "FMCG", "Dairy", "Sugar/Flour", "Spices", "Oil", "Custom"
  
  current_quantity INT NOT NULL DEFAULT 0,
  -- How many units in stock right now
  
  unit TEXT NOT NULL,
  -- "Carton", "Tin", "Bag", "Box", "Crate", custom string
  
  low_stock_threshold INT,
  -- Alert when current_quantity <= this value
  
  selling_price_per_unit DECIMAL(10, 2),
  -- What she sells for (per unit). Optional in Phase 1, required Phase 2+.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  -- Soft delete (for audit trail)
  
  CHECK (current_quantity >= 0),
  CHECK (low_stock_threshold >= 0 OR low_stock_threshold IS NULL)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock')),
  -- "sale" = quantity decreased
  -- "restock" = quantity increased
  
  quantity INT NOT NULL CHECK (quantity > 0),
  -- Units transacted (always positive; type determines direction)
  
  notes TEXT,
  -- Optional: "Bought from supplier X", "Sold to bulk buyer", etc.
  
  created_at TIMESTAMP DEFAULT NOW()
  -- Immutable (never update transactions, only insert)
);

-- Phase 1 SQLite Note:
-- On client, these are stored in SQLite via sql.js or wa-sqlite.
-- No user_id column needed locally (single-user phone).
-- In Phase 2, schema is extended for multi-device sync (cloud).
```

**Indexes (SQLite):**
```sql
CREATE INDEX idx_products_user_id ON products(user_id)
  -- Used in Phase 2 for cloud queries
  
CREATE INDEX idx_products_category ON products(category)
  -- Quick category filtering
  
CREATE INDEX idx_transactions_product_id ON transactions(product_id)
  -- Fetch all transactions for a product (history view)
  
CREATE INDEX idx_transactions_created_at ON transactions(created_at)
  -- Recent transactions first
```

---

## API Surface (Phase 1)

**Note:** Phase 1 has NO backend API calls. All operations are local (SQLite in browser).

**Next.js API routes** (scaffolded but not wired yet):
- Placeholder endpoints for Phase 2 cloud sync
- No authentication needed for Phase 1

```
// These exist as stubs; they're activated in Phase 2

POST   /api/products
GET    /api/products
PATCH  /api/products/:id
DELETE /api/products/:id

POST   /api/transactions
GET    /api/transactions

POST   /api/auth/register  (for Phase 2 SMS login)
POST   /api/auth/verify-otp
POST   /api/sync           (for Phase 2 offline→cloud reconciliation)
```

**Phase 1 doesn't call these.** All work is done in-browser with SQLite.

---

## Frontend Architecture (Phase 1)

### Component Structure

```
pages/
  index.tsx           # Home / Dashboard
  products.tsx        # Inventory list (main view)
  settings.tsx        # Export data, preferences
  
components/
  ProductCard.tsx     # Product summary with +/− buttons
  ProductForm.tsx     # Add / Edit modal
  Dashboard.tsx       # Low-stock summary, stats
  LowStockAlert.tsx   # Visual indicator
  ExportButton.tsx    # CSV export
  
hooks/
  useLocalInventory.ts   # SQLite CRUD (products)
  useTransactions.ts     # SQLite transaction log
  useInventoryStats.ts   # Computed: total items, low-stock count, total value
  
utils/
  csv-export.ts       # Generate CSV from products + transactions
  sqlite-init.ts      # Initialize local database schema
```

### State Management (Zustand + TanStack Query)

**Zustand store (app-wide state):**
```typescript
interface MarketMateStore {
  // Settings
  shopName: string | null;
  currency: string; // ₦ by default
  syncEnabled: boolean; // Phase 2+
  
  // UI
  currentTab: 'inventory' | 'dashboard' | 'settings';
  selectedProductId: string | null;
}
```

**TanStack Query (server state, but "server" = SQLite):**
```typescript
// In Phase 1, queries hit local SQLite via hooks

useQuery({
  queryKey: ['products'],
  queryFn: async () => fetchProducts(), // local SQLite
});

useQuery({
  queryKey: ['low-stock-items'],
  queryFn: async () => getLowStockItems(),
});
```

### Offline-First Service Worker

```typescript
// service-worker.ts

// 1. Cache all static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('marketmate-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles/main.css',
        '/js/app.js',
        '/js/sqlite.js',
        // ... all assets
      ]);
    })
  );
});

// 2. On fetch, serve from cache first (offline-first)
// If cache miss, try network (Phase 2 API calls)
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
  // POST/PATCH/DELETE: queue for later (Phase 2)
});
```

---

## Testing Strategy (Phase 1)

### Unit Tests
- `useLocalInventory()`: Create, read, update, soft-delete
- `useTransactions()`: Log sale/restock, query history
- `useInventoryStats()`: Compute low-stock count, total value
- CSV export: Ensure correct format, no data loss

### Integration Tests
- Add product → Verify in local SQLite → Verify in UI
- Log 10 sales → Verify qty decrements correctly → Export CSV → Verify CSV includes all sales
- Edit product → Verify changes persist across app restart
- Delete product (soft delete) → Verify deleted_at set → Verify not shown in UI

### E2E Tests (via Playwright)
- Open app (no internet) → Add 3 products → Log sales → See low-stock alert → Export CSV
- Clear local storage → Reinstall → Add products again → Verify no cross-contamination
- Settings → Export → Download CSV → Verify file contents

### User Testing (Phase 1 Cohort)
- 10 market women, 2 weeks daily usage
- Daily check-in (5 min WhatsApp calls): What's working? What's friction?
- After 2 weeks: Survey on habits, NPS, feature requests
- Measure: % using app 5+ days/week, avg session duration, zero data loss

---

## UI/UX Wireframes (Simplified Descriptions)

### Home Screen (Dashboard)
```
┌────────────────────────────────┐
│ MarketMate                  🔧  │  ← Settings gear
├────────────────────────────────┤
│                                │
│  TODAY'S SNAPSHOT             │
│  ─────────────────────────    │
│  📦 8 Products in stock        │
│  ⚠️  2 Low stock alerts        │
│                                │
│  QUICK ACTIONS                │
│  ─────────────────────────    │
│  [+ Add Product] [View All]   │
│                                │
│  LOW STOCK (Reorder soon!)    │
│  ─────────────────────────    │
│  🔴 Milk: 2/10                │
│  🟡 Sugar: 8/12               │
│                                │
│  [View All Products ↓]        │
│                                │
└────────────────────────────────┘
```

### Inventory List
```
┌────────────────────────────────┐
│ ALL PRODUCTS                  │
├────────────────────────────────┤
│                                │
│ ┌──────────────────────────┐  │
│ │ MILK (Tin)— ⚠️ LOW       │  │
│ │ Current: 2 / Alert: 3    │  │
│ │                          │  │
│ │   [  −1  ]  [  +1  ]     │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ NOODLES (Carton)        │  │
│ │ Current: 7 / Alert: 5    │  │
│ │                          │  │
│ │   [  −1  ]  [  +1  ]     │  │
│ └──────────────────────────┘  │
│                                │
│ ...                            │
│                                │
└────────────────────────────────┘
```

### Add / Edit Product Modal
```
┌─────────────────────────────────────┐
│ Add Product                      ✕   │
├─────────────────────────────────────┤
│                                     │
│ Product Name *                      │
│ [__________________ ]               │
│                                     │
│ Category                            │
│ [Dairy ▼]                           │
│                                     │
│ Current Quantity *                  │
│ [______] units                      │
│                                     │
│ Unit Type *                         │
│ [Tin ▼]                             │
│                                     │
│ Low-Stock Alert                     │
│ [______] units                      │
│                                     │
│ Selling Price (optional)            │
│ ₦ [__________]                      │
│                                     │
│ [Cancel]  [Save]                    │
└─────────────────────────────────────┘
```

---

## Acceptance & Deployment (Phase 1)

### Definition of Done

- [x] All user stories implemented
- [x] All acceptance criteria pass
- [x] SQLite schema stable (documented)
- [x] 90%+ unit test coverage
- [x] E2E tests pass (10 user flows)
- [x] Service worker active (verify offline mode works)
- [x] 0 data loss bugs (10 market women, 2 weeks)
- [x] NPS ≥ 50
- [x] Onboarding < 3 minutes
- [x] All docs updated (README, CONTRIBUTING, ARCHITECTURE)

### Phase 1 → Phase 2 Gate

**Don't move to Phase 2 unless:**
1. Retention rate ≥ 70% (at 2-week mark with cohort of 10)
2. Average session duration ≥ 2 minutes
3. Users have logged average ≥ 10 transactions each
4. Zero data loss incidents
5. NPS ≥ 45 (aim for 50)

**If gate not met:** Double down on UX, habit formation. Don't add features yet.

---

## Technical Stack (Phase 1)

| Component | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 (React) + TypeScript | SSR, serverless, strong type safety |
| **Styling** | Tailwind CSS | Responsive, utility-first, fast |
| **Offline Storage** | SQLite (wa-sqlite) | Relational queries, ACID, proven |
| **State Management** | Zustand + TanStack Query | Lightweight, offline-friendly |
| **Service Worker** | Custom (Workbox helpers) | Cache-first, offline-first strategy |
| **Database (Cloud)** | PostgreSQL (Supabase) | For Phase 2; scaffolded now |
| **Deployment** | Vercel | Edge, fast, PWA-friendly |
| **Testing** | Vitest (unit), Playwright (E2E) | Fast, modern, gstack-aligned |

---

## File Structure (Phase 1)

```
marketmate/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Home / Dashboard
│   ├── products/
│   │   └── page.tsx            # Inventory list
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── products.ts         # Placeholder (Phase 2)
│       └── auth/
│           └── route.ts        # Placeholder (Phase 2)
│
├── components/
│   ├── ProductCard.tsx
│   ├── ProductForm.tsx
│   ├── Dashboard.tsx
│   ├── LowStockAlert.tsx
│   └── ExportButton.tsx
│
├── hooks/
│   ├── useLocalInventory.ts    # SQLite CRUD
│   ├── useTransactions.ts
│   └── useInventoryStats.ts
│
├── lib/
│   ├── sqlite-init.ts          # Initialize local DB
│   ├── csv-export.ts
│   └── types.ts                # TypeScript interfaces
│
├── public/
│   ├── manifest.json           # PWA config
│   └── service-worker.ts       # Service worker
│
├── styles/
│   ├── globals.css
│   └── variables.css
│
├── tests/
│   ├── hooks/
│   │   ├── useLocalInventory.test.ts
│   │   └── useInventoryStats.test.ts
│   ├── e2e/
│   │   └── phase1.spec.ts
│   └── fixtures/
│       └── sample-products.json
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## Development Workflow (Aligned with gstack)

1. **`/office-hours`** — Phase 1 scope confirmed (done; this spec)
2. **`/plan-eng-review`** — Architecture signed off (this doc is the output)
3. **`/design-consultation`** → **`/design-shotgun`** → **`/design-html`**
   - Mockups → Component library
4. **Build in sprints:** 1–2 weeks per major feature
   - Sprint 1: Add/edit/delete products + offline storage
   - Sprint 2: Stock adjustments + transactions
   - Sprint 3: Dashboard + low-stock alerts
   - Sprint 4: Export + settings
   - Sprint 5: Polish + E2E testing
5. **`/review`** — Code review on every PR
6. **`/qa`** — E2E test every staging deploy
7. **`/ship`** — Internal release to test cohort

---

## Success Looks Like

After Phase 1 (Week 10):

- ✅ 10 market women using app daily (5+ days/week)
- ✅ 100+ products tracked collectively
- ✅ 1,000+ transactions logged
- ✅ 0 data loss incidents
- ✅ NPS 50–60 (very good for beta)
- ✅ Feedback: "This actually works. I don't have to write anything down."
- ✅ Ready to add cost tracking (Phase 2)

---

## Next: Phase 2

Once Phase 1 is validated, move to **PHASE-2-PROFIT.md** for cost tracking, margin analysis, and dashboard features.

Phase 2 builds directly on Phase 1's schema and offline-first foundation. No rework needed.
