# Prompt Pack: Phase 2 Build (Know Your Profit)
## Sequential Prompts for Claude Code — Copy-Paste Ready

**Document:** PROMPT-PACK-PHASE-2.md  
**Audience:** Developers using Claude Code  
**Read time:** 15 minutes (reference during build)  
**Prerequisites:** Phase 1 complete and deployed  

---

## 📋 Quick Summary

**What you're building:** Cloud sync, cost tracking, margin analysis, profit dashboard

**What's already done (Phase 1):**
- Offline inventory tracking
- Product CRUD
- Transaction logging
- Service worker + PWA
- SQLite local database

**What this phase adds:**
- Supabase PostgreSQL backend
- SMS/OTP authentication
- Cloud sync (offline→cloud reconciliation)
- Cost per unit tracking
- Automatic margin calculation
- Profit dashboard + margins view
- Purchase history
- Supplier comparison

**Expected timeline:** 6–8 weeks (can overlap with Phase 1 final weeks)

---

## Context Carryover Strategy

**Each prompt below includes:**
1. ✅ What you're building
2. ✅ Reference to relevant spec docs
3. ✅ Acceptance criteria (how to verify)
4. ✅ Key files to create/modify
5. ✅ Context for next prompt (state management, data passed forward)

**Use the "Context Carryover" section at end of each prompt to inform the next one.**

---

## PROMPT 1: Set Up Supabase Backend & Schema

**Purpose:** Initialize cloud database, run migrations, set up RLS policies

**Copy-paste this to Claude Code:**

```
I'm building Phase 2 of MarketMate (Know Your Profit). 

Phase 1 is complete (offline inventory app). Now I'm adding cloud sync.

Reference docs:
- PHASE-2-PROFIT.md (full Phase 2 spec)
- DEPLOYMENT-&-INFRA.md (Supabase setup)
- DATABASE-SCHEMA.md (tables for Phase 2+)
- ARCHITECTURE.md (sync strategy overview)

## Task 1: Verify Supabase Project Setup
1. I have a Supabase project created (go to supabase.com if not)
2. Get these credentials and set them as Vercel env vars:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (server-side only)

## Task 2: Create Database Migration File
Create this file: `supabase/migrations/001_phase2_schema.sql`

The migration must:
- [ ] Create `users` table (id, phone_number, shop_name, email, currency, timezone, created_at, updated_at)
- [ ] Alter `products` table: add user_id UUID FK to users, add cost_per_unit, add supplier
- [ ] Alter `transactions` table: add user_id UUID FK to users, add price_per_unit
- [ ] Create `prices` table (id, user_id, product_id, cost_per_unit, selling_price_per_unit, margin_percent GENERATED, effective_date, notes, timestamps)
- [ ] Create `audit_log` table (id, user_id, table_name, record_id, mutation_type, old_values JSONB, new_values JSONB, device_id, ip_address, created_at)
- [ ] Create indexes for performance (see DATABASE-SCHEMA.md)
- [ ] Enable RLS on all tables
- [ ] Create RLS policies (users can only see their own data)

Refer to DATABASE-SCHEMA.md "Phase 2+ Schema Extensions" section for exact SQL.

## Task 3: Deploy Migration
- [ ] Run migration on Supabase: `supabase link` then `supabase db push`
   OR: Copy SQL into Supabase dashboard → SQL Editor → run manually
- [ ] Verify tables exist: Go to Supabase dashboard → Database → Public tables
- [ ] Verify RLS is enabled on all data tables

## Task 4: Verify Setup
- [ ] Test connection from Next.js: Create lib/supabase.ts and verify no auth errors
- [ ] Check that env vars are in Vercel (go to Vercel → Project Settings → Environment Variables)

## Acceptance Criteria
✅ Supabase project has all Phase 2+ tables
✅ RLS policies enabled (users can't see each other's data)
✅ Indexes created for performance
✅ No errors in Supabase logs
✅ Next.js can connect to Supabase without auth

Context for next prompt:
- You now have a cloud DB ready
- Next: Set up SMS auth so market women can log in
```

**After completing:** Report back with:
- [ ] Migration deployed successfully
- [ ] All tables created with no errors
- [ ] RLS policies enabled
- [ ] Connection test passed

---

## PROMPT 2: Implement SMS/OTP Authentication

**Purpose:** Users can log in via phone number (SMS or WhatsApp), get JWT token

**Copy-paste this to Claude Code:**

```
Phase 2 Progress: Supabase backend is set up. Next: Authentication.

Reference docs:
- API-REFERENCE.md (auth endpoints section)
- DEPLOYMENT-&-INFRA.md (SMS config with Twilio/Vonage)
- ARCHITECTURE.md (Phase 2+ auth flow)

## Context from Previous Prompt
- Supabase project initialized with all Phase 2 tables
- RLS policies enabled
- Users table created and ready

## Task 1: Configure SMS Provider (Supabase)
In Supabase dashboard:
1. Go to Authentication → Providers → Phone
2. Enable "Phone provider"
3. Configure SMS provider:
   - Option A: Twilio (recommended)
     - Create account at twilio.com
     - Get Account SID + Auth Token
     - In Supabase: Add Twilio credentials
   - Option B: Vonage
     - Create account at vonage.com
     - In Supabase: Add Vonage credentials

Note: Testing uses a "magic code" (no real SMS sent). Verify this works first.

## Task 2: Create Auth API Routes
Create these Next.js API routes:

### pages/api/auth/request-otp.ts
- Input: phoneNumber (E164 format, e.g., "+2341234567890")
- Call Supabase auth: `signInWithOtp({ phone: phoneNumber })`
- Return: { success, message, expiresIn: 600 }
- Error handling: Invalid phone → 400, Rate limit → 429

### pages/api/auth/verify-otp.ts
- Input: phoneNumber, otp (6-digit code)
- Call Supabase auth: `verifyOtp({ phone, token: otp, type: 'sms' })`
- On success: Return JWT token + refreshToken + user data
- Create user record in `users` table if not exists
- Error handling: Wrong OTP → 400 with attemptsRemaining, Expired → 401

### pages/api/auth/refresh.ts
- Input: refreshToken in Authorization header
- Call Supabase auth: `refreshSession()`
- Return: New JWT token + expiresIn

### pages/api/auth/logout.ts
- Invalidate session
- Return 204 No Content

Refer to API-REFERENCE.md for exact request/response formats.

## Task 3: Create Auth UI Components (Frontend)
Create these React components:

### components/AuthFlow.tsx
Flow: Phone number input → OTP input → Success

1. PhoneInput screen:
   - TextField for "+234XXXXXXXXXX"
   - Button: "Request OTP"
   - On submit: POST /api/auth/request-otp
   - Show: "OTP sent to {phone}" + timer (expires in 10 min)

2. OTPInput screen (appears after step 1):
   - 6-digit input field
   - Button: "Verify"
   - On submit: POST /api/auth/verify-otp
   - On success: Store JWT in secure storage (not localStorage)
   - Redirect to /products (inventory dashboard)

3. Error handling:
   - Show toast on invalid phone, expired OTP, wrong OTP
   - Allow retry

## Task 4: Update App Routing
- [ ] Create pages/auth/login.tsx (shows AuthFlow component)
- [ ] Protect pages/products/* with auth middleware:
   - If JWT missing/invalid: Redirect to /auth/login
   - If JWT valid: Allow access

## Task 5: Test Auth Flow
- [ ] Request OTP with valid phone number (should work)
- [ ] Try with invalid phone (should get 400 error)
- [ ] Verify OTP with wrong code (should show "attempts remaining")
- [ ] Verify OTP with correct code (should redirect to /products, store JWT)
- [ ] Try accessing /products without auth (should redirect to login)
- [ ] Logout and verify session is cleared

## Acceptance Criteria
✅ SMS/OTP auth working (real SMS sent if Twilio configured, or test mode)
✅ JWT tokens issued and stored securely
✅ Protected pages require auth
✅ User record created in `users` table on first login
✅ Refresh token works (JWT can be refreshed before expiry)
✅ Logout invalidates session

Context for next prompt:
- Users can now log in via phone
- JWT tokens are managed
- Next: Set up cloud sync engine (offline→cloud reconciliation)
```

**After completing:** Report back with:
- [ ] Auth flow tested end-to-end
- [ ] User records created in Supabase
- [ ] Protected pages working
- [ ] JWT tokens storing securely

---

## PROMPT 3: Implement Cloud Sync Engine

**Purpose:** Phone queues offline mutations, syncs to cloud when online, resolves conflicts

**Copy-paste this to Claude Code:**

```
Phase 2 Progress: Auth is working. Next: Cloud sync.

Reference docs:
- ARCHITECTURE.md (Phase 2+ sync architecture section)
- OFFLINE-SYNC-STRATEGY.md (full sync algorithm + conflict resolution)
- DATABASE-SCHEMA.md (sync_metadata and sync_queue tables for local SQLite)

## Context from Previous Prompts
- Phase 1 offline inventory working (SQLite on phone)
- Phase 2 backend ready (PostgreSQL on Supabase)
- Auth working (users can log in)
- Now: Connect them

## Important: This is complex. Read OFFLINE-SYNC-STRATEGY.md first.

## Task 1: Extend Client-Side SQLite Schema
Add these tables to local SQLite (for sync management):

### sync_metadata table
```sql
CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_synced_at TIMESTAMP,
  last_sync_error TEXT,
  pending_mutations_count INT DEFAULT 0,
  is_syncing BOOLEAN DEFAULT FALSE,
  device_id TEXT UNIQUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sync_metadata (device_id) VALUES ('{unique-device-id}');
-- Generate device_id as: `${navigator.userAgent.split('/')[2]}-${Date.now()}`
```

### sync_queue table
```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  mutation_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSON NOT NULL,
  client_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP,
  retry_count INT DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON sync_queue(synced_at);
```

## Task 2: Create Sync Queue Manager Hook
Create: `hooks/useSyncQueue.ts`

Functions:
- `queueMutation(type, table, recordId, payload)` → Adds to sync_queue
- `getQueuedMutations()` → Gets all unsync'd mutations
- `markAsSynced(mutationId)` → Mark mutation as synced
- `getQueueStats()` → Returns { pending_count, last_synced_at, is_syncing }

Use Zustand for state:
```typescript
interface SyncState {
  queueStats: { pending: number; lastSynced?: Date; isSyncing: boolean };
  updateStats: () => void;
}
```

## Task 3: Modify Existing CRUD Hooks (Phase 1 → Phase 2)
Update these hooks to queue mutations:

### useLocalInventory.ts
- addProduct() → queueMutation('CREATE', 'products', ...)
- updateProduct() → queueMutation('UPDATE', 'products', ...)
- deleteProduct() → queueMutation('DELETE', 'products', ...)

### useTransactions.ts
- logTransaction() → queueMutation('CREATE', 'transactions', ...)

Make sure:
- [ ] Local SQLite updated immediately (optimistic)
- [ ] Mutation queued for cloud sync
- [ ] Client timestamp saved with mutation

## Task 4: Create Sync Engine
Create: `lib/sync-engine.ts`

Main function: `async function performSync(token: string)`

Flow:
1. Check: is online? (navigator.onLine)
2. Get queued mutations: getQueuedMutations()
3. Build sync request:
   ```typescript
   {
     clientId: device_id,
     lastSyncedAt: last_sync_time,
     mutations: [
       {
         id: mutation.id,
         type: mutation.mutation_type,
         table: mutation.table_name,
         recordId: mutation.record_id,
         data: mutation.payload,
         clientTimestamp: mutation.client_timestamp,
         clientId: device_id
       }
     ]
   }
   ```
4. POST to /api/sync with JWT in Authorization header
5. Handle response:
   - applied[] → Mark as synced, increment stats
   - rejected[] → Fetch server state, merge locally (LWW), show user toast
   - errors[] → Log error, show toast, don't mark as synced (retry later)
6. Update sync_metadata: last_synced_at, pending_count, etc.

Error handling:
- Network error → Queue remains, auto-retry on next online event
- Conflict (server_newer) → Show toast: "Product updated from another device"
- Rate limit (429) → Backoff exponentially
- Auth error (401) → Redirect to login

## Task 5: Hook Up Sync to App Lifecycle
Create: `hooks/useSyncLifecycle.ts`

On app mount:
- Listen for online/offline events: `window.addEventListener('online', performSync)`
- Auto-perform sync when:
  - App comes online
  - Every 5 minutes if online (constant sync)
  - After mutations (immediate sync if possible)

Show sync status in UI:
- Small indicator showing "Syncing..." or "✓ Synced"
- If pending mutations: "2 changes waiting to sync"
- If sync error: "❌ Sync failed. Retrying..."

## Task 6: Test Sync Flow
1. Go offline (DevTools → Network → Offline)
2. Make edits (add product, log transaction)
3. Verify:
   - [ ] Local SQLite updated
   - [ ] Mutation queued in sync_queue
   - [ ] Sync metadata shows "pending: 1"
   - [ ] UI shows "Waiting to sync"
4. Go online
5. Verify:
   - [ ] Sync happens automatically
   - [ ] Mutation marked as synced
   - [ ] Cloud database has the changes (verify in Supabase dashboard)
   - [ ] UI shows "✓ Synced"
6. Conflict test:
   - Go offline, edit product qty
   - Meanwhile, edit same product on phone 2 (or via API)
   - Go online
   - Verify: Conflict detected, server version wins, user gets toast

## Acceptance Criteria
✅ Mutations queued when offline
✅ Auto-sync when online
✅ Queued mutations survive app restart
✅ Conflicts resolved via Last-Write-Wins
✅ Sync status shown in UI
✅ Retries on failure (exponential backoff)
✅ No data loss
✅ Cloud DB has accurate data after sync

Context for next prompt:
- Sync engine working
- Phone ↔ Cloud now connected
- Next: Add cost tracking UI + margin calculations
```

**After completing:** Report back with:
- [ ] Offline mutations queued
- [ ] Online sync working
- [ ] Conflicts detected and resolved
- [ ] Cloud DB matches phone after sync
- [ ] Sync status visible in UI

---

## PROMPT 4: Implement Cost Tracking & Margin Calculation

**Purpose:** Users can add cost per unit, see automatic profit margins, view margin dashboard

**Copy-paste this to Claude Code:**

```
Phase 2 Progress: Cloud sync working. Next: Profit features.

Reference docs:
- PHASE-2-PROFIT.md (User Stories 1-2: add cost, view margins)
- DATABASE-SCHEMA.md (prices table)
- API-REFERENCE.md (/api/margins endpoint)

## Context from Previous Prompts
- Sync engine working (mutations queue/sync)
- Cloud DB ready with prices table
- Now: Build margin features

## Task 1: Extend Product UI
Update: `components/ProductCard.tsx`

Add new section: "Pricing & Margins" (collapsible in Phase 1, expanded in Phase 2)

When expanded, show:
- Cost per unit field (optional in Phase 1, required in Phase 2)
- Selling price field (already exists)
- Auto-calculated margin: `((selling - cost) / cost) * 100`
- Margin display with color:
  - 🟢 Green: >30%
  - 🟡 Yellow: 10-30%
  - 🔴 Red: <10% or negative
- Units sold this week (if available)
- Total profit this week: units * margin_amount

On cost change:
- Recalculate margin in real-time
- Show: "New margin: ₦25 (25%)"
- Save to both:
  - products.cost_per_unit (current cost)
  - prices table (for history)

## Task 2: Create Margin Calculation Hook
Create: `hooks/useMarginCalculation.ts`

Functions:
- `calculateMargin(costPerUnit, sellingPricePerUnit)` → Returns { marginPercent, marginAmount, status }
- `suggestTargetPrice(costPerUnit, targetMarginPercent)` → Returns suggested selling price for target margin
- `getMarginStatus(marginPercent)` → Returns 'green' | 'yellow' | 'red'

Example:
```typescript
const { marginPercent, marginAmount, status } = calculateMargin(500, 750);
// Returns: { marginPercent: 50, marginAmount: 250, status: 'green' }
```

## Task 3: Create Margin API Endpoint
Create: `pages/api/margins.ts`

GET /api/margins:
- Fetch all products with margin data
- Include: productId, name, costPerUnit, sellingPrice, marginPercent, marginAmount
- Also include: units_sold_this_week, total_profit_this_week (if available)
- Sort by marginPercent (lowest first, so problems are obvious)
- Return summary: { totalProducts, profitableCount, totalMarginThisWeek, averageMargin }

Refer to API-REFERENCE.md for exact format.

## Task 4: Create Profit Analysis Dashboard Screen
Create: `pages/margins.tsx` (or profit.tsx)

Screen layout:
1. Summary section:
   - Total products
   - % Profitable (e.g., "11/12 profitable")
   - Total margin this week
   - Average margin %

2. Products sorted by margin:
   - Each row: Product name | Cost | Selling | Margin % | Margin ₦ | Status color
   - Tap row to edit price

3. Warning section:
   - Highlight any products with <10% margin
   - Show: "Milk: Only 1% margin. Reprice to ₦850+ for 30% margin?"

4. Actions:
   - "Update price" → Opens pricing modal (see next prompt)
   - "View details" → Show transaction history + supplier comparison

## Task 5: Create Price Update Modal
Create: `components/PriceUpdateModal.tsx`

Modal shows:
- Product name + current cost
- Current selling price
- Current margin % (color-coded)
- Input for new selling price
- Real-time margin preview: "New margin would be: X%"
- "Suggest 30% margin" button → Auto-fills price for 30% target
- Save/Cancel buttons

On save:
- Update products.selling_price_per_unit
- Create new row in prices table (for history)
- Queue as UPDATE mutation (sync)
- Show toast: "Price updated. New margin: 30%"

## Task 6: Test Margin Features
1. Add cost to a product with low margin (e.g., Milk: cost 800, selling 810)
2. Verify margin calculated: 1.25% (red status)
3. Open Profit Analysis dashboard
4. Verify product sorted first (lowest margin)
5. Tap "Suggest 30% margin" → should set price to ~1,040
6. Save and verify:
   - [ ] New price in product
   - [ ] Cloud synced (check Supabase)
   - [ ] prices table has new row with timestamp
   - [ ] Margin now shows as green (30%)

## Acceptance Criteria
✅ Cost per unit tracked
✅ Margin calculated automatically
✅ Margin dashboard shows all products sorted by profitability
✅ Price updates are queued and synced to cloud
✅ Price history stored in prices table
✅ Color coding works (red/yellow/green)
✅ Suggested pricing works

Context for next prompt:
- Cost tracking & margins working
- Dashboard showing profitability
- Next: Add purchase history + supplier comparison
```

**After completing:** Report back with:
- [ ] Margins calculated correctly
- [ ] Profit dashboard working
- [ ] Price updates syncing to cloud
- [ ] Price history stored

---

## PROMPT 5: Implement Purchase History & Supplier Comparison

**Purpose:** Show all restocks with costs, filter by supplier, see best deals

**Copy-paste this to Claude Code:**

```
Phase 2 Progress: Margins working. Next: Purchase history.

Reference docs:
- PHASE-2-PROFIT.md (User Story 4-5: purchase history, supplier comparison)
- API-REFERENCE.md (/api/suppliers endpoint)

## Context from Previous Prompts
- Cost tracking working
- Margins displaying correctly
- Now: Show purchase history + supplier intelligence

## Task 1: Create Purchase History API Endpoint
Create: `pages/api/purchase-history.ts`

GET /api/purchase-history?productId={id}&startDate={date}&endDate={date}&supplier={name}:
- Fetch transactions where type = 'restock' and user_id matches
- Include: product name, quantity, cost_per_unit, total_cost (qty * cost), supplier, date
- Filter by: productId, date range, supplier (all optional)
- Sort by date DESC (newest first)
- Return with pagination (limit, offset)
- Include summary: totalSpent, avgCost, totalUnits, frequencyPerMonth

## Task 2: Create Supplier Comparison API Endpoint
Create: `pages/api/suppliers/:productId.ts`

GET /api/suppliers/:productId:
- Fetch all suppliers for a product (from restock transactions)
- For each supplier: last price, last purchase date, total spent, qty bought, frequency
- Sort by price (cheapest first)
- Calculate savings: (maxPrice - currentSupplierPrice) / maxPrice * 100
- Return: [ { name, lastPrice, lastDate, totalSpent, frequency, isSavings } ]

## Task 3: Create Purchase History Screen
Create: `pages/purchase-history.tsx`

Screen layout:
1. Filters (top):
   - Product dropdown (optional)
   - Date range: Start | End (defaults to last 30 days)
   - Supplier filter (optional)
   - "Apply filters" button

2. Purchase table:
   - Date | Product | Qty | Cost/Unit | Total | Supplier
   - Sorted by date DESC
   - Tap row for details

3. Summary section:
   - Total spent (filtered)
   - Avg cost per unit
   - Total units
   - Frequency (purchases per month)

4. Supplier insights:
   - "Cheapest supplier for Milk: Lagos Dairy (₦790)"
   - "You could save ₦10/unit by switching"

## Task 4: Create Supplier Comparison Screen
Create: `pages/supplier-comparison.tsx` (or embed in purchase history)

Screen:
1. Product selector at top
2. Suppliers list for that product:
   - Supplier name | Last price | Last date | Total spent | # purchases
   - Highlight cheapest (green)
   - Show savings if not using cheapest

3. Price history chart (if available):
   - X-axis: Date
   - Y-axis: Price per unit
   - Lines per supplier

4. Actions:
   - "Set as preferred supplier" → App reminds to buy from this one
   - "View all purchases from this supplier" → Filter purchase history

## Task 5: Extend Product Detail View
Update: `components/ProductDetail.tsx` (or create)

Add tab: "Purchase History"

Shows:
- Last 5 restocks for this product
- By supplier
- Cheapest vs. current supplier

Add tab: "Suppliers"
- List all suppliers who sold this product
- Price comparison
- Recommendation: "Buy from {cheapest} to save ₦{amount}/unit"

## Task 6: Test Purchase History Features
1. Log several restocks (via Phase 1 transactions):
   - Milk from Lagos Dairy at ₦800 (qty 20)
   - Milk from Kano Wholesale at ₦790 (qty 15)
   - Sugar from Kano at ₦50 (qty 50)

2. Go to Purchase History:
   - [ ] Shows all restocks with dates, costs, suppliers
   - [ ] Filters work (by date, product, supplier)
   - [ ] Summary shows correct totals

3. Go to Supplier Comparison for Milk:
   - [ ] Shows both suppliers
   - [ ] Highlights Kano as cheaper (₦790 vs ₦800)
   - [ ] Shows: "Save ₦10/unit by switching"

4. Product detail:
   - [ ] Shows purchase history tab
   - [ ] Shows supplier recommendation

## Acceptance Criteria
✅ Purchase history shows all restocks
✅ Filters work correctly
✅ Supplier comparison shows price differences
✅ Cheapest option highlighted
✅ Savings calculated correctly
✅ Data syncs to cloud
✅ UI responsive and clear

Context for next prompt:
- Purchase history working
- Supplier intelligence available
- Phase 2 is now feature-complete
- Next: Testing, optimization, deployment to production
```

**After completing:** Report back with:
- [ ] Purchase history screen working
- [ ] Supplier comparison showing savings
- [ ] Filters and sorting working
- [ ] Recommendations visible

---

## PROMPT 6: Testing, Optimization & Phase 2 Deployment

**Purpose:** Run full test suite, optimize performance, deploy to production

**Copy-paste this to Claude Code:**

```
Phase 2 Progress: All features built. Final phase: Test + Deploy.

Reference docs:
- DEPLOYMENT-&-INFRA.md (Phase 2+ deployment)
- PHASE-2-PROFIT.md (success metrics)

## Context from Previous Prompts
- Phase 1 (offline inventory) deployed to production
- Phase 2 (cost tracking + sync) fully built
- Cloud DB synced, features working
- Now: Verify quality, deploy to prod, celebrate 🎉

## Task 1: Run Full Test Suite
1. Unit tests:
   - [ ] npm test (should pass 100%)
   - [ ] useMarginCalculation.ts tests
   - [ ] useSyncQueue.ts tests
   - [ ] Sync engine tests (offline/online transitions)

2. E2E tests (Playwright):
   - [ ] Auth flow (login via SMS)
   - [ ] Add product with cost → Margin calculated
   - [ ] Offline: Add cost, go online → Syncs
   - [ ] Conflict test: Edit on 2 devices → Server version wins
   - [ ] Purchase history: Log restock → Shows in history
   - [ ] Supplier comparison: Multiple suppliers → Cheapest highlighted

Run: `npm run test:e2e`

## Task 2: Performance Optimization
- [ ] Check Vercel Analytics: API latency <500ms?
- [ ] Database queries optimized (indexes in place)?
- [ ] Service worker caching assets properly?
- [ ] Margin calculations don't block UI?
- [ ] Sync doesn't drain battery (not syncing too frequently)?

If slow:
- Add Redis caching for /api/margins (Upstash)
- Paginate large lists (transactions, purchase history)
- Lazy-load tabs/screens

## Task 3: Security & Privacy Review
- [ ] RLS policies enforced (test: can't see other user's products?)
- [ ] JWT tokens secure (httpOnly if possible, short expiry)
- [ ] Sensitive data not logged (no passwords, phone #'s in error messages)
- [ ] HTTPS enforced everywhere
- [ ] SQL injection prevention (use parameterized queries)

## Task 4: Prepare for Production
- [ ] Environment variables set in Vercel (all Phase 2 env vars)
- [ ] Supabase backups enabled (daily)
- [ ] Error tracking enabled (Sentry)
- [ ] Monitoring set up (Uptimerobot health checks)
- [ ] Documentation updated (README, ARCHITECTURE)

## Task 5: Soft Launch to Test Cohort
1. Deploy to production (Vercel auto-deploys on git push)
2. Recruit 50 market women to test Phase 2:
   - 30 existing Phase 1 users (upgrade to Phase 2)
   - 20 new users (Phase 1 + 2 from start)
3. Send via Telegram: "New update! Cost tracking + profit dashboard"
4. Measure for 2 weeks:
   - [ ] Retention (% who log in 5+ days/week)
   - [ ] Feature adoption (% who add costs)
   - [ ] Conversion (% who upgrade to paid ₦500/mo tier)
   - [ ] NPS (survey after 1 week)
   - [ ] Bugs (errors in Sentry)

## Task 6: Phase 2 Launch Criteria
Only move to Phase 3 if:
- [ ] Retention ≥70%
- [ ] 15%+ upgrade to paid tier
- [ ] NPS ≥50
- [ ] <1 critical bug per 100 users
- [ ] Zero data loss incidents

If criteria not met:
- Debug & iterate on UX (margins too confusing? sync failing?)
- Extend Phase 2 runway, don't rush to Phase 3

## Task 7: Celebrate + Document
- [ ] Write Phase 2 launch post (internal)
- [ ] Gather testimonials ("This app saved me ₦3k this week!")
- [ ] Update public roadmap (Phase 3 coming soon)
- [ ] Thank your test cohort

## Deployment Checklist
- [ ] All tests passing (unit + E2E)
- [ ] No errors in Sentry (last 24 hours)
- [ ] Vercel build succeeds
- [ ] Supabase health check passes
- [ ] DNS / Cloudflare healthy
- [ ] No pending breaking migrations
- [ ] Rollback plan ready (if needed)

## Post-Deployment
Monitor for 48 hours:
- [ ] Error rates
- [ ] Sync success rates
- [ ] User login/retention
- [ ] Performance metrics (latency, CPU)
- [ ] Support messages (Telegram, email)

## Success Looks Like
After 2 weeks of Phase 2 soft launch:
✅ 50+ users actively using cost tracking
✅ 10+ users upgraded to paid tier
✅ 0 data loss complaints
✅ NPS 50+
✅ "I love knowing my margins now!"

## Acceptance Criteria
✅ All tests passing
✅ Zero critical bugs in prod
✅ Soft launch to 50 users successful
✅ Retention & conversion metrics met
✅ Ready to move to Phase 3

Context for Phase 3:
- Phase 2 validated in production
- 50+ paid users with margin data
- Ready for AI insights
- Next: Build Phase 3 (AI chat, trends, forecasts)
```

**After completing:** Report back with:
- [ ] All tests passing
- [ ] Deployed to production
- [ ] Soft launch metrics (retention, conversion)
- [ ] Ready to start Phase 3

---

## Between Phases: Checklist

**After Phase 2 deployed, before starting Phase 3:**

- [ ] Review Phase 2 metrics vs. success criteria
- [ ] Gather feedback from 50-user cohort (survey)
- [ ] Update product roadmap based on user feedback
- [ ] Document any technical debt from Phase 2
- [ ] Brief review of PHASE-3-AI.md (specs for Phase 3)
- [ ] Plan Phase 3 timeline

---

## 🎯 Summary: Phase 2 Prompt Pack

**6 sequential prompts:**
1. Supabase backend setup + schema migration
2. SMS/OTP authentication
3. Cloud sync engine (offline↔online)
4. Cost tracking + margin dashboard
5. Purchase history + supplier comparison
6. Testing, optimization, production deployment

**Each prompt:**
- ✅ Stands alone (can read without others)
- ✅ Builds on previous (context carried forward)
- ✅ References spec docs (no guessing)
- ✅ Includes acceptance criteria (how to verify)
- ✅ Lists files to create/modify

**Estimated timeline:** 6–8 weeks (can overlap with Phase 1 final weeks)

**Next:** Start Phase 1 build, and after Phase 1 validated in production, use this prompt pack for Phase 2.

---

**Ready to build? Start with PROMPT-PACK-PHASE-1.md first.** 🚀
