# Phase 3: Make Smarter Decisions — AI & Analytics Specification
## AI Chat, Trend Analysis, Demand Forecasting, and Predictive Insights

**Document:** PHASE-3-AI.md  
**Audience:** Engineering, Product, AI/ML  
**Read time:** 25 minutes  
**Status:** Ready for build (post-Phase-2 validation)  
**Gateway:** Only start Phase 3 if Phase 2 achieves 60%+ retention, 15%+ paid conversion  

---

## Phase 3 Overview

**Goal:** Transform market woman from data tracker to data-driven strategist. AI answers her questions, predicts demand, suggests reorders, and surfaces hidden patterns.

**Timeline:** 8–12 weeks (parallel dev with Phase 2 feedback)  
**Prerequisite:** Phase 2 complete and validated (100+ users, proven profitability engine)  
**Launch target:** Week 24–28 (public launch, target 1k+ users, ₦500k+ MRR)

**Revenue:** ₦1,500/month tier (AI features, trend charts, forecasting)  
**Success metric:** 40%+ of users interact with AI chat monthly, users report taking ≥1 action based on AI hints, retention +10% post-launch

---

## What Phase 3 Adds

### New Features

1. **AI Chat Assistant** — "How much milk sold this week?" → AI answers with margin analysis
2. **Demand Trends** — Visual charts: weekly/monthly sales by product (up/down trends)
3. **Reorder Timing Hints** — "At this week's pace, sugar runs out Tuesday. Reorder Friday."
4. **Predictive Forecasting** — "Next week: expect 25% higher demand (weekend + payday coming)"
5. **Sales Performance Analysis** — "Cocoa milk: 5 tins/day avg. Saturday: 3x velocity"
6. **Pricing Benchmarking** — "Your milk price (₦850) vs. market average (₦820). Consider ₦830?"
7. **Supplier Optimization** — "Buy sugar in bulk every 2 weeks (better margin than weekly)"
8. **Seasonal Patterns** — "September sees 40% higher spice sales. Plan inventory."
9. **Profit Levers** — "Raising milk to ₦900 vs. ₦850: which is optimal given elasticity?"
10. **Actionable Alerts** — "Stock-out risk: Sugar at 20% capacity. Reorder in 24h."

### What Stays the Same

- All Phase 1 features (offline-first, quick adjustments)
- All Phase 2 features (cost tracking, margin analysis, cloud sync)
- Offline app functionality (AI is enhancement, not requirement)

---

## User Stories & Acceptance Criteria

### Story 1: AI Chat Interface

**As a** market woman  
**I want to** ask questions about my inventory in natural language  
**So that** I get insights without manually analyzing data

**Acceptance Criteria:**

- [ ] New "AI Assistant" tab on home screen
- [ ] Text input: "Ask me anything about your business"
- [ ] User types: "How much milk sold this week?"
- [ ] AI responds within 3 seconds: "You sold 24 tins of milk this week..."
- [ ] Conversation history visible (last 20 messages)
- [ ] Can ask follow-up questions: "What about last week?" → "Last week: 28 tins"
- [ ] AI understands product names, dates (week, month, today)
- [ ] Responses include: Quantity, margin, profit, trends

**Example Conversation:**

```
User: "How much milk did I sell this week?"

AI: "You sold 24 tins of milk this week (Mon–Sun). 
     Average: 3.4 tins/day.
     Sales value: ₦19,200 (at ₦800/tin)
     Profit: ₦2,880 (at 15% margin)
     
     This is 14% higher than last week (21 tins)."

User: "Why is it higher?"

AI: "Saturday and Sunday sales were 2x typical (5 tins each day).
     Likely due to: weekend = higher foot traffic.
     This pattern repeats every weekend.
     
     Recommendation: Keep 10+ tins in stock on Saturdays."

User: "What if I raise the price to ₦850?"

AI: "At ₦850/tin, assuming demand stays the same:
     - Your margin improves to 18.75% (from 15%)
     - Weekly profit: ₦3,600 (vs ₦2,880 now)
     - Extra: ₦720/week = ₦2,880/month
     
     Risk: Price elasticity unknown. Demand might drop 10–20%.
     Recommendation: Try price for 1 week, monitor sales."
```

**UI/UX Notes:**

```
┌────────────────────────────────────────────────┐
│ AI ASSISTANT                                   │
│ "Ask me about your business"                   │
├────────────────────────────────────────────────┤
│                                                │
│ AI: "You sold 24 tins of milk this week"       │
│ Sales: ₦19,200 | Profit: ₦2,880               │
│ Trend: ↑14% vs last week                       │
│                                                │
│ U: How much next week?                         │
│                                                │
│ AI: "Based on patterns, expect 26–28 tins.     │
│ Saturday sees 3x volume.                       │
│ Recommendation: Restock 30+ tins by Friday."   │
│                                                │
│ [Ask another question]                         │
│ ─────────────────────────────────────────      │
│ [Type your question...]                        │
│                                                │
└────────────────────────────────────────────────┘
```

**Technical Notes:**

- AI: Claude API (via backend, not exposed to frontend)
- On user message: Send to `/api/ai/chat` with context (user's data)
- Claude reads user's inventory + transactions, responds naturally
- Cache responses (same question within 1 hour = cached response)
- Rate limit: 10 questions/day free, unlimited at ₦1,500/month tier

---

### Story 2: Demand Trends Visualization

**As a** market woman  
**I want to** see visual trends of how products are selling  
**So that** I spot patterns (which days are busy, which products are growing/shrinking)

**Acceptance Criteria:**

- [ ] New "Trends" tab with line charts for each product
- [ ] Default: Last 30 days, sortable by product
- [ ] Chart shows: Day | Quantity Sold | Total Revenue | Average Margin
- [ ] Color-coded: Quantity (blue), Revenue (green), Margin (orange)
- [ ] Can switch view: Daily → Weekly → Monthly
- [ ] Tooltips on hover: "Aug 10: 5 tins, ₦4,000 revenue, 15% margin"
- [ ] Trend line shows direction: "↑ Trending up (12% growth last week)"
- [ ] Can compare 2 products: Side-by-side chart

**Chart Example:**

```
MILK — Last 30 Days (Daily)

Quantity Sold
│                    ╱╲
│                   ╱  ╲        ╱╲
│        ╱╲        ╱    ╲      ╱  ╲     ╱╲
│       ╱  ╲      ╱      ╲    ╱    ╲   ╱  ╲
│      ╱    ╲    ╱        ╲  ╱      ╲ ╱    ╲
└──────────────────────────────────────────────
Mon Tue Wed Thu Fri Sat Sun | Mon Tue Wed...

Pattern: Weekends (Sat–Sun) show 2x velocity
Insight: Keep extra stock Friday
```

**Technical Notes:**

- Fetch from `analytics_daily` table (materialized view, pre-computed)
- Server pre-computes daily aggregates at end of day (via cron job)
- Chart library: Recharts or Plotly (interactive, responsive)
- Cache: 1-hour TTL per product (computed once, served many times)
- Phase 3: Store 2 years of history in analytics_daily

---

### Story 3: Reorder Timing Recommendations

**As a** market woman  
**I want to** know when to restock based on my sales velocity  
**So that** I don't stock out during busy periods

**Acceptance Criteria:**

- [ ] Dashboard shows: "Milk: 5 tins left. At this week's pace (3.4/day), runs out in 1.5 days (Tuesday)"
- [ ] Recommendation: "Reorder Friday to avoid Sunday stock-out"
- [ ] Takes into account: Sales velocity, low-stock threshold, supplier lead time
- [ ] Shows confidence: "Forecast confidence: 85% (based on 4 weeks data)"
- [ ] Can set supplier lead time: "My supplier delivers next day" → adjusts recommendation
- [ ] Alert: If forecast shows stock-out risk, highlights in red

**Example:**

```
┌──────────────────────────────────────────┐
│ REORDER RECOMMENDATION                   │
│                                          │
│ Milk                                     │
│ Current: 5 tins                          │
│ Daily velocity: 3.4 tins/day              │
│ Low-stock threshold: 3 tins               │
│                                          │
│ 📉 Stock-out risk: Tuesday (1.5 days)    │
│                                          │
│ ✅ Recommendation: REORDER TODAY         │
│    Order 15+ tins                        │
│    Supplier lead time: 1 day              │
│    Will arrive Monday                    │
│                                          │
│ [Order] [Remind me tomorrow] [Dismiss]   │
└──────────────────────────────────────────┘
```

**Technical Notes:**

- Formula: Days to stock-out = (Current qty − threshold) / Daily velocity
- Daily velocity = Average sales last 7 days
- Forecast confidence = f(historical variance, min 2 weeks data)
- Alerts: If days_to_stockout < lead_time_days, show urgent alert
- Cron job: Runs every 6 hours, checks all products for recommendations

---

### Story 4: Seasonal & Cyclical Patterns

**As a** market woman  
**I want to** understand which products sell better on which days/seasons  
**So that** I plan inventory for predictable busy periods

**Acceptance Criteria:**

- [ ] Dashboard shows: "Spices: 40% higher sales in September (prep for holidays)"
- [ ] Day-of-week patterns: "Milk sells 3x on weekends vs. weekdays"
- [ ] Time-of-month patterns: "Sugar sales peak on paydays (1st, 15th)"
- [ ] Holiday alerts: "Christmas (Dec 25) typically 2x sales. Prepare inventory Oct–Nov."
- [ ] Confidence: "Pattern detected in 3+ months of data. Confidence: 90%"
- [ ] Actionable: "Next Saturday (3x volume expected). Restock 20+ tins Friday."

**Example Report:**

```
SEASONALITY ANALYSIS (Last 6 Months)

Milk Sales by Day of Week:
┌─────────────┬───────────────┬──────────┐
│ Day         │ Avg Sales     │ vs Week  │
├─────────────┼───────────────┼──────────┤
│ Monday      │ 2.1 tins/day  │ -38%     │
│ Tuesday     │ 2.5 tins/day  │ -26%     │
│ Wednesday   │ 2.8 tins/day  │ -18%     │
│ Thursday    │ 3.2 tins/day  │ -6%      │
│ Friday      │ 3.6 tins/day  │ +6%      │
│ Saturday    │ 6.4 tins/day  │ +88% ⬆   │
│ Sunday      │ 6.1 tins/day  │ +79% ⬆   │
└─────────────┴───────────────┴──────────┘

Insight: Weekend 2x weekday sales
Action: Stock 15+ tins by Friday

Spices by Month:
Sep: 40% ↑ (holiday prep)
Oct: 35% ↑
Nov: 45% ↑↑ (peak holiday)
Dec: 30% ↑
Jan–Aug: Baseline

Action: Build inventory Sep–Oct for holiday season
```

**Technical Notes:**

- Requires 3+ months of historical data (Phase 3 early, less data available)
- Algorithm: Day-of-week aggregation + seasonal decomposition
- Store results in `analytics_seasonal` table
- Confidence = R² from regression model (80%+ confidence threshold)
- Update weekly (via cron) as new data arrives

---

### Story 5: Margin Optimization Insights

**As a** market woman  
**I want to** understand which pricing changes would maximize profit  
**So that** I find the optimal balance between quantity and margin

**Acceptance Criteria:**

- [ ] AI analyzes: "Milk at ₦810 (1.25% margin) vs ₦850 (6.25% margin). Which is better?"
- [ ] Shows elasticity: "Price increase 5%: demand might drop 2–8% (based on market data)"
- [ ] Calculates both scenarios: "At ₦810: ₦200 profit/week. At ₦850: ₦720 profit/week (if no demand loss)"
- [ ] Risk analysis: "If demand drops 10%, profit still ₦650/week (best case for new price)"
- [ ] Recommendation: "Try ₦830 (middle ground) — safe increase with minimal demand risk"
- [ ] A/B test suggestion: "Test ₦830 for 1 week, monitor sales"

**Example:**

```
MARGIN OPTIMIZATION: Milk

Current state:
- Price: ₦810/tin
- Margin: 1.25% (₦10/tin)
- Weekly sales: 20 tins
- Weekly profit: ₦200

Scenario 1: Raise to ₦850
- New margin: 6.25% (₦50/tin)
- Elasticity risk: -5% to -15% demand loss (market est.)
- Conservative (15% loss): 17 tins, ₦850 profit (+325%)
- Optimistic (5% loss): 19 tins, ₦950 profit (+375%)
- Risk: If demand drops >25%, profit falls

Scenario 2: Raise to ₦830 (middle ground)
- New margin: 3.75% (₦30/tin)
- Elasticity risk: -2% to -5% demand loss
- Conservative: 19 tins, ₦570 profit (+185%)
- Optimistic: 19.5 tins, ₦585 profit (+192%)

RECOMMENDATION: Try ₦830
- Lower risk than ₦850
- Still significant profit increase (2–3x)
- High success probability if market sees value
- Test for 1 week, revert if demand drops >15%
```

**Technical Notes:**

- Elasticity data: Use historical price changes (in user's data) + market benchmarks
- Scenario modeling: Run monte carlo simulation (1k iterations)
- Profit calculation: (new_price − cost) × estimated_quantity
- Recommendation algorithm: Maximize expected profit subject to risk constraints
- Store results in `ai_cache` table for quick retrieval

---

### Story 6: Supplier & Procurement Optimization

**As a** market woman  
**I want to** understand which suppliers are best and when to buy in bulk  
**So that** I maximize margin and minimize stock-outs

**Acceptance Criteria:**

- [ ] Track costs per supplier: "Kano supplier: ₦500/tin, Lagos: ₦520/tin"
- [ ] Bulk discount alerts: "Buying 20+ tins: ₦480/tin (4% discount)"
- [ ] Supplier comparison: "Best price this month: Kano at ₦500"
- [ ] Bulk buy recommendation: "Buy 30 tins from Kano (2-week supply) → ₦480/tin = ₦14,400"
- [ ] Frequency optimization: "Weekly orders waste time. Buy 2-week supply every 14 days."
- [ ] Supplier reliability: "Kano: 95% on-time delivery. Lagos: 70%. Prefer Kano."

**Example:**

```
SUPPLIER ANALYSIS

Milk Suppliers (Last 3 Months):

┌──────────┬───────────┬──────────┬──────────┬───────────┐
│ Supplier │ Avg Price │ Bulk Min │ Lead    │ On-time   │
├──────────┼───────────┼──────────┼──────────┼───────────┤
│ Kano     │ ₦500      │ 20 tins  │ 1 day   │ 95% ✅    │
│ Lagos    │ ₦520      │ 10 tins  │ 2 days  │ 70% ⚠️    │
│ Ibadan   │ ₦510      │ 15 tins  │ 2 days  │ 85%       │
└──────────┴───────────┴──────────┴──────────┴───────────┘

Best Deal: Kano at ₦500/tin
Current Purchase: 10 tins every 3 days = ₦5,000/order

Optimization: Buy 30 tins from Kano every 14 days
- Bulk price: ₦480/tin (4% discount)
- Order cost: ₦14,400 (same 2-week supply)
- Savings: ₦600 every 2 weeks = ₦2,400/month
- Margin improves from 1.25% to 4.25%

ACTION: Place bulk order with Kano for 30 tins
```

**Technical Notes:**

- Source: Purchase history (restocks) + user notes on suppliers/prices
- Track: Supplier name, cost per unit, order quantities, delivery time
- Optimization: Determine optimal order quantity based on demand variance + holding cost
- Bulk discount calculation: Weighted average of bulk vs. small orders

---

## Database Schema (Phase 3 Extensions)

### New Table: `ai_cache`

```sql
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  query_hash TEXT NOT NULL,
  -- SHA-256 hash of user's question (for quick lookup)
  
  user_query TEXT NOT NULL,
  -- Full question: "How much milk sold this week?"
  
  ai_response TEXT NOT NULL,
  -- Full AI response (cached)
  
  metadata JSONB,
  -- { model: "claude-3-sonnet", tokens: 150, latency_ms: 240 }
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  -- Auto-expire after 7 days (data changes, response stale)
  
  UNIQUE (user_id, query_hash)
);

CREATE INDEX idx_ai_cache_user_created ON ai_cache(user_id, created_at DESC);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
```

### New Table: `analytics_daily`

```sql
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id),
  
  date DATE NOT NULL,
  -- Example: 2026-08-11
  
  product_id TEXT,
  -- NULL = aggregate across all products
  
  total_sales_quantity INT DEFAULT 0,
  total_sales_value DECIMAL(12, 2) DEFAULT 0,
  
  total_restock_quantity INT DEFAULT 0,
  total_restock_value DECIMAL(12, 2) DEFAULT 0,
  
  products_low_stock INT DEFAULT 0,
  
  total_profit DECIMAL(12, 2) DEFAULT 0,
  -- Calculated: SUM((selling_price - cost) * quantity)
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (user_id, date, product_id)
);

CREATE INDEX idx_analytics_daily_user_date
ON analytics_daily(user_id, date DESC);
```

### New Table: `analytics_seasonal`

```sql
CREATE TABLE analytics_seasonal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  
  period_type TEXT CHECK (period_type IN ('day_of_week', 'day_of_month', 'month')),
  -- Which aggregation: Mon/Tue/... OR 1/2/3/... (day of month) OR Jan/Feb/...
  
  period_value TEXT,
  -- Example: "Saturday", "15th", "September"
  
  avg_quantity_sold DECIMAL(10, 2),
  avg_sales_value DECIMAL(12, 2),
  
  variance DECIMAL(10, 2),
  confidence DECIMAL(5, 2),
  -- R² score (0–100)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_seasonal_user_product
ON analytics_seasonal(user_id, product_id);
```

---

## API Endpoints (Phase 3)

### AI Chat Endpoint

#### POST `/api/ai/chat`

```http
POST /api/ai/chat HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "How much milk sold this week?",
  "context": {
    "productId": "milk-id",
    "timeRange": "week",
    "includeMargin": true
  }
}
```

**Response (200):**
```json
{
  "response": "You sold 24 tins of milk this week (Mon–Sun). Average: 3.4 tins/day. Sales value: ₦19,200 (at ₦800/tin). Profit: ₦2,880 (at 15% margin). This is 14% higher than last week (21 tins).",
  "confidence": 0.95,
  "sources": [
    {
      "type": "transaction_analysis",
      "data": { "totalQty": 24, "avgPerDay": 3.4, "totalValue": "19200.00" }
    },
    {
      "type": "trend_analysis",
      "data": { "weekOverWeekChange": 14 }
    }
  ],
  "suggestions": [
    "Weekend sales 2x weekday. Keep 10+ tins in stock Saturdays.",
    "Consider raising price to ₦850 (6.25% margin vs 1.25% now)."
  ]
}
```

### Trends Endpoint

#### GET `/api/analytics/trends`

```http
GET /api/analytics/trends?productId=milk-id&period=month&granularity=daily HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "productId": "milk-id",
  "productName": "Milk",
  "period": "month",
  "data": [
    {
      "date": "2026-08-11",
      "quantity": 5,
      "revenue": "4000.00",
      "profit": "600.00",
      "margin": 15
    }
  ],
  "summary": {
    "totalQty": 120,
    "totalRevenue": "96000.00",
    "totalProfit": "14400.00",
    "avgMargin": 15,
    "trend": "stable"
  }
}
```

### Recommendations Endpoint

#### GET `/api/ai/recommendations`

```http
GET /api/ai/recommendations?type=reorder_timing HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "recommendations": [
    {
      "type": "reorder_timing",
      "productId": "milk-id",
      "productName": "Milk",
      "currentQty": 5,
      "dailyVelocity": 3.4,
      "daysToStockout": 1.5,
      "recommendedAction": "Reorder today",
      "confidence": 0.85,
      "rationale": "At current pace (3.4 tins/day), stock runs out Tuesday. Reorder Friday for weekend buffer."
    },
    {
      "type": "pricing_optimization",
      "productId": "milk-id",
      "currentPrice": "810.00",
      "suggestedPrice": "830.00",
      "expectedProfitIncrease": "185–192%",
      "risk": "medium",
      "rationale": "Margin improves with conservative demand risk."
    }
  ]
}
```

### Seasonality Endpoint

#### GET `/api/analytics/seasonality`

```http
GET /api/analytics/seasonality?productId=milk-id&periodType=day_of_week HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "productId": "milk-id",
  "productName": "Milk",
  "periodType": "day_of_week",
  "patterns": [
    {
      "period": "Saturday",
      "avgQuantity": 6.4,
      "indexVsAverage": 188,
      "confidence": 0.9
    },
    {
      "period": "Sunday",
      "avgQuantity": 6.1,
      "indexVsAverage": 179,
      "confidence": 0.9
    },
    {
      "period": "Monday",
      "avgQuantity": 2.1,
      "indexVsAverage": 62,
      "confidence": 0.85
    }
  ],
  "keyInsight": "Weekend (Sat–Sun) sees 2x weekday velocity. Keep 15+ tins in stock by Friday."
}
```

---

## Testing Strategy (Phase 3)

### Unit Tests

```typescript
// __tests__/lib/forecasting.test.ts

import { forecastDaysToStockout, elasticityModel } from '@/lib/forecasting';

describe('Forecasting', () => {
  it('should calculate days to stockout', () => {
    const result = forecastDaysToStockout({
      currentQty: 5,
      dailyVelocity: 3.4,
      threshold: 0
    });
    expect(result).toBeCloseTo(1.47, 1);  // 5 / 3.4 ≈ 1.47 days
  });

  it('should model price elasticity', () => {
    const result = elasticityModel({
      currentPrice: 810,
      suggestedPrice: 850,
      historicalDemand: 20,  // tins/week
      marketElasticity: -0.5
    });
    // Price +5%, demand -2.5%
    expect(result.expectedQty).toBe(19.5);
    expect(result.expectedProfit).toBeGreaterThan(200);  // Profit increases
  });
});

describe('Seasonality', () => {
  it('should detect day-of-week patterns', () => {
    const data = [
      { dayOfWeek: 'Saturday', qty: 6.4 },
      { dayOfWeek: 'Sunday', qty: 6.1 },
      { dayOfWeek: 'Monday', qty: 2.1 }
    ];

    const patterns = detectSeasonality(data, 'day_of_week');
    expect(patterns[0].period).toBe('Saturday');
    expect(patterns[0].indexVsAverage).toBeGreaterThan(150);  // 150%+ of avg
  });
});
```

### E2E Tests (Phase 3)

```typescript
// e2e/phase3-ai.spec.ts

test.describe('Phase 3: AI Assistant', () => {
  test('should respond to inventory queries', async ({ page }) => {
    // 1. Navigate to AI Assistant tab
    await page.click('text=AI Assistant');

    // 2. Ask question
    await page.fill('input[placeholder="Ask me..."]', 'How much milk sold this week?');
    await page.press('input', 'Enter');

    // 3. Verify response appears within 3 seconds
    const response = await page.waitForSelector('[data-ai-response]', { timeout: 3000 });
    expect(await response.isVisible()).toBe(true);

    // 4. Verify response includes key data
    const text = await response.textContent();
    expect(text).toContain('tins');
    expect(text).toContain('week');
    expect(text).toContain('profit');
  });

  test('should show trends visualization', async ({ page }) => {
    // 1. Navigate to Trends
    await page.click('text=Trends');

    // 2. Select product
    await page.selectOption('select[name=product]', 'milk-id');

    // 3. Verify chart renders
    const chart = await page.waitForSelector('[data-chart-trends]');
    expect(await chart.isVisible()).toBe(true);

    // 4. Hover on data point
    const dataPoint = await page.locator('[data-point="aug-11"]');
    await dataPoint.hover();

    // 5. Verify tooltip appears
    const tooltip = await page.locator('[data-tooltip]');
    expect(await tooltip.isVisible()).toBe(true);
    expect(await tooltip.textContent()).toContain('Aug 11');
  });

  test('should show reorder recommendation', async ({ page }) => {
    // 1. Go to Dashboard
    await page.goto('/');

    // 2. Look for reorder alert (if stock < threshold)
    const alert = await page.locator('[data-reorder-alert]');
    
    if (await alert.isVisible()) {
      // 3. Verify alert shows timing
      const text = await alert.textContent();
      expect(text).toContain('Reorder');
      expect(text).toMatch(/\d+ (hour|day)s?/);  // Time frame
      
      // 4. Click to see details
      await alert.click();
      
      // 5. Verify details modal
      const modal = await page.locator('[data-reorder-details]');
      expect(await modal.isVisible()).toBe(true);
    }
  });
});
```

---

## Success Metrics (Phase 3)

**Go/No-Go Gateway (from Phase 2):**
- ✅ Phase 2 retention: 60%+ at 4-week mark
- ✅ Paid conversion: 15%+
- ✅ Cloud sync: 99%+ success rate
- ✅ If gate not met: Iterate on Phase 2, don't move forward

**Phase 3 Success Criteria (at 4-week mark):**
- ✅ 40%+ of users interact with AI chat monthly
- ✅ Users report taking ≥1 action based on AI hints (survey)
- ✅ Retention increases 10%+ post-AI launch
- ✅ Premium tier (₦1,500/month) achieves 10%+ conversion
- ✅ AI response latency: <3 seconds (99th percentile)
- ✅ User base: 1,000+ active traders
- ✅ MRR: ₦500k+ (goal for sustainability)

---

## Implementation Timeline (Phase 3)

**Week 1–2:** Database setup, analytics aggregation (daily/seasonal tables)  
**Week 3–4:** AI chat endpoint (Claude API integration), caching  
**Week 5–6:** Trends visualization (Recharts), reorder recommendations  
**Week 7–8:** Pricing optimization engine (elasticity modeling)  
**Week 9:** Seasonality detection, supplier analysis  
**Week 10:** E2E testing, performance optimization  
**Week 11:** Soft launch to existing 100+ users  
**Week 12:** Iterate based on feedback, prepare public launch

---

## Next Steps After Phase 3

**Possible Phase 4 (Future):**
- Multi-user shops (allow employees to access same inventory)
- Supplier integration (auto-order from suppliers)
- Payment integration (accept mobile money payments)
- Regional expansion (add Francophone, Portuguese versions)
- Enterprise features (multi-location shops)

---

## Summary

Phase 3 transforms Trackkit from "profit analyzer" to "AI business advisor". Market woman:
- **Asks questions in plain English** (no manual calculations)
- **Sees demand patterns** (which days are busy, which seasons matter)
- **Gets reorder hints** (avoid stock-outs with confidence)
- **Optimizes pricing** (balance margin vs. demand elasticity)
- **Learns supplier strategy** (bulk buying, supplier switching)

This unlocks ₦1,500/month tier, 40%+ AI usage, 10%+ retention lift. 

**Goal: 1k+ users, ₦500k+ MRR, sustainable unit economics.** 🚀
