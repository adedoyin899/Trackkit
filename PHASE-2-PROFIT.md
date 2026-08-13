# Phase 2: Know Your Profit — Detailed Specification
## Cost Tracking, Margin Analysis, and Profit Intelligence

**Document:** PHASE-2-PROFIT.md  
**Audience:** Engineering, Product  
**Read time:** 25 minutes  
**Status:** Ready for build (post-Phase-1 validation)  
**Gateway:** Only start Phase 2 if Phase 1 achieves 70%+ retention, NPS 45+, zero data loss  

---

## Phase 2 Overview

**Goal:** Show market women which products are actually profitable. Help her reprice losers and double down on winners.

**Timeline:** 6–8 weeks (parallel dev with Phase 1 feedback cycle)  
**Prerequisite:** Phase 1 complete and validated (10+ users, 2+ weeks daily usage)  
**Launch target:** Week 18 (soft launch to 100 traders via Telegram groups)

**Revenue:** ₦500/month tier (15%+ conversion target from free)  
**Success metric:** Users identify ≥1 repriced product based on margin data, retention > 60% at 30 days

---

## What Phase 2 Adds

### New Features
1. **Cost per unit tracking** — Log what she paid the supplier
2. **Auto-margin calculation** — (Selling price − Cost price) / Cost price × 100%
3. **Purchase history** — Date, cost, quantity bought (linked to restocks)
4. **Margin comparison dashboard** — Side-by-side: cost vs. selling price vs. margin %
5. **Product profitability ranking** — Sort by margin, identify losers vs. winners
6. **Pricing suggestions** — "Sugar is 50% margin, milk is 1%. Consider raising milk to ₦850."
7. **Cloud sync (optional)** — Phone ↔ Supabase (user authentication via SMS)
8. **Multi-device support** — Use same account on old phone + new phone

### What Stays the Same
- Offline-first architecture (still works without internet)
- Quick stock adjustments (+/− buttons)
- Low-stock alerts
- All Phase 1 features remain (no rework)

---

## User Stories & Acceptance Criteria

### Story 1: Log Cost per Unit

**As a** market woman  
**I want to** enter how much I paid the supplier for each product  
**So that** I can see my actual profit margin

**Acceptance Criteria:**

- [ ] When adding/editing product, there's an optional "Cost per unit" field
- [ ] Cost is remembered per product (not per transaction)
- [ ] Cost field accepts decimal values (e.g., 500.50, 75.00)
- [ ] Cost is tied to an effective date (e.g., "I paid ₦500 until Aug 1, then ₦525")
- [ ] Can update cost without losing sale history (old transactions keep their cost)
- [ ] UI shows: "You bought this at ₦500 on Aug 10"
- [ ] Cost persists across app restart

**UI/UX Notes:**
- Add "Cost per unit" input to product edit modal
- Show current cost prominently ("Bought at: ₦500")
- Allow date picker for "effective date" (when price changed)
- History view shows cost changes over time

**Technical Notes:**
- New table: `prices` (product_id, cost_per_unit, effective_date)
- On PATCH /api/products, if cost changes, create new `prices` row
- On transaction log, capture `price_per_unit` for historical accuracy
- Sync to cloud: prices table syncs with LWW conflict resolution

---

### Story 2: Auto-Calculate Margin %

**As a** market woman  
**I want to** see profit margin calculated automatically  
**So that** I don't have to do math in my head

**Acceptance Criteria:**

- [ ] When both cost and selling price are set, margin % is shown
- [ ] Margin formula: ((Selling − Cost) / Cost) × 100 = Margin %
- [ ] Example: Milk cost ₦800, selling ₦810 → Margin = 1.25%
- [ ] Margin is color-coded: Red (0–5%), Yellow (6–20%), Green (21%+)
- [ ] Margin shown on product card and in product detail view
- [ ] Margin updates instantly when price or cost changes
- [ ] Margin shown in transaction history (what margin was at sale time)

**UI/UX Notes:**
- Card shows: "Selling: ₦810 | Cost: ₦800 | Margin: 1.25% 🔴"
- Color-coded badge makes it easy to spot low-margin items at a glance
- Dashboard shows margin ranking (sorted best→worst)

**Technical Notes:**
- Margin is a generated column (PostgreSQL) or computed on fetch
- Formula: `ROUND(((selling_price - cost_per_unit) / cost_per_unit) * 100)`
- Stored in `prices` table for historical analysis
- Syncs to cloud with Phase 2 auth

---

### Story 3: View Margin Comparison (Dashboard)

**As a** market woman  
**I want to** see a simple dashboard comparing all my products' margins  
**So that** I can quickly spot which are winners and which are losers

**Acceptance Criteria:**

- [ ] New "Profitability" tab on home screen
- [ ] Shows table: Product | Cost | Selling | Margin % | Last Sale
- [ ] Sortable by margin (highest → lowest)
- [ ] Color-coded: Red/Yellow/Green
- [ ] Shows total profit if all current stock sold at margin
- [ ] Shows which products had sales this week
- [ ] Profit summary: "You made ₦15,200 profit this week across 8 products"
- [ ] Example: "Milk (1.25% margin) — You sold 20 tins → ₦200 profit. Sugar (50% margin) — You sold 12 bags → ₦1,500 profit."

**UI/UX Notes:**
```
┌────────────────────────────────────────────────┐
│ PROFITABILITY DASHBOARD                        │
│                                                │
│ Week Profit: ₦15,200                           │
│ Top Product: Sugar (50% margin)                │
│ Problem Product: Milk (1.25% margin)           │
│                                                │
│ [Sort by: Margin ▼] [Sort by: Profit ▼]       │
│                                                │
│ PRODUCT      COST  SELL  MARGIN  SALES  PROFIT│
│ ──────────────────────────────────────────────│
│ Sugar        ₦50   ₦75   50%     12     ₦300  │
│ Noodles      ₦80   ₦120  50%     7      ₦280  │
│ Cocoa Milk   ₦600  ₦700  16.7%   15     ₦1.5k │
│ Milk         ₦800  ₦810  1.25%   20     ₦200  │ ← Problem!
│ ...                                            │
└────────────────────────────────────────────────┘
```

**Technical Notes:**
- Compute via query: `SELECT product, cost, selling_price, MARGIN, SUM(qty) as sales_qty, ...`
- Join products + transactions + prices tables
- Cache dashboard data (5-minute TTL) to avoid slow queries
- Phase 2: Cloud dashboard pulls from PostgreSQL (Phase 1: computed locally)

---

### Story 4: Pricing Recommendation Engine

**As a** market woman  
**I want to** see suggestions on which products to reprice  
**So that** I can increase profit without guessing

**Acceptance Criteria:**

- [ ] App shows prompt: "Milk: 1.25% margin. Competitors price at ₦850–900. Consider raising to ₦850?"
- [ ] Suggestion explains the math: "At ₦850: margin becomes 6.25%. That's ₦400 profit per tin instead of ₦10."
- [ ] Can tap "Update price" to accept suggestion
- [ ] Suggestions prioritize high-volume, low-margin products
- [ ] Show: "You sold 20 milk tins this week. If margin was 6%, that's ₦800 extra profit."
- [ ] Suggestions only show if product has 3+ sales history (enough data to be reliable)

**UI/UX Notes:**
```
┌──────────────────────────────────────────────┐
│ 💡 PRICING OPPORTUNITY                       │
│                                              │
│ Milk is your #2 seller (20 sales/week)       │
│ but has LOW margin (1.25%).                  │
│                                              │
│ Current: Buying ₦800, Selling ₦810          │
│ Margin: ₦10 per tin → ₦200/week profit      │
│                                              │
│ Suggested: Raise selling price to ₦850      │
│ New margin: ₦50 per tin → ₦1,000/week       │
│                                              │
│ 💰 Extra profit: ₦800/week = ₦3,200/month   │
│                                              │
│ [Try this price] [Maybe later] [Dismiss]    │
└──────────────────────────────────────────────┘
```

**Technical Notes:**
- Algorithm: Identify products where (quantity_sold > 10/week) AND (margin < 10%)
- Benchmark: Research local market pricing (manual, not automated)
- Suggestion is informational only; user decides
- Logging: Track which suggestions user accepts (feedback for algorithm)
- Phase 3: AI makes smarter suggestions using sales velocity + seasonality

---

### Story 5: Purchase History & Cost Tracking

**As a** market woman  
**I want to** see when I bought stock and what I paid  
**So that** I can track cost changes and plan bulk purchases

**Acceptance Criteria:**

- [ ] New "Purchase History" view per product
- [ ] Shows: Date | Quantity | Cost per Unit | Total Cost | Supplier
- [ ] Linked to "Restock" transactions (buying from supplier)
- [ ] Can filter by date range
- [ ] Shows cost trends: "Cost was ₦500 (Jun), ₦525 (Jul), ₦550 (Aug)"
- [ ] Calculates average cost: "Average cost this quarter: ₦525"
- [ ] Notes: Can add notes per purchase ("Got bulk discount", "Supply shortage, price up")

**UI/UX Notes:**
```
┌──────────────────────────────────────────────┐
│ MILK — Purchase History                      │
│                                              │
│ Date       Qty   Cost/Unit  Total   Supplier│
│ ────────────────────────────────────────────│
│ Aug 10     15    ₦525       ₦7,875  Kano    │
│ Aug 3      20    ₦500       ₦10k    Lagos   │
│ Jul 27     10    ₦500       ₦5k     Lagos   │
│ Jul 20     15    ₦500       ₦7,500  Lagos   │
│                                              │
│ Avg cost this month: ₦509                   │
│ Cost trend: ↑ (up 2% in Aug)                │
└──────────────────────────────────────────────┘
```

**Technical Notes:**
- Pull from `transactions` table (where type = 'restock')
- Join with `prices` table for cost_per_unit at that time
- Compute average, trend, etc. in client or server
- Phase 2: Stored in cloud; Phase 1: computed from local SQLite

---

### Story 6: Cloud Sync & Multi-Device

**As a** market woman  
**I want to** use my inventory on my old phone AND new phone, and have them sync  
**So that** I don't lose data if one phone breaks

**Acceptance Criteria:**

- [ ] User can create account via SMS login (WhatsApp or SMS OTP)
- [ ] After login, products + transactions auto-sync to cloud
- [ ] Can log out and back in on different phone
- [ ] Data from old phone appears on new phone (within 2 minutes)
- [ ] If both phones edit simultaneously, conflict resolved via Last-Write-Wins
- [ ] UI shows "Syncing..." when connecting, "Synced" when complete
- [ ] Can still work offline; sync happens when online
- [ ] User never forced to log in (Phase 1 features work without auth)

**UI/UX Notes:**
- Settings → "Sign in to cloud backup" (optional button)
- On first tap: "Enter your WhatsApp number" → "Enter OTP" → Logged in
- Home screen shows sync status: "Synced 2 min ago" or "Pending sync (3 changes)"
- Conflict notification: "Product updated from another device"

**Technical Notes:**
- Supabase Auth (SMS/WhatsApp via Twilio)
- JWT tokens stored securely in phone
- Sync queue: All mutations queued locally, synced on interval or on demand
- Offline-first: Never blocks user waiting for sync
- RLS ensures users can only access their own data
- See ARCHITECTURE.md and OFFLINE-SYNC-STRATEGY.md for details

---

## Database Schema (Phase 2 Extensions)

### New Table: `prices`

```sql
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  product_id TEXT NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  -- What she paid the supplier (e.g., ₦500)
  
  selling_price_per_unit DECIMAL(10, 2) NOT NULL,
  -- What she sells for (e.g., ₦750)
  
  margin_percent INT GENERATED ALWAYS AS (
    ROUND(((selling_price_per_unit - cost_per_unit) / cost_per_unit) * 100)
  ) STORED,
  -- Auto-calculated: 50%, 1.25%, etc.
  
  effective_date DATE DEFAULT CURRENT_DATE,
  -- When this price became active (tracks price history)
  
  notes TEXT,
  -- Optional: "Bulk discount", "Supply shortage"
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prices_product_id ON prices(product_id, effective_date DESC);
CREATE INDEX idx_prices_user_id ON prices(user_id, effective_date DESC);
```

### Updated Table: `products` (Phase 2)

```sql
ALTER TABLE products ADD COLUMN (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Multi-user support
  
  initial_cost_per_unit DECIMAL(10, 2),
  -- When first added, what was the cost? (for historical reference)
  
  supplier TEXT,
  -- Which supplier she buys from (optional)
  
  notes TEXT
  -- Internal notes
);

ALTER TABLE products ADD CONSTRAINT UNIQUE (user_id, name);
-- Product names unique per user
```

### New Table: `users` (Phase 2)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  phone_number TEXT UNIQUE NOT NULL,
  -- E.164 format: +2341234567890
  
  shop_name TEXT,
  -- Her business name
  
  email TEXT,
  currency TEXT DEFAULT '₦',
  timezone TEXT DEFAULT 'Africa/Lagos',
  language TEXT DEFAULT 'en',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_phone_number ON users(phone_number);
```

### Updated Table: `transactions` (Phase 2)

```sql
ALTER TABLE transactions ADD COLUMN (
  user_id UUID NOT NULL REFERENCES users(id),
  price_per_unit DECIMAL(10, 2),
  -- The actual price (cost or selling) at time of transaction
);

-- Multi-user index for analytics
CREATE INDEX idx_transactions_user_product_date
ON transactions(user_id, product_id, created_at DESC);
```

---

## API Endpoints (Phase 2)

### Authentication

See API-REFERENCE.md sections: `/api/auth/request-otp`, `/api/auth/verify-otp`

### Prices Endpoints

#### GET `/api/prices/:productId`

Fetch price history for a product.

```http
GET /api/prices/milk-product-id HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "current": {
    "costPerUnit": "500.00",
    "sellingPricePerUnit": "810.00",
    "marginPercent": 62,
    "effectiveDate": "2026-08-01"
  },
  "history": [
    {
      "costPerUnit": "500.00",
      "sellingPricePerUnit": "810.00",
      "marginPercent": 62,
      "effectiveDate": "2026-08-01"
    },
    {
      "costPerUnit": "500.00",
      "sellingPricePerUnit": "750.00",
      "marginPercent": 50,
      "effectiveDate": "2026-07-15"
    }
  ]
}
```

#### POST `/api/prices`

Create or update cost/selling price for a product.

```http
POST /api/prices HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "milk-id",
  "costPerUnit": "525.00",
  "sellingPricePerUnit": "850.00",
  "effectiveDate": "2026-08-10",
  "notes": "Cost increased due to supply"
}
```

**Response (201):**
```json
{
  "id": "price-id",
  "productId": "milk-id",
  "costPerUnit": "525.00",
  "sellingPricePerUnit": "850.00",
  "marginPercent": 62,
  "effectiveDate": "2026-08-10"
}
```

### Dashboard Endpoints

See API-REFERENCE.md: `/api/dashboard` (enhanced for Phase 2)

#### GET `/api/dashboard/profitability`

```http
GET /api/dashboard/profitability?period=week HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "summary": {
    "weekProfit": "15200.00",
    "topProduct": { "name": "Sugar", "margin": 50 },
    "problemProduct": { "name": "Milk", "margin": 1.25 },
    "totalSalesValue": "45000.00",
    "totalCost": "29800.00"
  },
  "products": [
    {
      "id": "sugar-id",
      "name": "Sugar",
      "costPerUnit": "50.00",
      "sellingPricePerUnit": "75.00",
      "marginPercent": 50,
      "quantitySoldThisWeek": 12,
      "profitThisWeek": "300.00"
    }
  ]
}
```

#### GET `/api/pricing-suggestions`

```http
GET /api/pricing-suggestions HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "suggestions": [
    {
      "productId": "milk-id",
      "productName": "Milk",
      "currentSellingPrice": "810.00",
      "suggestedSellingPrice": "850.00",
      "currentMargin": 1.25,
      "suggestedMargin": 6.25,
      "weeklySalesQty": 20,
      "extraProfitPerWeek": "800.00",
      "reason": "Low margin product with high sales volume"
    }
  ]
}
```

---

## Testing Strategy (Phase 2)

### Unit Tests

```typescript
// __tests__/lib/margin.test.ts

import { calculateMargin } from '@/lib/margin';

describe('Margin Calculation', () => {
  it('should calculate margin correctly', () => {
    const result = calculateMargin({
      costPerUnit: 500,
      sellingPricePerUnit: 750
    });
    expect(result).toBe(50);  // 50%
  });

  it('should handle edge case: selling < cost (loss)', () => {
    const result = calculateMargin({
      costPerUnit: 500,
      sellingPricePerUnit: 400
    });
    expect(result).toBe(-20);  // -20% loss
  });

  it('should handle null cost (no margin calc)', () => {
    const result = calculateMargin({
      costPerUnit: null,
      sellingPricePerUnit: 750
    });
    expect(result).toBeNull();
  });
});

describe('Profitability Dashboard', () => {
  it('should rank products by margin (highest first)', () => {
    const products = [
      { name: 'Milk', margin: 1.25 },
      { name: 'Sugar', margin: 50 },
      { name: 'Noodles', margin: 25 }
    ];

    const sorted = sortByMargin(products, 'desc');

    expect(sorted[0].name).toBe('Sugar');
    expect(sorted[2].name).toBe('Milk');
  });

  it('should calculate total profit if all stock sold', () => {
    const product = {
      currentQuantity: 10,
      sellingPricePerUnit: 750,
      costPerUnit: 500,
      marginPercent: 50
    };

    const totalProfit = calculateTotalProfit(product);
    expect(totalProfit).toBe(2500);  // 10 * (750 - 500)
  });
});
```

### E2E Tests (Phase 2)

```typescript
// e2e/phase2-profitability.spec.ts

test.describe('Phase 2: Profitability', () => {
  test('should show margin dashboard after cloud sync', async ({ page }) => {
    // 1. Log in with SMS
    await page.click('text=Sign in');
    await page.fill('input[name=phone]', '+2341234567890');
    await page.click('text=Send OTP');
    
    await page.fill('input[name=otp]', '123456');
    await page.click('text=Verify');
    
    // 2. Wait for products to sync from cloud
    await page.waitForSelector('text=Profitability');
    
    // 3. Click Profitability tab
    await page.click('text=Profitability');
    
    // 4. Verify dashboard shows margins
    const dashboard = await page.locator('[data-dashboard]');
    expect(await dashboard.isVisible()).toBe(true);
    
    const rows = await page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
    
    // 5. Verify margin color-coding
    const lowMarginCell = await page.locator('[data-margin-1.25]');
    const classes = await lowMarginCell.getAttribute('class');
    expect(classes).toContain('bg-red');  // Red for low margin
  });

  test('should accept pricing suggestion and update price', async ({ page }) => {
    // 1. Navigate to Suggestions
    await page.click('text=💡 Pricing Opportunities');
    
    // 2. See milk suggestion
    const suggestion = await page.locator('[data-suggestion-milk]');
    expect(await suggestion.isVisible()).toBe(true);
    
    // 3. Click "Try this price"
    await suggestion.locator('button', { hasText: 'Try this price' }).click();
    
    // 4. Verify price updated
    const milkProduct = await page.locator('[data-product-milk]');
    const newPrice = await milkProduct.locator('[data-selling-price]').inputValue();
    expect(newPrice).toBe('850.00');
    
    // 5. Verify synced to cloud
    await page.waitForSelector('[data-sync-status="synced"]');
  });
});
```

---

## Success Metrics (Phase 2)

**Go/No-Go Gateway (from Phase 1):**
- ✅ Phase 1 retention: 70%+ at 2-week mark
- ✅ NPS: 45+
- ✅ Zero data loss incidents
- ✅ If gate not met: Iterate on Phase 1 UX, don't move forward yet

**Phase 2 Success Criteria (at 4-week mark):**
- ✅ 15%+ conversion from free → paid tier (₦500/month)
- ✅ Users identify ≥1 repriced product based on margin data (survey)
- ✅ Retention at 30 days: 60%+
- ✅ User base: 100+ active traders
- ✅ Cloud sync success rate: 99%+ (zero lost sync mutations)
- ✅ Conflict resolution: <0.1% rejected mutations (healthy LWW)

---

## Implementation Timeline (Phase 2)

**Week 1:** Database setup, auth integration, prices table  
**Week 2:** Dashboard UI, margin calculation  
**Week 3:** Cloud sync (push mutations to Supabase)  
**Week 4:** Sync pull (fetch cloud state), conflict resolution  
**Week 5:** Pricing suggestions algorithm  
**Week 6:** E2E testing, bug fixes  
**Week 7:** Soft launch to 50 traders  
**Week 8:** Iterate based on feedback, prepare public launch

---

## Next Phase: Phase 3

Once Phase 2 is validated (retention 60%+, 15%+ paid conversion):

→ See **PHASE-3-AI.md** for AI chat, trend analysis, demand forecasting

---

## Summary

Phase 2 transforms MarketMate from "inventory tracker" to "profit analyzer". Market woman sees:
- **Which products make real money** (margin %)
- **How to reprice losers** (suggestions)
- **Cloud backup** (peace of mind)
- **Multi-device access** (flexibility)

This unlocks ₦500/month tier and 60%+ retention. Ready to build! 🚀
