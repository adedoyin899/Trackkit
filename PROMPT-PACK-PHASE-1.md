# Prompt Pack: Phase 1 — Know Your Stock (MVP)
## Sequential Prompts for Claude Code

**Document:** PROMPT-PACK-PHASE-1.md  
**Audience:** Claude Code / AI agents  
**Status:** Ready to execute  
**Prerequisite:** GitHub repo set up, Node.js 18+, Bun installed  
**Timeline:** 6–8 weeks total (use these prompts week by week)  

---

## How to Use This Prompt Pack

### For Each Prompt:
1. **Copy the full prompt** (from "PROMPT:" to end of acceptance criteria)
2. **Paste into Claude Code** in a new session
3. **Let Claude Code execute** (it will write code, run tests, commit)
4. **When complete:** Verify using the "Verification Steps"
5. **Move to next prompt** once acceptance criteria pass

### Context Carryover:
- Each prompt builds on previous work (no rework)
- Claude Code persists state across prompts in same session
- If starting fresh session: Reference "Previous Work" section in next prompt

### Testing Each Step:
- Unit tests auto-run via `npm test`
- E2E tests run via `npm run test:e2e`
- Manual testing via `npm run dev` → browser at `localhost:3000`

---

## PROMPT 1: Project Setup & SQLite Initialization

**Timeframe:** Week 1 (2–3 days)  
**Goal:** Scaffold Next.js project, set up SQLite layer, initialize database schema

---

```
PROMPT:

You are building Trackkit, an offline-first inventory tracker for market women in West Africa.

REFERENCE:
- PRODUCT-OVERVIEW.md (full vision)
- PHASE-1-MVP.md (detailed spec)
- DATABASE-SCHEMA.md (Phase 1 schema)
- ARCHITECTURE.md (offline-first design)

## Your Task

Set up a Next.js project with local SQLite database for Phase 1 MVP.

### What to Build

1. **Create Next.js project** (`trackkit`)
   - Use TypeScript
   - Install: Tailwind CSS, Zustand, TanStack Query, wa-sqlite, sql.js
   - Create directory structure per PHASE-1-MVP.md

2. **Initialize SQLite database layer** (`lib/sqlite-init.ts`)
   - Load SQLite via sql.js (WebAssembly)
   - Create schema: `products` table, `transactions` table
   - Set up IndexedDB persistence
   - Export `initDB()` and database instance

3. **Create database hook** (`hooks/useLocalInventory.ts`)
   - Hook for CRUD operations: fetch, add, update, delete products
   - Use TanStack Query to manage state
   - Make all operations local (no API calls)

4. **Set up Zustand store** (`lib/store.ts`)
   - Global app state: `currentTab`, `selectedProductId`, `shopName`
   - Persist to localStorage

5. **Create basic folder structure**:
   ```
   trackkit/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx (home)
   │   └── api/ (placeholder for Phase 2)
   ├── components/
   ├── hooks/
   ├── lib/
   ├── public/
   ├── styles/
   ├── tests/
   └── package.json
   ```

### Database Schema (Copy from DATABASE-SCHEMA.md, Phase 1 section)

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  current_quantity INT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  low_stock_threshold INT,
  selling_price_per_unit DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,
  CHECK (current_quantity >= 0)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock')),
  quantity INT NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
```

### Acceptance Criteria

- [ ] Next.js project created with TypeScript
- [ ] Tailwind CSS configured
- [ ] SQLite (sql.js) loads without errors
- [ ] Database schema created successfully
- [ ] `useLocalInventory()` hook exports: `fetchProducts()`, `addProduct()`, `updateProduct()`, `deleteProduct()`
- [ ] All CRUD operations work offline (no API calls)
- [ ] Zustand store initialized with global state
- [ ] `npm test` passes (unit tests for SQLite layer)
- [ ] `npm run dev` runs locally without errors
- [ ] Basic folder structure matches PHASE-1-MVP.md

### Verification Steps

1. **Check project structure**:
   ```bash
   ls -la trackkit/
   # Should show: app/, components/, hooks/, lib/, public/, styles/, tests/, package.json
   ```

2. **Test SQLite initialization**:
   ```bash
   npm test -- sqlite-init.test.ts
   # Should pass: Database initialization test
   ```

3. **Test database operations**:
   ```bash
   npm test -- useLocalInventory.test.ts
   # Should pass: CRUD operations
   ```

4. **Manual test** (in browser after `npm run dev`):
   - Open DevTools Console
   - Run: `window.__db` (should show SQLite instance)
   - Check IndexedDB: DevTools → Storage → IndexedDB → trackkit.db

5. **Commit to GitHub**:
   ```bash
   git add .
   git commit -m "Scaffold Phase 1: Next.js + SQLite initialization"
   git push origin main
   ```

### Context for Next Prompt

After this prompt completes:
- You have a working Next.js + SQLite foundation
- All Phase 1 database operations are ready
- Next prompt will build UI components (ProductCard, Dashboard, etc.)
```

---

## PROMPT 2: UI Components (ProductCard, Dashboard, Forms)

**Timeframe:** Week 2 (3–4 days)  
**Goal:** Build all Phase 1 UI components per PHASE-1-MVP.md wireframes

---

```
PROMPT:

CONTEXT: You just set up Next.js + SQLite. Now build the UI components.

REFERENCE:
- PHASE-1-MVP.md → "UI/UX Wireframes (Simplified Descriptions)"
- ARCHITECTURE.md → "Component Structure (Phase 1)"

## Your Task

Build React components for Phase 1 MVP:

### Components to Create

1. **ProductCard.tsx** (`components/ProductCard.tsx`)
   - Display: Product name, current qty, unit, low-stock indicator
   - Buttons: Large +1 (green), -1 (red)
   - On tap: Immediately update quantity (optimistic UI)
   - Color-code: Red/orange if qty <= threshold
   - Long-press: Open edit modal

2. **ProductForm.tsx** (`components/ProductForm.tsx`)
   - Modal form: Add/Edit product
   - Fields: Name*, Category, Current Qty*, Unit*, Low-stock threshold, Selling price (optional)
   - Validate: Name & Unit required, Qty >= 0
   - On save: Call `useLocalInventory().addProduct()` or `updateProduct()`
   - On cancel: Close modal, no changes

3. **Dashboard.tsx** (`components/Dashboard.tsx`)
   - Show: Total products, Low-stock count, Total inventory value (TBD for Phase 1)
   - Show: Low-stock items pinned at top (alert badge)
   - Show: Quick actions: [+ Add Product] [View All]
   - Refresh on every product change

4. **LowStockAlert.tsx** (`components/LowStockAlert.tsx`)
   - Component showing low-stock items
   - Badge: "⚠️ Low stock: 2"
   - Items sorted by urgency (qty closest to 0 first)

5. **ExportButton.tsx** (`components/ExportButton.tsx`)
   - Settings page button: "Export Data to CSV"
   - On click: Generate CSV (products + transactions)
   - Download or share (WhatsApp, email)

6. **Home Page** (`app/page.tsx`)
   - Tab navigation: Inventory | Dashboard | Settings
   - Inventory tab: List of products using ProductCard
   - Dashboard tab: Shows dashboard + low-stock alerts
   - Settings tab: Export button + preferences

### UI Requirements (from PHASE-1-MVP.md)

- Touch targets: 48px minimum
- Large fonts: 24pt+ for quantities
- Colors: Green for +, Red for -, Yellow/Orange for low-stock
- Responsive: Works on 375px–1080px screens
- No confirmation needed for quick adjustments (just tap)

### Acceptance Criteria

- [ ] ProductCard renders correctly
- [ ] ProductCard +/- buttons increment/decrement qty instantly
- [ ] ProductForm validates fields (name, unit required)
- [ ] ProductForm saves to SQLite via hook
- [ ] Dashboard shows total products, low-stock count
- [ ] Low-stock items highlighted in red/orange
- [ ] Tab navigation works
- [ ] Export button generates valid CSV
- [ ] Tailwind styling applied (responsive, clean)
- [ ] All components have basic unit tests
- [ ] Storybook stories written (optional but nice)

### Verification Steps

1. **Test components**:
   ```bash
   npm test -- components/
   # Should pass: All component tests
   ```

2. **Visual check** (`npm run dev`):
   - Navigate to each tab
   - Add product: Click [+ Add Product], fill form, save
   - Quick adjust: Click product, tap +1, qty updates instantly
   - Low-stock: Add product with qty=2, threshold=3, verify it's highlighted
   - Export: Click [Export], verify CSV downloads

3. **Responsive check**:
   - DevTools: Mobile view (375px width)
   - Buttons should still be easily tappable
   - No text overflow

4. **Commit**:
   ```bash
   git add .
   git commit -m "Add Phase 1 UI components: ProductCard, Form, Dashboard, Export"
   git push
   ```

### Context for Next Prompt

After this:
- You have a complete UI layer
- All components are wired to `useLocalInventory()` hook
- Next prompt: Service Worker (offline-first caching)
```

---

## PROMPT 3: Service Worker & Offline-First Caching

**Timeframe:** Week 2–3 (2–3 days)  
**Goal:** Set up service worker, enable offline-first app, test offline mode

---

```
PROMPT:

CONTEXT: You have UI + database. Now add offline-first service worker.

REFERENCE:
- ARCHITECTURE.md → "Service Worker Strategy (Offline-First)"
- PHASE-1-MVP.md → Database persists, now make UI fully offline

## Your Task

Set up Service Worker for true offline-first experience:

### What to Build

1. **Service Worker file** (`public/service-worker.ts`)
   - Cache all static assets on install
   - Serve from cache first (offline-first strategy)
   - Fall back to network if cache miss
   - Don't cache API responses (Phase 1 has none)

2. **Service worker registration** (`lib/service-worker.ts`)
   - Register SW on app load
   - Listen for updates (notify user if new version)
   - Handle offline/online transitions

3. **PWA manifest** (`public/manifest.json`)
   - name: "Trackkit"
   - short_name: "Trackkit"
   - display: "standalone"
   - theme_color: "#1f2937"
   - icons: Provide 192px + 512px icons
   - start_url: "/"

4. **Next.js PWA config** (`next.config.js`)
   - Add `with-pwa` plugin (if using)
   - OR manually configure manifest in next.config.js

5. **Offline indicator UI** (`components/OfflineIndicator.tsx`)
   - Show small banner when offline: "📡 Offline mode"
   - Hide when online
   - Display sync queue count (Phase 2 feature, stub for now)

### Acceptance Criteria

- [ ] Service Worker registers without errors
- [ ] All static assets cached on first visit
- [ ] App works offline (disable internet in DevTools)
- [ ] Offline mode: Can still view/edit products (uses local SQLite)
- [ ] Offline mode: +/- buttons work
- [ ] Offline mode: Changes persist when going back online
- [ ] PWA installable (Android: "Add to home screen", iOS: "Add to Home Screen")
- [ ] Offline indicator shows when disconnected
- [ ] Tests pass: Service Worker registration
- [ ] Manifest valid: Check via `npm run build` → lighthouse

### Verification Steps

1. **Test offline mode** (in browser):
   - DevTools → Network → Throttle to "Offline"
   - Refresh page
   - Verify: Page loads, products visible
   - Tap +1 on a product
   - Verify: Quantity updates (no "network error" shown)
   - Offline indicator visible

2. **Test going back online**:
   - DevTools → Network → Back to "No throttling"
   - Verify: Offline indicator disappears
   - Verify: No sync errors (Phase 1 has no sync)

3. **Test PWA install**:
   - Android: Open in Chrome, tap menu → "Install app" → "Install"
   - Verify: App icon appears on home screen
   - Launch from home screen, verify it works

4. **Lighthouse audit**:
   ```bash
   npm run build
   # Check PWA audit score (should be 90+)
   ```

5. **Commit**:
   ```bash
   git add .
   git commit -m "Add Phase 1: Service Worker + offline-first PWA support"
   git push
   ```

### Context for Next Prompt

After this:
- App is fully offline-first
- Installable as PWA
- Ready for manual testing with real market women
- Next prompt: E2E tests + deployment to Vercel
```

---

## PROMPT 4: E2E Tests & Manual Test Suite

**Timeframe:** Week 3–4 (2–3 days)  
**Goal:** Write comprehensive E2E tests, ensure 90%+ test coverage

---

```
PROMPT:

CONTEXT: You have a working Phase 1 app. Now write E2E tests to verify all flows.

REFERENCE:
- PHASE-1-MVP.md → "Testing Strategy (Phase 1)" → "E2E Tests (via Playwright)"
- All user stories in PHASE-1-MVP.md need test coverage

## Your Task

Write E2E tests using Playwright covering all Phase 1 user stories:

### Test Suite to Create

1. **Add Product** (`e2e/phase1-add-product.spec.ts`)
   - Test: Add product with all fields
   - Test: Validation (name & unit required)
   - Test: Product appears in list
   - Test: Persists after reload

2. **Quick Adjustments** (`e2e/phase1-quick-adjust.spec.ts`)
   - Test: Tap +1 → qty increments
   - Test: Tap -1 → qty decrements
   - Test: Qty can't go negative
   - Test: Changes persist

3. **Low-Stock Alerts** (`e2e/phase1-low-stock.spec.ts`)
   - Test: Product with qty <= threshold shows alert
   - Test: Low-stock items pinned at top
   - Test: Alert badge shows count

4. **Offline Mode** (`e2e/phase1-offline.spec.ts`)
   - Test: Disable network
   - Test: Can still add/edit products
   - Test: Changes persist
   - Test: Enable network, no sync errors

5. **CSV Export** (`e2e/phase1-export.spec.ts`)
   - Test: Click export
   - Test: CSV downloads
   - Test: CSV contains all products + transactions
   - Test: CSV format valid

### Acceptance Criteria

- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] Coverage: 90%+ of user flows tested
- [ ] Tests include: Online + offline modes
- [ ] Tests verify data persistence
- [ ] Tests verify validation
- [ ] All user stories from PHASE-1-MVP.md have tests
- [ ] Tests run in CI/CD (GitHub Actions)

### Verification Steps

1. **Run E2E tests locally**:
   ```bash
   npm run test:e2e
   # All tests should pass
   ```

2. **Check coverage**:
   ```bash
   npm run test -- --coverage
   # Should be 90%+
   ```

3. **Manual test** (real user scenario):
   - Simulate market woman workflow:
     1. Add 3 products (milk, sugar, noodles)
     2. Go offline
     3. Log sales: -2 milk, -1 sugar, -2 noodles
     4. Add new product (cocoa milk)
     5. Go online
     6. Verify all changes persisted
     7. Export CSV
   - Verify entire workflow works smoothly

4. **Commit**:
   ```bash
   git add .
   git commit -m "Add Phase 1: Comprehensive E2E test suite"
   git push
   ```

### Context for Next Prompt

After this:
- Phase 1 has full test coverage
- Deployment ready
- Next: Deploy to Vercel (public)
```

---

## PROMPT 5: Deploy Phase 1 to Vercel & Setup GitHub Actions

**Timeframe:** Week 4 (1 day)  
**Goal:** Deploy to Vercel, set up CI/CD, test public URL

---

```
PROMPT:

CONTEXT: Phase 1 is complete + tested. Now deploy to production on Vercel.

REFERENCE:
- DEPLOYMENT-&-INFRA.md → "Phase 1: Vercel Deployment Only"

## Your Task

Deploy to Vercel and set up CI/CD:

### What to Do

1. **Connect to Vercel**
   - GitHub repo already exists (you've been pushing)
   - Go to vercel.com, click "New Project"
   - Import GitHub repo `trackkit`
   - Framework preset: Next.js
   - Deploy (Vercel will auto-build)

2. **Verify deployment**
   - Vercel assigns URL: `trackkit-xxxxx.vercel.app`
   - Test URL in browser: Should load Phase 1 app
   - Test offline: DevTools → Offline → Refresh → Should work
   - Test PWA: Try install from browser menu

3. **GitHub Actions CI/CD** (`.github/workflows/deploy.yml`)
   - Auto-run tests on every push
   - Auto-deploy to Vercel if tests pass
   - Workflow:
     1. Checkout code
     2. Install deps
     3. Run `npm test` (unit tests)
     4. Run `npm run test:e2e` (E2E tests)
     5. If tests pass → Deploy to Vercel
     6. Run smoke tests on deployed URL

### Acceptance Criteria

- [ ] App deployed to Vercel public URL
- [ ] Vercel URL is live + accessible
- [ ] All Phase 1 features work on live URL
- [ ] Offline mode works on live URL
- [ ] PWA installable from live URL
- [ ] GitHub Actions workflow set up
- [ ] Tests auto-run on every push
- [ ] Auto-deploy to Vercel on test pass

### Verification Steps

1. **Test live URL**:
   ```bash
   curl https://trackkit-xxxxx.vercel.app/
   # Should return 200
   ```

2. **Manual test on live URL**:
   - Add product
   - Quick adjust
   - Go offline (DevTools)
   - Add product while offline
   - Go online
   - Verify changes persisted

3. **Push code to trigger CI/CD**:
   ```bash
   git add .
   git commit -m "Add Phase 1: Deploy to Vercel + GitHub Actions"
   git push origin main
   
   # Watch GitHub Actions:
   # - Tests should run
   - If pass → Auto-deploy to Vercel
   - Check Vercel dashboard for successful build
   ```

4. **Final check**:
   - Live URL should show latest changes within 2 minutes of push

### Context for Next Prompt

After this:
- Phase 1 is live on production
- Ready for user testing with 10-person cohort
- This is the end of Phase 1 prompt pack
- Next: See PROMPT-PACK-PHASE-2.md (after Phase 1 validation gate)
```

---

## Phase 1 Complete ✅

**You now have:**
- ✅ Working Phase 1 MVP (offline-first inventory tracker)
- ✅ Full test coverage (unit + E2E)
- ✅ Deployed to Vercel (live URL)
- ✅ GitHub Actions CI/CD
- ✅ PWA installable

**Next Steps:**
1. Deploy to 10 market women (test cohort)
2. Run for 2 weeks, collect feedback
3. Check Phase 1 success metrics:
   - 80% use app 5+ days/week?
   - NPS 50+?
   - Zero data loss?
4. If YES → Proceed to Phase 2 (see PROMPT-PACK-PHASE-2.md)
5. If NO → Iterate on Phase 1 UX, don't move forward yet

---

**All Phase 1 prompts above are ready to copy-paste into Claude Code. Execute them sequentially.**
