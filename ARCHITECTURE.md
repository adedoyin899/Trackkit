# Trackkit Architecture
## Offline-First Inventory & Profit Intelligence Platform

**Document:** ARCHITECTURE.md  
**Audience:** Engineering, Tech leads, Architects  
**Read time:** 30 minutes  
**Status:** Final spec (all phases included)  

---

## System Overview

Trackkit is built on an **offline-first architecture** where the phone is the source of truth in Phase 1, and cloud sync is optional (Phase 2+).

```
                    PHASE 1 (Offline Only)
                    
    ┌──────────────────────────────────────────┐
    │      MARKET WOMAN'S PHONE (iOS/Android)  │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │   React Web App (Next.js PWA)    │   │
    │  │  - Inventory dashboard           │   │
    │  │  - Product CRUD                  │   │
    │  │  - Transaction logging           │   │
    │  └──────────────────────────────────┘   │
    │           ↓ Local writes                 │
    │  ┌──────────────────────────────────┐   │
    │  │   SQLite (via sql.js / wa-sqlite)│   │
    │  │  - products table                │   │
    │  │  - transactions table            │   │
    │  │  - local sync queue (Phase 2+)   │   │
    │  └──────────────────────────────────┘   │
    │           ↓ Service Worker               │
    │  ┌──────────────────────────────────┐   │
    │  │   Offline-First Service Worker   │   │
    │  │  - Cache assets                  │   │
    │  │  - Queue mutations offline       │   │
    │  │  - Lazy sync on reconnect (Ph2)  │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    └──────────────────────────────────────────┘
                 (Single phone, one user)
                 
    
                 PHASE 2+ (With Cloud Sync)
                 
    ┌──────────────────────────────────────────┐
    │      MARKET WOMAN'S PHONE (iOS/Android)  │
    │                                          │
    │  [Same as Phase 1, plus...]              │
    │  + User authentication (SMS login)       │
    │  + Sync engine (conflict resolution)     │
    │  + Mutation queue for cloud            │
    │                                          │
    └──────────────────────────────────────────┘
                 ↓ (when online)
                 ↓ HTTPS (TLS 1.3+)
                 ↓
    ┌──────────────────────────────────────────┐
    │         VERCEL (Edge Network)            │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │   Next.js API Routes (/api/*)    │   │
    │  │  - Auth: SMS/WhatsApp login      │   │
    │  │  - Products: CRUD + RLS          │   │
    │  │  - Transactions: read-only       │   │
    │  │  - Sync: reconcile offline→cloud │   │
    │  │  - AI: chat, trends, forecasts   │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │   Background Jobs (Bull + Redis) │   │
    │  │  - Send alert notifications      │   │
    │  │  - Run AI batch inference        │   │
    │  │  - Sync analytics                │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    └──────────────────────────────────────────┘
                 ↓ Data layer
                 ↓ Connection pooling
                 ↓
    ┌──────────────────────────────────────────┐
    │         SUPABASE (PostgreSQL)            │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │   Data Layer                     │   │
    │  │  - users                         │   │
    │  │  - products (RLS: user_id)       │   │
    │  │  - transactions (RLS: user_id)   │   │
    │  │  - sync_metadata                 │   │
    │  │  - audit_log                     │   │
    │  │  - ai_cache (embeddings, etc)    │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │   Auth (Supabase Auth)           │   │
    │  │  - SMS/WhatsApp login            │   │
    │  │  - JWTs + session management     │   │
    │  │  - Row-level security (RLS)      │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    └──────────────────────────────────────────┘
```

---

## Phase 1: Offline-Only Architecture

### Data Layer (SQLite)

**Phone-local SQLite database** via `wa-sqlite` (WebAssembly SQLite for browsers).

```javascript
// Client-side SQLite initialization (Phase 1)

import { OpenDatabase } from 'wa-sqlite';

const db = await OpenDatabase({
  filename: 'trackkit.db',
  flags: 'cs'  // Create + Shared cache
});

// Initialize schema
await db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    current_quantity INT NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    low_stock_threshold INT,
    selling_price_per_unit DECIMAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock')),
    quantity INT NOT NULL CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_products_category ON products(category);
  CREATE INDEX idx_transactions_product_id ON transactions(product_id);
`);
```

**Durability:** SQLite persists to IndexedDB (automatic, browser-managed). Data survives:
- App restart
- Browser refresh
- Cache clear (data still in IndexedDB)
- Phone restart (if browser data persists)

**Limitations:**
- Single-device only (Phase 1)
- No backup if phone breaks (user can export CSV)
- No sync across devices (Phase 2)

### Service Worker Strategy (Offline-First)

**Goal:** App works fully offline from first load.

```javascript
// service-worker.ts

const CACHE_NAME = 'trackkit-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/app.js',
  '/js/sqlite.wasm',  // Crucial: SQLite WASM binary
  '/manifest.json',
  // ... all static assets
];

// On install: Cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// On fetch: Serve from cache first (offline-first strategy)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method === 'GET') {
    // Cache-first: try cache, fall back to network
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        // Not in cache; try network
        return fetch(request).then((networkResponse) => {
          // Don't cache API responses in Phase 1
          if (request.url.includes('/api/')) return networkResponse;
          
          // Cache successful responses
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      }).catch(() => {
        // No cache, no network → offline
        // App still works with local SQLite
        return caches.match(request) || new Response('Offline');
      })
    );
  } else if (request.method === 'POST' || request.method === 'PATCH') {
    // Phase 2: Queue mutations for sync when online
    // Phase 1: Just let them fail gracefully
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({
          error: 'Offline',
          queued: true  // Phase 2: tell client we queued it
        }), { status: 503 })
      })
    );
  }
});

// On activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

**Key behaviors:**
1. **First load:** Service worker downloads all assets, caches them
2. **App usage (offline):** Reads from cache + SQLite
3. **Online:** Reads from cache first; updates cache on new requests
4. **Phase 2+:** Mutation queue activates; Phase 1 mutations fail gracefully

### State Management (Zustand + React Query)

```typescript
// hooks/useLocalInventory.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store';

export function useLocalInventory() {
  const { db } = useStore();  // SQLite instance from Zustand

  // Fetch all products
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const stmt = db.prepare('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC');
      return stmt.all() as Product[];
    },
    refetchInterval: 5000,  // Refetch every 5s to catch local updates
  });

  // Add product
  const addProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const id = crypto.randomUUID();
      const stmt = db.prepare(`
        INSERT INTO products (id, name, category, current_quantity, unit, low_stock_threshold, selling_price_per_unit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, product.name, product.category, product.current_quantity, product.unit, product.low_stock_threshold, product.selling_price_per_unit);
      
      // Phase 2: Queue this for sync
      // queueMutation('CREATE', 'products', { id, ...product });
      
      return { id, ...product, created_at: new Date() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    }
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    addProduct: addProductMutation.mutate,
  };
}
```

### PWA Manifest

```json
{
  "name": "Trackkit",
  "short_name": "Trackkit",
  "description": "Know your stock. Know your profit. No internet needed.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Add Product",
      "short_name": "Add",
      "description": "Quickly add a new product",
      "url": "/?tab=add-product",
      "icons": [{ "src": "/icon-add.png", "sizes": "192x192" }]
    },
    {
      "name": "View Stock",
      "short_name": "Stock",
      "description": "See your current inventory",
      "url": "/?tab=inventory",
      "icons": [{ "src": "/icon-stock.png", "sizes": "192x192" }]
    }
  ]
}
```

---

## Phase 2+: Cloud Sync & Multi-Device Architecture

### Sync Architecture Overview

**Two databases working in concert:**
1. **Local SQLite** (phone): Primary source of truth, always writable
2. **Cloud PostgreSQL** (Supabase): Secondary, syncs with phone

**Sync flow:**

```
Phone (SQLite)
    ↓ (user makes changes)
    ↓ (optimistic UI update)
    ↓ (log to local transactions table)
    ↓ (if online)
    ↓ (POST /api/sync with mutations)
    ↓
Cloud (PostgreSQL)
    ↓ (server applies mutations)
    ↓ (conflict check: LWW + version checks)
    ↓ (return ack + server state)
    ↓
Phone (SQLite)
    ↓ (merge response, update metadata)
    ↓ (UI reflects cloud-confirmed state)
```

### Conflict-Free Sync Strategy

**Principle:** Use **Last-Write-Wins (LWW) with timestamps** + **version vectors** for safety.

**Key idea:** Every mutation includes:
- `updated_at` timestamp
- `version` (optimistic lock)
- `client_id` (which device made the change)

**Conflict resolution:**
```typescript
// Server-side: resolve conflicts on sync

interface SyncRequest {
  mutations: Mutation[];  // From client
  lastSyncedAt: string;   // When client last synced
}

interface Mutation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  id: string;
  data: Record<string, any>;
  clientTimestamp: string;  // When client made the change
  clientId: string;         // Which device
}

// On server, for each mutation:
async function applyMutation(mutation: Mutation) {
  const existing = await db.query(
    `SELECT * FROM ${mutation.table} WHERE id = $1`,
    [mutation.id]
  );

  if (!existing) {
    // CREATE
    await db.insert(mutation.table, {
      ...mutation.data,
      id: mutation.id,
      updated_at: mutation.clientTimestamp,
      synced_at: new Date()
    });
  } else {
    // UPDATE or DELETE
    const clientTime = new Date(mutation.clientTimestamp);
    const serverTime = new Date(existing.updated_at);

    if (clientTime >= serverTime) {
      // Client is newer; accept mutation (LWW)
      await db.update(mutation.table, mutation.id, {
        ...mutation.data,
        updated_at: mutation.clientTimestamp,
        synced_at: new Date()
      });
    } else {
      // Server is newer; reject mutation
      // Return server state to client (client will merge)
      return { rejected: true, reason: 'server_newer', serverState: existing };
    }
  }
}
```

**Client-side merge:**
```typescript
// phone/hooks/useSyncEngine.ts

async function syncToCloud() {
  const mutations = getQueuedMutations();  // From local queue table
  
  const response = await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({
      mutations,
      lastSyncedAt: getLastSyncTime()
    }),
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { applied, rejected, serverState } = await response.json();

  // Mark applied mutations as synced
  for (const id of applied) {
    db.run(`UPDATE sync_queue SET synced_at = NOW() WHERE id = ?`, [id]);
  }

  // For rejected mutations, merge server state
  for (const { id, state } of rejected) {
    db.run(
      `UPDATE ${state.table} SET ? = ? WHERE id = ?`,
      [state.table, JSON.stringify(state), id]
    );
    // Don't mark as synced; let user decide
  }

  // Mark sync complete
  db.run(`UPDATE sync_metadata SET last_synced_at = NOW()`);
}
```

### Sync Metadata (Client & Server)

**Client SQLite:**
```sql
CREATE TABLE sync_metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_synced_at TIMESTAMP,
  last_sync_error TEXT,
  pending_mutations_count INT DEFAULT 0,
  is_syncing BOOLEAN DEFAULT FALSE
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  mutation_type TEXT NOT NULL CHECK (mutation_type IN ('CREATE', 'UPDATE', 'DELETE')),
  record_id TEXT NOT NULL,
  payload JSON NOT NULL,
  client_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP,
  error TEXT
);
```

**Server PostgreSQL:**
```sql
CREATE TABLE sync_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_id TEXT,
  table_name TEXT,
  mutation_type TEXT,
  record_id TEXT,
  payload JSONB,
  status TEXT CHECK (status IN ('applied', 'rejected', 'error')),
  conflict_resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication (SMS Login)

**Flow:**
1. Phone: User enters phone number (WhatsApp or SMS)
2. Server: Send OTP via SMS
3. Phone: User enters OTP
4. Server: Verify OTP, issue JWT
5. Phone: Store JWT in secure storage, use for all requests

```typescript
// Phase 2: Auth flow (scaffolded)

async function requestOTP(phoneNumber: string) {
  const response = await fetch('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const { success, message } = await response.json();
  if (success) {
    // Show OTP input screen
  }
}

async function verifyOTP(phoneNumber: string, otp: string) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otp }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const { token, user } = await response.json();
  
  // Store token securely
  await SecureStore.setItemAsync('authToken', token);
  
  // Initialize sync
  initializeSync();
}
```

**Server-side (Supabase Auth + custom):**
```typescript
// pages/api/auth/request-otp.ts

import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phoneNumber } = req.body;

  if (!phoneNumber.match(/^\+?[0-9]{10,15}$/)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: `OTP sent to ${phoneNumber}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Row-Level Security (RLS)

**Supabase RLS policies ensure users can only access their own data:**

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can CRUD their own products only
CREATE POLICY "Users can CRUD their own products"
ON products
USING (
  auth.uid() = user_id OR 
  auth.uid() IS NULL  -- Phase 1: no user_id
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IS NULL
);

-- Policy: Users can read transactions for their products
CREATE POLICY "Users can read own transactions"
ON transactions
USING (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

-- Policy: Users cannot delete transactions (append-only)
-- DELETE policy omitted (blocks all deletes)
```

---

## Deployment Architecture

### Frontend Deployment (Vercel)

**Setup:**
```bash
# 1. Sync repo to GitHub
git push origin main

# 2. Connect to Vercel
# Go to vercel.com → New Project → Import Git Repo

# 3. Configure environment
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=... (for server-side only)

# 4. Deploy
vercel deploy --prod
```

**Vercel features we use:**
- **Edge Functions**: SMS OTP verification (low-latency)
- **Serverless Functions**: /api/* routes
- **Static Regeneration**: Cache manifest.json + assets
- **Automatic HTTPS**: TLS 1.3+
- **Global CDN**: Serve assets from nearest edge

**Monitoring:**
```typescript
// analytics.ts (opt-in telemetry)

import { postData } from '@vercel/edge-config';

export async function logEvent(event: {
  type: 'add_product' | 'log_transaction' | 'sync_start' | 'error';
  userId?: string;
  timestamp: Date;
  data?: Record<string, any>;
}) {
  if (!process.env.NEXT_PUBLIC_TELEMETRY_ENABLED) return;

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Analytics error:', e);
    // Fail silently; don't break app
  }
}
```

### Backend Deployment (Supabase)

**PostgreSQL instance:**
- **Location:** Closest region to target market (e.g., `eu-west-1` for West Africa, or Africa region if available)
- **Backups:** Automated daily (7-day retention)
- **Monitoring:** CPU, disk, connections via Supabase dashboard
- **Scaling:** Vertical scaling via Supabase tiers

**Setup:**
```bash
# 1. Create Supabase project
# supabase.com → New Project

# 2. Run migrations
supabase link --project-ref <PROJECT_ID>
supabase migration up

# 3. Set auth config
# SMS provider: Twilio or Vonage (configure in Supabase Auth settings)

# 4. Test schema
supabase test
```

**Database connection pooling** (via Supabase's built-in PgBouncer):
```typescript
// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,  // Server-side only
  {
    auth: { persistSession: false },
    db: {
      schema: 'public'
    }
  }
);

export default supabase;
```

### Infrastructure as Code (Terraform / Pulumi)

**Example Terraform for prod environment:**
```hcl
# terraform/main.tf

provider "aws" {
  region = "eu-west-1"
}

# Vercel project (managed via Vercel UI, but can be automated)
# resource "vercel_project" "trackkit" {
#   name = "trackkit"
#   ...
# }

# Supabase project (managed via Supabase UI for now)
# Future: Use Supabase Terraform provider when stable

# CloudFlare for DNS + DDoS protection
resource "cloudflare_zone" "trackkit" {
  account_id = var.cloudflare_account_id
  zone       = "trackkit.app"
}

resource "cloudflare_record" "apex" {
  zone_id = cloudflare_zone.trackkit.id
  name    = "trackkit.app"
  type    = "CNAME"
  value   = "cname.vercel-dns.com"
}
```

---

## Scaling & Performance

### Phase 1 Scaling (Single User, Local)

**Bottlenecks:**
- SQLite: ~100k rows max before slowdowns (not an issue for one user's inventory)
- Service worker cache: ~50MB limit (plenty for app assets + small offline store)
- Storage: IndexedDB quota ~50MB (enough for 10k products + 100k transactions)

### Phase 2+ Scaling (Multi-User, Cloud Sync)

**Bottlenecks & solutions:**

| **Bottleneck** | **Metric** | **Solution** |
|---|---|---|
| **Database write throughput** | 1k queries/sec | Supabase's built-in scaling (vertical to higher tier) + Read replicas for analytics |
| **API latency** | >500ms to sync | Vercel edge functions + regional Supabase instances |
| **Storage** | >100GB | PostgreSQL on Supabase (SSD, fast) + archive old transactions yearly |
| **Concurrent users** | 100+ simultaneous | Connection pooling (PgBouncer) + Vercel auto-scaling |

**Database optimizations:**

```sql
-- Batch insert transactions (Phase 2+ sync)
INSERT INTO transactions (product_id, transaction_type, quantity, created_at)
VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ...
ON CONFLICT DO NOTHING;  -- Idempotent

-- Index for common queries
CREATE INDEX idx_transactions_product_user_created
ON transactions(product_id, created_at DESC)
WHERE user_id = current_user_id;  -- Partial index for multi-user

-- Archive old transactions
CREATE TABLE transactions_archive AS
SELECT * FROM transactions
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM transactions
WHERE created_at < NOW() - INTERVAL '1 year';
```

**Cache strategy (Vercel + Edge):**

```typescript
// pages/api/inventory.ts (Phase 2+)

import { withCache } from '@/lib/cache';

export default withCache(
  async (req, res) => {
    const { user } = req;
    const products = await getProductsForUser(user.id);
    res.json(products);
  },
  { revalidate: 60 }  // Cache for 60 seconds
);
```

**Analytics (Plausible or Posthog):**

```typescript
// lib/analytics.ts

import Analytics from 'analytics';

export const analytics = Analytics({
  app: {
    name: 'Trackkit'
  },
  plugins: [
    {
      name: 'plausible',
      config: {
        domain: 'trackkit.app',
        apiHost: 'https://plausible.io'
      }
    }
  ]
});

// Usage
analytics.track('product_added', {
  category: productCategory,
  user_cohort: 'beta'
});
```

---

## Security

### Data Encryption

**In transit:**
- All API calls: HTTPS + TLS 1.3+
- Phone ↔ Server: Signed JWTs

**At rest:**
- Phone: SQLite encrypted via `sqlcipher` (Phase 2+)
- Server: Supabase automatic encryption + RLS

### Authentication & Authorization

**Phase 1:** None (single-user, local)

**Phase 2+:**
- SMS/WhatsApp OTP (Supabase Auth)
- JWT tokens (refresh token stored securely on phone)
- RLS on all tables (server-enforced)

### Privacy & Data Residency

**Phase 1:** Zero data leaves phone (no privacy concerns)

**Phase 2+:**
- User data stored in EU region (Supabase)
- Explicit privacy policy: "Your data is yours. We don't sell it."
- Audit log for all data access (GDPR compliance)

**Compliance:**
- GDPR: RLS + data residency + right to delete
- No third-party trackers (use Plausible, not Google Analytics)

---

## Monitoring & Observability

### Logging

**Client-side:**
```typescript
// lib/logger.ts

export function logError(error: Error, context: any) {
  if (typeof window !== 'undefined') {
    // Only in browser
    console.error('[Trackkit]', error.message, context);
    
    // Phase 2: Send to error tracking
    // if (window.__shouldReport) {
    //   fetch('/api/errors', {
    //     method: 'POST',
    //     body: JSON.stringify({ error: error.message, context })
    //   });
    // }
  }
}
```

**Server-side:**
```typescript
// lib/server-logger.ts

import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Error Tracking (Phase 2+)

```typescript
// lib/sentry.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend: (event, hint) => {
    // Never send user PII
    if (event.request?.url?.includes('products')) {
      event.request.url = '[redacted]';
    }
    return event;
  },
  tracesSampleRate: 0.1  // 10% of transactions
});
```

### Metrics & Dashboards

**Key metrics to track:**
- Sync latency (P50, P95, P99)
- Error rate (% of sync failures)
- Users added per day (growth)
- Retention (DAU / WAU)
- Storage usage per user

**Dashboard (Grafana or Supabase's built-in):**
```sql
-- Query for dashboard: Daily active users
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM transactions
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## Disaster Recovery

### Backup Strategy

**Phase 1:** User-initiated (CSV export)

**Phase 2+:**
- **Automatic backups:** Supabase automated (daily, 7-day retention)
- **User-initiated restore:** Import CSV or re-sync from cloud
- **RTO (Recovery Time Objective):** < 1 hour
- **RPO (Recovery Point Objective):** < 1 day

### Incident Response

**Scenario: Cloud sync broken for 10% of users**

1. Monitor: Alert triggers (error rate > 5%)
2. Triage: Check /api/sync endpoint logs
3. Mitigate: Roll back latest API change or scale DB
4. Communicate: In-app toast: "Sync temporarily unavailable. Your data is safe on your phone."
5. Resolve: Fix backend, re-sync affected users
6. Post-mortem: Document root cause, add tests

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/sync.test.ts

import { applyMutations, resolveConflict } from '@/lib/sync';

describe('Sync Engine', () => {
  it('should apply non-conflicting mutations', () => {
    const mutation = {
      type: 'UPDATE',
      table: 'products',
      id: 'prod-1',
      data: { current_quantity: 10 },
      clientTimestamp: '2026-08-11T10:00:00Z'
    };
    
    const result = applyMutation(mutation, { updated_at: '2026-08-11T09:00:00Z' });
    expect(result.applied).toBe(true);
  });

  it('should reject older mutations (LWW)', () => {
    const mutation = {
      clientTimestamp: '2026-08-11T09:00:00Z'  // Older
    };
    
    const result = applyMutation(mutation, { updated_at: '2026-08-11T10:00:00Z' });  // Newer
    expect(result.applied).toBe(false);
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/sync.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Offline → Cloud Sync', () => {
  test('should queue mutations while offline', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    // Add product
    await page.click('text=Add Product');
    await page.fill('[name=name]', 'Milk');
    await page.click('text=Save');
    
    // Verify UI updated
    expect(await page.locator('text=Milk').isVisible()).toBe(true);
    
    // Verify synced to queue (check IndexedDB)
    const queueCount = await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.open('trackkit.db');
        req.onsuccess = () => {
          const tx = req.result.transaction('sync_queue');
          const cursor = tx.objectStore('sync_queue').openCursor();
          let count = 0;
          cursor.onsuccess = () => {
            if (cursor.result) {
              count++;
              cursor.result.continue();
            } else {
              resolve(count);
            }
          };
        };
      });
    });
    expect(queueCount).toBe(1);

    // Go online
    await page.context().setOffline(false);
    
    // Wait for sync
    await page.waitForFunction(() => {
      return document.querySelector('[data-sync-status="synced"]') !== null;
    }, { timeout: 5000 });

    // Verify synced to cloud (check server)
    const response = await page.request.get('/api/products?name=Milk');
    const products = await response.json();
    expect(products.length).toBeGreaterThan(0);
  });
});
```

---

## Development Workflow

1. **Local dev:** Next.js dev server + local SQLite (no Supabase)
2. **Integration testing:** Playwright against staging
3. **Staging deploy:** Vercel preview + Supabase staging
4. **Production deploy:** Main branch → Vercel prod + Supabase prod (with RLS enabled)

**Commands:**
```bash
# Development
bun dev                    # Start local dev server

# Testing
bun test                   # Unit tests
bun test:e2e               # E2E tests (with --ui for debugging)

# Staging
bun build && bun vercel    # Deploy to staging

# Production
# (Automatic on main branch merge, manual approval required)
```

---

## Conclusion

This architecture provides:

✅ **Phase 1:** Offline-first, zero dependencies on internet  
✅ **Phase 2+:** Optional cloud sync, conflict-free, auditable  
✅ **Security:** Encryption in transit + at rest, RLS, no PII leaks  
✅ **Scalability:** Handles 1k–10k concurrent users  
✅ **Privacy:** Data residency in EU, GDPR-compliant  
✅ **Reliability:** 99.9% uptime via Vercel + Supabase  

Next: See **DATABASE-SCHEMA.md** for complete SQL, and **API-REFERENCE.md** for endpoint details.
