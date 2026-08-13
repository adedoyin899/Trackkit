# Prompt Pack: Phase 3 Build (Make Smarter Decisions)
## Sequential Prompts for Claude Code — Copy-Paste Ready

**Document:** PROMPT-PACK-PHASE-3.md  
**Audience:** Developers using Claude Code  
**Read time:** 15 minutes (reference during build)  
**Prerequisites:** Phase 1 & 2 complete and deployed, validated in production  

---

## 📋 Quick Summary

**What you're building:** AI-powered insights (chat, demand trends, reorder recommendations)

**What's already done (Phase 1 + 2):**
- Offline inventory tracking
- Cloud sync with conflict resolution
- Cost tracking & margin analysis
- Purchase history & supplier comparison
- Authenticated users with JWT
- PostgreSQL database with transaction history

**What Phase 3 adds:**
- AI chat assistant (Claude API)
- Sales trend visualization (weekly, monthly)
- Demand forecasting ("At this pace, you'll run out Tuesday")
- Reorder timing hints ("Buy Friday for weekend sales")
- AI cache (avoid re-computing same insights)
- Analytics materialization (daily rollups for fast queries)

**Why this matters:**
- Market women stop guessing, start predicting
- Higher margins (buy ahead of demand spikes)
- Lower stock-outs (avoid Friday surprises)
- Happier users = higher retention & premium tier conversion

**Expected timeline:** 8–12 weeks (can overlap with Phase 2's final weeks)

---

## Context Carryover Strategy

Same as Phase 2: Each prompt includes references, acceptance criteria, files to modify, and context for the next prompt.

**Key difference:** Phase 3 is more exploratory (AI can fail gracefully, trends are estimates). No data loss, but bad AI insights shouldn't break the app.

---

## PROMPT 1: Set Up AI Chat Infrastructure

**Purpose:** Integrate Claude API, cache responses, build chat UI

**Copy-paste this to Claude Code:**

```
I'm building Phase 3 of MarketMate (Make Smarter Decisions).

Phase 1 & 2 are deployed and validated in production.

Reference docs:
- PHASE-3-AI.md (full Phase 3 spec)
- API-REFERENCE.md (AI/chat endpoints section)
- ARCHITECTURE.md (Phase 3 architecture)
- DATABASE-SCHEMA.md (Phase 3 tables: ai_cache, analytics_daily)

## Task 1: Set Up Claude API Access
1. Create Anthropic account: https://console.anthropic.com
2. Create API key
3. Add to Vercel env vars:
   - ANTHROPIC_API_KEY (server-side only!)
4. Install client: `npm i @anthropic-ai/sdk`

## Task 2: Create AI Chat Backend Route
Create: `pages/api/ai/chat.ts`

Endpoint: POST /api/ai/chat
Authentication: Requires JWT
Input:
```json
{
  "message": "How much milk sold this week?",
  "context": {
    "productId": "optional-product-uuid",
    "timeRange": "day|week|month"
  }
}
```

Logic:
1. Extract user_id from JWT
2. Fetch relevant inventory data (products, transactions)
3. Check ai_cache:
   - Hash the message: `sha256(message + productId + timeRange)`
   - If cache hit (and <7 days old): Return cached response
4. If cache miss, call Claude API:
   ```typescript
   const response = await anthropic.messages.create({
     model: 'claude-3-5-sonnet-20241022',
     max_tokens: 1024,
     system: `You are a market trader's assistant. Help market women in Lagos/Accra make smart inventory decisions.
              You have access to their: products, sales history, costs, margins.
              Be concise (2-3 sentences). Use currency: ₦ for Nigerian Naira.
              If asked "How much milk sold?", analyze transactions and respond with: number, daily average, trend, margin, action.
              Example: "You sold 24 tins of milk this week (3.4/day avg). Margin: 12% per tin = ₦2,880 profit. Buy more Friday for weekend."`,
     messages: [
       {
         role: 'user',
         content: `User data: ${JSON.stringify(userContext)}. User question: "${message}"`
       }
     ]
   });
   ```

5. Store in ai_cache (even if error, for resilience)
6. Return response with confidence score (always ≥0.5, or user sees "This might not be accurate")

Error handling:
- API rate limit (429) → Return cached response if available, else generic message
- API error → Don't crash, return: { response: "Sorry, AI service unavailable. Try again.", confidence: 0 }

## Task 3: Create AI Chat UI Component
Create: `components/AIChat.tsx`

Layout:
1. Chat window (scrollable):
   - System message: "Hi! Ask me about your sales, margins, or reorder strategy."
   - Messages bubble list (user left, AI right)
   - User messages in blue, AI in gray

2. Input area:
   - Text field: "Ask something..."
   - Send button
   - Loading spinner while waiting for AI response

3. Suggested prompts (chips):
   - "How much {product} sold this week?"
   - "Which products need restocking?"
   - "How's my profit margin?"
   - "Best time to buy milk?"

On message send:
- [ ] Add to chat immediately (optimistic)
- [ ] POST /api/ai/chat with message
- [ ] Show loading state
- [ ] Add AI response to chat
- [ ] Handle errors gracefully (show error message but keep chat history)
- [ ] Scroll to latest message

## Task 4: Create Chat History Storage
Create: `hooks/useAIChat.ts`

Functionality:
- `chat: Message[]` (from Zustand)
- `sendMessage(text: string)` → Call API, add to chat
- `clearChat()` → Clear history
- `getChatHistory()` → Persist to localStorage (or SQLite locally)

Each message:
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  // For AI responses: confidence that answer is accurate
}
```

## Task 5: Add Chat Screen to Navigation
Update app navigation to include new "Insights" or "AI" tab

Show:
- [ ] AI Chat as main feature
- [ ] Quick stat cards: "Total sold this week", "Avg margin", "Products low stock"
- [ ] Suggested questions

## Task 6: Test AI Chat
1. Ask: "How much milk sold this week?"
   - [ ] AI responds with transaction data
   - [ ] Response makes sense (includes qty, dates, margins)
   - [ ] Response is concise (2-3 sentences)

2. Ask: "Which products need restocking?"
   - [ ] AI identifies low-stock items
   - [ ] Mentions threshold reached soon

3. Ask: "What should I buy Friday?"
   - [ ] AI suggests best-sellers
   - [ ] References margin/profit

4. Go offline (DevTools):
   - [ ] Chat still works (sends messages when online)
   - [ ] Cached responses work offline

5. Test caching:
   - [ ] Ask same question twice
   - [ ] Second response is instant (cached)

## Acceptance Criteria
✅ Claude API integrated
✅ Chat interface working
✅ Responses make sense and are helpful
✅ Caching prevents duplicate API calls
✅ Works offline (cached responses)
✅ Error handling doesn't crash app
✅ User can clear chat history

Context for next prompt:
- AI chat working
- Users can ask questions
- Responses cached for performance
- Next: Add trend visualization (charts)
```

**After completing:** Report back with:
- [ ] AI chat working end-to-end
- [ ] Responses making sense
- [ ] Caching working (verified in Sentry)
- [ ] Graceful error handling

---

## PROMPT 2: Implement Sales Trends & Visualizations

**Purpose:** Show weekly/monthly sales charts, identify patterns (e.g., "weekends are 3x busier")

**Copy-paste this to Claude Code:**

```
Phase 3 Progress: AI chat working. Next: Trend visualization.

Reference docs:
- PHASE-3-AI.md (trends & forecasting section)
- DATABASE-SCHEMA.md (analytics_daily table)
- API-REFERENCE.md (/api/analytics/trends endpoint)

## Context from Previous Prompt
- AI chat working (users asking questions)
- Transaction history available
- Now: Visualize sales patterns

## Task 1: Create Analytics API Endpoint
Create: `pages/api/analytics/trends.ts`

GET /api/analytics/trends?productId={id}&period=week|month&offset=0:
1. Fetch transactions for user (filtered by product, date)
2. Group by day (or week if period=month)
3. Calculate for each day:
   - totalSalesQty (sum of sale transactions)
   - totalSalesValue (qty * selling_price)
   - totalProfit (qty * margin_per_unit)
   - averagePricePerUnit
4. Return with summary:
   - Total sales (qty, value, profit)
   - Avg per day
   - Best day (highest sales)
   - Worst day
5. Optional: Forecast next period:
   - Linear regression on sales trend
   - Estimated qty next week: "At this pace, ~170 units"

Example response:
```json
{
  "data": [
    {
      "date": "2026-08-11",
      "salesQuantity": 18,
      "salesValue": "14400.00",
      "profit": "1728.00",
      "pricePerUnit": "800.00"
    },
    {
      "date": "2026-08-10",
      "salesQuantity": 22,
      "salesValue": "17600.00",
      "profit": "2112.00",
      "pricePerUnit": "800.00"
    }
  ],
  "summary": {
    "totalQty": 168,
    "totalValue": "134400.00",
    "totalProfit": "16128.00",
    "avgPerDay": 24
  },
  "forecast": {
    "nextWeekEstimate": 170,
    "confidence": 0.82,
    "trend": "stable"
  }
}
```

## Task 2: Create Materialized Analytics View (Daily Rollups)
Create: `pages/api/admin/refresh-analytics.ts` (run daily via cron or scheduled task)

Purpose: Pre-compute daily sales summaries so charts load fast

Pseudo-code:
```typescript
async function refreshAnalyticsDailyRollups(userId: string) {
  // For each day in the past 90 days:
  for (let date = today - 90; date <= today; date++) {
    const dailyTransactions = await getTransactions(userId, date);
    
    // Aggregate
    const totalQty = sum(transactions.qty);
    const totalValue = sum(transactions.qty * transactions.price);
    const profit = sum(transactions.qty * transactions.margin);
    
    // Upsert into analytics_daily table
    await upsertAnalyticsDaily({
      userId,
      date,
      totalQty,
      totalValue,
      profit,
      productsLowStock: countLowStockOnDate(date)
    });
  }
}
```

In production: Run this daily (11 PM local time) to pre-compute trends.

## Task 3: Create Trend Visualization Component
Create: `components/SalesChart.tsx`

Use: recharts library (`npm i recharts`)

Chart type:
- Line chart (default)
- X-axis: Date (formatted nicely)
- Y-axis: Sales quantity OR Sales value OR Profit
- Toggle buttons to switch between metric

Features:
- [ ] Hover tooltip (shows exact value for that day)
- [ ] Legend (if multiple lines)
- [ ] Responsive (mobile-friendly)
- [ ] Color-coded (green for profit, blue for sales qty)
- [ ] Period buttons (1 week, 1 month, 3 months)

Example:
```
┌────────────────────────────────────────────┐
│ SALES TRENDS                               │
├────────────────────────────────────────────┤
│ [1W]  [1M]  [3M]                           │
│                                            │
│ 25 ┤                                  ╱╲  │
│    │              ╱╲          ╱╲  ╱╲ ╱  │
│ 20 ┤            ╱  ╲      ╱╲╱  ╲╱  ╱   │
│    │          ╱      ╲  ╱                │
│ 15 ┤        ╱          ╲╱                │
│    └────────────────────────────────────  │
│      M  T  W  T  F  S  S  (Aug 5-11)    │
│                                            │
│ Highest: 22 units (Wed)                   │
│ Lowest: 15 units (Mon)                    │
│ Trend: 📈 Improving (+5% WoW)             │
└────────────────────────────────────────────┘
```

## Task 4: Create Product Trends Screen
Create: `pages/trends.tsx`

Screen layout:
1. Period selector (1W / 1M / 3M / YTD)
2. Metric toggles (Qty sold, Revenue, Profit)
3. Sales chart (recharts line chart)
4. Summary stats below chart:
   - Total sold, avg per day, best day, worst day
   - Weekly comparison: "↑ +12% vs last week"
   - Trend arrow & direction

5. Insights section (powered by AI):
   - "Weekends are 3x busier. Stock up Friday."
   - "Summer peak: Buy now, sell fast."
   - "Milk sales: Down 20% from summer average."

6. Product filter:
   - Show trends for single product, or all products combined
   - Toggle between product view and category view

## Task 5: Add Trend Summaries to Dashboard
Update: Home screen / Dashboard

Add card: "Sales Trends"
- Small sparkline chart (minimal)
- "↑ +8% vs last week"
- Tap to see full trends

## Task 6: Test Trends
1. View trends for last week:
   - [ ] Chart loads with correct data
   - [ ] Hover shows daily values
   - [ ] Summary stats correct

2. Switch period (1W → 1M):
   - [ ] Chart updates
   - [ ] Scales adjust (Y-axis)

3. Filter by product:
   - [ ] Chart updates to show only that product
   - [ ] Summary updates

4. AI insights:
   - [ ] Shows pattern interpretation
   - [ ] Suggestions make sense

## Acceptance Criteria
✅ Trends API working
✅ Charts render correctly
✅ Period/product filters work
✅ Insights shown
✅ Data accurate (matched against raw transactions)
✅ Charts load fast (materialized analytics helping)

Context for next prompt:
- Trend visualization working
- Users can see sales patterns
- AI giving insights
- Next: Add reorder recommendations
```

**After completing:** Report back with:
- [ ] Trends API working
- [ ] Charts rendering correctly
- [ ] Filters and toggles working
- [ ] Insights showing

---

## PROMPT 3: Implement Reorder Recommendations & Forecasting

**Purpose:** "At this pace, you'll run out Tuesday. Reorder Friday morning." Timing guidance.

**Copy-paste this to Claude Code:**

```
Phase 3 Progress: Trends visualized. Next: Reorder intelligence.

Reference docs:
- PHASE-3-AI.md (reorder timing & forecasting)
- API-REFERENCE.md (AI chat endpoint, can integrate here)

## Context from Previous Prompts
- AI chat working
- Trends/forecasts available
- Now: Actionable reorder recommendations

## Task 1: Create Reorder Recommendation Algorithm
Create: `lib/reorder-recommendation.ts`

Logic for each product:
```typescript
function getReorderRecommendation(product: Product) {
  // 1. Calculate daily sell-through rate
  const avgDailySalesQty = getAverageDailySales(product.id, last7Days);
  
  // 2. Check day-of-week patterns
  const dayOfWeekFactor = getDayOfWeekMultiplier(today);
  // Example: Friday is 1.5x normal (market prep), Sunday is 0.5x
  
  // 3. Forecast when stock runs out
  const projectedRunOutDate = calculateStockOutDate(
    product.currentQuantity,
    avgDailySalesQty * dayOfWeekFactor
  );
  // Result: "Stock runs out Tuesday 2PM"
  
  // 4. Recommend reorder timing
  // Assume 1-day delivery from supplier
  const recommendedReorderDate = projectedRunOutDate - 1.5 days;
  // Result: "Reorder Monday evening or Tuesday morning"
  
  // 5. Recommend quantity
  // Buy for next 2 weeks + 20% buffer
  const recommendedQty = (avgDailySalesQty * 14) * 1.2;
  
  return {
    product: product.name,
    currentQty: product.currentQuantity,
    daysOfStock: Math.floor(product.currentQuantity / avgDailySalesQty),
    runOutDate: projectedRunOutDate,
    urgency: 'high' | 'medium' | 'low',  // high if <3 days
    recommendedDate: recommendedReorderDate,
    recommendedQty: recommendedQty,
    suggestedSupplier: getBestSupplierForProduct(product.id),
    message: "Buy {qty} units from {supplier} by {date} to avoid stock-out on {runOutDate}"
  };
}
```

## Task 2: Create Reorder API Endpoint
Create: `pages/api/reorder/recommendations.ts`

GET /api/reorder/recommendations:
- Fetch all products for user
- Get reorder rec for each
- Sort by urgency (high first)
- Return recommendations + summary

Example response:
```json
{
  "recommendations": [
    {
      "productId": "milk-1",
      "productName": "Milk",
      "urgency": "high",
      "currentQty": 3,
      "runOutDate": "2026-08-13T14:00:00Z",
      "recommendedQty": 60,
      "recommendedDate": "2026-08-12",
      "message": "Buy 60 tins from Lagos Dairy by Tuesday 5PM to avoid Thursday stock-out",
      "supplier": "Lagos Dairy",
      "estimatedCost": "48000.00"
    },
    {
      "productId": "sugar-1",
      "productName": "Sugar",
      "urgency": "medium",
      "currentQty": 20,
      "runOutDate": "2026-08-20",
      "recommendedQty": 100,
      "recommendedDate": "2026-08-18",
      "message": "Buy 100 bags from Kano Wholesale by Sunday to prepare for next week"
    }
  ],
  "summary": {
    "urgentReorders": 1,
    "mediumReorders": 2,
    "lowReorders": 3,
    "estimatedTotalCost": "125000.00"
  }
}
```

## Task 3: Create Reorder Recommendations Screen
Create: `pages/reorder.tsx`

Screen layout:
1. Urgency filter (All / High / Medium / Low)
2. Recommendations list:
   For each product:
   - Product name + current qty
   - 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW urgency
   - Stock-out date & recommended reorder date
   - Suggested supplier & quantity
   - Estimated cost
   - Action buttons: "Mark as ordered" / "Order online" (if integrated)

3. Summary section:
   - Total recommendations
   - Est. total cost to restock all
   - Timeline: "Reorder by Friday to avoid 3 stock-outs"

Example:
```
┌─────────────────────────────────────────┐
│ REORDER STRATEGY                        │
├─────────────────────────────────────────┤
│ [All]  [🔴 High]  [🟡 Medium]  [🟢 Low]│
│                                         │
│ 🔴 MILK (3 tins left)                  │
│    Stock out: Wed 2PM                   │
│    Reorder: Tue 5PM                     │
│    Qty: 60 tins @ ₦800 = ₦48,000       │
│    From: Lagos Dairy (cheapest)         │
│    [✓ Order]  [Edit]                   │
│                                         │
│ 🟡 SUGAR (20 bags left)                 │
│    Stock out: Aug 20                    │
│    Reorder: Aug 18                      │
│    Qty: 100 bags @ ₦50 = ₦5,000        │
│    From: Kano Wholesale                 │
│    [✓ Order]  [Edit]                   │
│                                         │
│ SUMMARY                                 │
│ Total to restock: ₦125,000              │
│ Action needed by: Friday 5PM            │
│ Budget alert: 🟡 High spend             │
└─────────────────────────────────────────┘
```

## Task 4: Integration with AI Chat
Enhance AI chat to include reorder hints:

When user asks: "What should I buy?"
AI response includes:
- Products needing restock (urgency)
- Recommended quantities
- Supplier & cost
- Timing

Example AI response:
"Based on your sales, buy 60 tins of milk by Tuesday (runs out Wed), and 100 bags of sugar by Sunday (runs out Aug 20). Total: ₦53k. Lagos Dairy has best milk price (₦790)."

## Task 5: Add Notifications (Optional)
Create: `components/ReorderNotification.tsx`

Show badge on app icon if reorder urgent:
- "⚠️ 3 items need reordering"
- Show in notification center
- Option to receive SMS reminder

## Task 6: Test Reorder Logic
1. Create test scenario:
   - Milk: 10 tins, selling 2/day → Runs out in 5 days
   - Sugar: 30 bags, selling 5/day → Runs out in 6 days

2. View reorder recommendations:
   - [ ] Milk marked as urgent (high)
   - [ ] Sugar marked as medium
   - [ ] Dates calculated correctly
   - [ ] Supplier & cost shown

3. Ask AI: "What should I buy?"
   - [ ] AI mentions milk & sugar
   - [ ] Gives recommended quantities
   - [ ] Suggests Friday ordering

4. Edge cases:
   - [ ] Product with <1 day stock: Shows as critical
   - [ ] Product with >30 days stock: Shows as low urgency
   - [ ] No sales data: Shows conservative estimate

## Acceptance Criteria
✅ Reorder recommendations accurate
✅ Stock-out dates calculated correctly
✅ Recommended dates logical (account for delivery time)
✅ Urgency levels set correctly
✅ AI integrates recommendations into chat
✅ Suppliers & costs shown
✅ UI clear and actionable

Context for next prompt:
- Reorder recommendations working
- AI giving timing guidance
- Users know what to buy and when
- Next: Polish, test, deploy Phase 3
```

**After completing:** Report back with:
- [ ] Reorder algorithm working correctly
- [ ] Dates calculated properly
- [ ] AI integration complete
- [ ] Edge cases handled

---

## PROMPT 4: Testing, Analytics Setup & Phase 3 Deployment

**Purpose:** Run full test suite, enable analytics dashboards, deploy to production

**Copy-paste this to Claude Code:**

```
Phase 3 Progress: All features built (chat, trends, reorder). Final step: Test + Deploy.

Reference docs:
- PHASE-3-AI.md (success metrics)
- DEPLOYMENT-&-INFRA.md (monitoring setup)

## Context from Previous Prompts
- Phase 1 & 2 deployed and stable (100+ users)
- Phase 3 built (AI chat, trends, reorder recommendations)
- Now: Verify quality, deploy to production, measure impact

## Task 1: Run Full Phase 3 Test Suite
1. Unit tests:
   - [ ] npm test (100% pass)
   - [ ] reorder-recommendation.ts tests
   - [ ] Forecast calculations (stock-out dates)
   - [ ] AI chat response tests (doesn't crash)

2. E2E tests (Playwright):
   - [ ] Ask AI question → Get response
   - [ ] View trends chart → Loads and interactive
   - [ ] Check reorder recommendations → Correct urgency
   - [ ] Offline: Ask question, go online → Sends and caches
   - [ ] AI forecasting: Log transactions, verify forecast

Run: `npm run test:e2e`

## Task 2: Analytics Setup
1. Enable dashboard metrics (Supabase):
   - [ ] Users: Total, DAU, WAU, retention
   - [ ] Feature adoption: % using AI chat, % viewing trends
   - [ ] AI quality: Response times, cache hit rate
   - [ ] Performance: API latency, error rates

2. Create Grafana dashboard (optional):
   - Graphs: DAU, AI chat usage, trend views, reorder adoption
   - Alerts: If API latency >1s, error rate >5%

3. Set up Sentry alerts:
   - [ ] AI API errors (Claude rate limits, etc)
   - [ ] Forecast calculation errors
   - [ ] Sync failures during peak load

## Task 3: User Testing (Soft Launch to 50 Users)
1. Invite 50 users from Phase 2 cohort:
   - "New feature! AI market advisor"
   - "Ask: How much milk sold this week?"
   - "See sales trends + reorder strategy"

2. Measure for 2 weeks:
   - [ ] AI chat adoption (% who try it)
   - [ ] Questions asked (most common: profit? reorder timing?)
   - [ ] Trends viewed (% viewing weekly trends)
   - [ ] Reorder adoption (% using recommendations)
   - [ ] NPS (survey)
   - [ ] Bug reports (Sentry)

3. Key metrics:
   - AI chat sessions per user (target: 2+ per week)
   - Reorder recommendations acted on (target: >50%)
   - Trend views per user (target: 3+ per week)

## Task 4: AI Tuning (If Needed)
If AI responses aren't good:
- Refine system prompt (be more specific)
- Add few-shot examples
- Add guardrails (e.g., "confidence <0.5 → don't guess")
- Consider upgrading to Claude Opus if accuracy needed

Examples of bad responses to watch for:
- "I don't know" (should be rare; you have the data)
- Inconsistent calculations (math errors)
- Irrelevant suggestions
- Unfriendly tone

## Task 5: Performance Optimization
- [ ] AI response time <3 seconds (cached or slow?)
- [ ] Trends load <500ms
- [ ] Reorder recommendations compute <1s
- [ ] No memory leaks in long sessions
- [ ] Charts render smoothly on slow phones

If slow: Add caching, optimize queries, debounce recomputes

## Task 6: Security & Privacy
- [ ] User transaction data not sent to Claude (only aggregated: "sold 24 units")
- [ ] AI responses don't expose other users' data
- [ ] Cache doesn't leak between users
- [ ] Error messages don't reveal schema/implementation

## Task 7: Launch Checklist
- [ ] All Phase 1 & 2 features still working (regression test)
- [ ] Zero critical bugs
- [ ] Sentry clean (no unresolved errors)
- [ ] Performance acceptable (latency <1s)
- [ ] Monitoring active (Grafana, Sentry, Uptimerobot)

## Task 8: Soft Launch
1. Deploy to production (Vercel auto-deploys main branch)
2. Announce to 50-user Phase 2 cohort via Telegram
3. Monitor closely for 48 hours:
   - [ ] Error rates normal
   - [ ] No data corruption
   - [ ] AI responses sensible
   - [ ] Sync still working

4. Gather feedback:
   - "Is AI helpful?"
   - "Would you upgrade to premium (₦1,500/mo) for AI?"
   - "What questions do you wish AI could answer?"

## Task 9: Measure Phase 3 Success
After 2 weeks, check metrics:
- [ ] AI chat adoption: >40% of users tried it
- [ ] Reorder adoption: >50% acting on recommendations
- [ ] NPS: >50
- [ ] Premium upgrade interest: >20% want Phase 3 features

If metrics are good:
✅ Phase 3 is a success
✅ Build out remaining features (SMS alerts, bulk ordering)
✅ Scale to 1,000+ users

If metrics are mixed:
🟡 Iterate on UX (is reorder too complex? AI explanations unclear?)
🟡 Extend Phase 3 runway, don't rush to scale

## Task 10: Documentation & Celebration
- [ ] Update README (add Phase 3 features)
- [ ] Write internal postmortem (what worked, what didn't)
- [ ] Gather testimonials ("This AI saved me hours thinking about restocks!")
- [ ] Plan Phase 3.5 (enhancements based on feedback)
- [ ] Thank your testers 🎉

## Post-Launch Monitoring (First 2 Weeks)
- AI response accuracy (manual spot-checks)
- User engagement with trends & reorder features
- Feature requests / pain points
- Error rates & performance

## Success Looks Like
✅ 40%+ of users asking AI questions
✅ Users reducing stock-outs (reported in feedback)
✅ Reorder recommendations preventing emergency buys
✅ NPS 55+ (highest yet)
✅ "This app saved me ₦5k this month!" (testimonial)
✅ 20%+ upgrading to premium for Phase 3

## Acceptance Criteria
✅ All Phase 3 features working
✅ Phase 1 & 2 features still stable
✅ Soft launch to 50 users successful
✅ Metrics meet success criteria
✅ Zero data loss
✅ Ready to scale
```

**After completing:** Report back with:
- [ ] All tests passing
- [ ] Deployed to production
- [ ] Soft launch metrics (adoption, NPS)
- [ ] Ready to scale to 1,000+ users

---

## 🎯 Final Phase 3 Summary

**4 sequential prompts:**
1. AI chat infrastructure (Claude API integration)
2. Sales trends & visualizations (recharts)
3. Reorder recommendations & forecasting (timing guidance)
4. Testing, analytics, production deployment

**Expected timeline:** 8–12 weeks (can overlap Phase 2's last weeks)

**By end of Phase 3:**
- ✅ Market women making smarter inventory decisions
- ✅ AI assistant answering business questions
- ✅ Trends showing sales patterns
- ✅ Reorder system preventing stock-outs
- ✅ 1,000+ users, ₦500k+ MRR
- ✅ Premium tier (₦1,500/mo) ready to launch

---

## Between Phases: Post-Phase-3 Planning

**After Phase 3 deployed successfully:**

- [ ] Measure impact (profit increase, stock-outs reduced)
- [ ] Gather Phase 3 feedback
- [ ] Plan Phase 3.5+ enhancements:
  - SMS reorder reminders
  - Bulk ordering interface
  - Multi-user shops (family help)
  - Supplier integration (auto-order)
- [ ] Expand to new markets
- [ ] Build sales team for ₦5k → ₦10k ARPU upgrades

---

## 🚀 You've Built Something Remarkable

**Phase 1:** Offline inventory = peace of mind  
**Phase 2:** Cost tracking = profit visibility  
**Phase 3:** AI guidance = smarter decisions  

**Together:** A platform that helps market women increase profits by 20–30%, reduce stress, and compete with formal retail.

**Next steps after Phase 3:**
1. Celebrate 🎉
2. Listen to users (what's broken? what's missing?)
3. Plan Phase 4 (mobile app, payment integration, multi-user shops)
4. Scale to 10,000+ users across West Africa

---

**Ready to start? Begin with PROMPT-PACK-PHASE-1.md.**

**Questions?** Refer back to relevant spec docs (PHASE-1/2/3-*.md) or architecture guides.

---

**You've got this. Let's ship MarketMate. 🚀**
