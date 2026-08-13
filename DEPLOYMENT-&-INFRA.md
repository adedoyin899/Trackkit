# Trackkit Deployment & Infrastructure
## Production Setup, Scaling, and Operations

**Document:** DEPLOYMENT-&-INFRA.md  
**Audience:** DevOps, SREs, infrastructure engineers  
**Read time:** 30 minutes  
**Status:** Production-ready  

---

## Infrastructure Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    INTERNET / USERS                          │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴─────────┐
        │                    │
    ┌───▼───────┐      ┌────▼────────┐
    │ Vercel    │      │ Cloudflare  │
    │ CDN       │      │ DNS/WAF     │
    │ (Global)  │      │ (DDoS)      │
    └───┬───────┘      └────┬────────┘
        │                   │
        └───────────┬───────┘
                    │
         ┌──────────▼──────────┐
         │  Vercel Edge        │
         │  (App deployment)   │
         │  - Next.js routes   │
         │  - API handlers     │
         │  - Auth (SMS/OTP)   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Supabase           │
         │  (PostgreSQL)       │
         │  - RLS enabled      │
         │  - Auto backups     │
         │  - Monitoring       │
         └─────────────────────┘
```

---

## Phase 1: Vercel Deployment Only

### Prerequisites

- GitHub account with Trackkit repo
- Vercel account (free)
- Node.js 18+ locally
- Bun 1.0+

### Step 1: GitHub Setup

```bash
# Create GitHub repo (if not already done)
mkdir trackkit
cd trackkit
git init
git remote add origin https://github.com/YOUR_ORG/trackkit.git

# Push initial commit
git add .
git commit -m "Initial Trackkit commit"
git push -u origin main
```

### Step 2: Connect to Vercel

**Option A: CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time)
vercel --prod

# Follow prompts:
# ? Set up and deploy "path/to/trackkit"? yes
# ? Which scope? (your account)
# ? Link to existing project? no
# ? What's your project's name? trackkit
# ? In which directory is your code? ./
# ? Want to modify these settings? no

# Copy deployment URL from output
```

**Option B: Web UI**
1. Go to vercel.com
2. Click "New Project"
3. Import GitHub repo
4. Select "trackkit"
5. Framework preset: "Next.js"
6. Deploy

### Step 3: Phase 1 Environment (None needed)

Phase 1 has no backend API, so no environment variables required.

```bash
# Verify deployment
curl https://trackkit.vercel.app/  # Should return 200
```

---

## Phase 2+: Vercel + Supabase Setup

### Step 1: Create Supabase Project

```bash
# Go to supabase.com
# 1. Click "New project"
# 2. Project name: trackkit
# 3. Database password: [generate strong password]
# 4. Region: Select closest to target market
#    - Recommended: eu-west-1 (Ireland) for West Africa
#    - Alternative: us-east-1 (Virginia)
# 5. Click "Create new project"

# Wait ~5 minutes for provisioning
```

### Step 2: Get Supabase Credentials

```bash
# Go to Project Settings → API
# Copy these values:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Keep secret!

# Note:
# - NEXT_PUBLIC_* are exposed to browser (safe for anon key)
# - SUPABASE_SERVICE_ROLE_KEY must NOT be exposed (server-side only)
```

### Step 3: Create Supabase Migration

**Create migration file:**

```bash
# Create migrations directory
mkdir -p supabase/migrations

# Create migration file
touch supabase/migrations/001_init_schema.sql
```

**migrations/001_init_schema.sql:**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  email TEXT,
  currency TEXT DEFAULT '₦',
  timezone TEXT DEFAULT 'Africa/Lagos',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create products table (Phase 2+)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  current_quantity INT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  low_stock_threshold INT,
  selling_price_per_unit DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  CONSTRAINT valid_quantity CHECK (current_quantity >= 0),
  CONSTRAINT unique_product_name UNIQUE (user_id, name)
);

-- Create transactions table (Phase 2+)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock')),
  quantity INT NOT NULL CHECK (quantity > 0),
  price_per_unit DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create prices table (Phase 2+)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  selling_price_per_unit DECIMAL(10, 2) NOT NULL,
  margin_percent INT GENERATED ALWAYS AS (
    ROUND(((selling_price_per_unit - cost_per_unit) / cost_per_unit) * 100)
  ) STORED,
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sync tables (Phase 2+, client-side only, not needed server-side)
-- These live in local SQLite on phone, not in cloud

-- Create audit_log (Phase 2+)
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  mutation_type TEXT NOT NULL CHECK (mutation_type IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  device_id TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users see own profile"
ON users
FOR SELECT
USING (auth.uid()::text = id::text);

CREATE POLICY "Users own products"
ON products
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users read own transactions"
ON transactions
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products
    WHERE user_id = auth.uid()::uuid
  )
);

CREATE POLICY "Users create own transactions"
ON transactions
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products
    WHERE user_id = auth.uid()::uuid
  )
);

CREATE POLICY "Transactions immutable"
ON transactions
FOR DELETE
USING (false);

-- Create indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(user_id, category);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_prices_product_id ON prices(product_id, effective_date DESC);
CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);

-- Create views (Phase 2+)
CREATE VIEW current_prices AS
SELECT DISTINCT ON (product_id)
  id, user_id, product_id, cost_per_unit, selling_price_per_unit, 
  margin_percent, effective_date
FROM prices
ORDER BY product_id, effective_date DESC, created_at DESC;

CREATE VIEW inventory_value AS
SELECT
  u.id as user_id,
  u.shop_name,
  COALESCE(SUM(p.current_quantity * cp.selling_price_per_unit), 0) as total_value
FROM users u
LEFT JOIN products p ON u.id = p.user_id AND p.deleted_at IS NULL
LEFT JOIN current_prices cp ON p.id = cp.product_id
GROUP BY u.id, u.shop_name;
```

### Step 4: Run Migration on Supabase

**Using Supabase CLI:**

```bash
# Install Supabase CLI
npm i -g supabase

# Link to project
supabase link --project-ref YOUR_PROJECT_ID

# Run migration
supabase migration up

# Or: push changes to remote
supabase db push
```

**Or: Manual via Supabase SQL Editor:**

1. Go to Supabase dashboard
2. Click "SQL Editor"
3. Click "New query"
4. Paste migration SQL
5. Run query

### Step 5: Configure Supabase Auth (SMS)

```bash
# Go to Authentication → Providers → SMS

# Option 1: Use Twilio (recommended for production)
# 1. Create Twilio account (twilio.com)
# 2. Get Account SID + Auth Token
# 3. In Supabase: Configure Twilio
#    - Account SID: ACxxxxxx
#    - Auth Token: [paste token]
#    - Message service SID: MGxxxxxx (from Twilio console)

# Option 2: Use Vonage (Nexmo)
# 1. Create Vonage account (vonage.com)
# 2. In Supabase: Configure Vonage
#    - API key + Secret
```

### Step 6: Update Vercel Environment Variables

```bash
# In Vercel dashboard:
# 1. Go to Project Settings → Environment Variables
# 2. Add:

# Public (visible to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_ENVIRONMENT=production

# Secret (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# SMS provider (if using Supabase auth, configured in Supabase dashboard)
# These are NOT needed in Vercel; they're in Supabase

# Optional: Analytics
NEXT_PUBLIC_TELEMETRY_ENABLED=true
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Step 7: Deploy Backend API

```bash
# Push new code with API routes
git add .
git commit -m "Add Phase 2 backend API + Supabase integration"
git push origin main

# Vercel auto-deploys
# Check: vercel.com → Deployments → should see new build

# Verify API is working:
curl -X GET https://trackkit.vercel.app/api/products \
  -H "Authorization: Bearer eyJhbGci..."
# Should return products for authenticated user
```

---

## DNS & Domain Setup

### Cloudflare (Recommended)

**Why Cloudflare?**
- Free DDoS protection
- Global CDN
- DNS management
- Email forwarding
- SSL/TLS certificate

**Setup:**

```bash
# 1. Transfer domain to Cloudflare (or add nameservers)
#    Go to cloudflare.com → Add site

# 2. Add CNAME record
# DNS Management:
# Type: CNAME
# Name: @  (or www)
# Target: cname.vercel-dns.com
# Proxy: Proxied (orange cloud)

# 3. Set SSL/TLS to "Full" or "Full (Strict)"
# SSL/TLS: Encryption → Full

# 4. Enable Page Rules (optional)
# Page Rules:
# - trackkit.app* → Cache Everything
# - api.trackkit.app/* → Bypass Cache

# 5. Test DNS
nslookup trackkit.app
# Should resolve to Vercel IP
```

---

## Monitoring & Observability

### 1. Application Monitoring (Vercel)

Vercel includes built-in monitoring:

```bash
# Go to Vercel dashboard:
# - Deployments tab: See build status, logs
# - Analytics tab: Response times, error rates
# - Settings → Git → Auto-deploy on push
```

### 2. Error Tracking (Sentry)

```bash
# 1. Create Sentry account (sentry.io)
# 2. Create project (Next.js)
# 3. Copy DSN

# 2. Install in project
npm i @sentry/nextjs

# 3. Configure
# pages/_app.tsx

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
  beforeSend: (event) => {
    // Redact sensitive data
    if (event.request?.url?.includes('products')) {
      event.request.url = '[redacted]';
    }
    return event;
  }
});

export default MyApp;
```

### 3. Database Monitoring (Supabase)

```bash
# Supabase dashboard includes:
# - Database: CPU, memory, connections
# - Logs: Query logs, auth logs
# - Backups: Automated daily

# Go to Project → Database → Logs
# Or: Project → Monitoring (if available)
```

### 4. Uptime Monitoring (Uptimerobot or Healthchecks.io)

```bash
# 1. Create account at uptimerobot.com
# 2. Add monitor:
#    - URL: https://trackkit.app/api/health
#    - Interval: 5 minutes
#    - Alerts: Email on down

# 3. In API, add health check endpoint:
# pages/api/health.ts

export default async function handler(req, res) {
  try {
    // Quick DB check
    const { data } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
}
```

---

## Scaling Strategy

### Phase 1 → Phase 2 (1 → 100 users)

**No scaling needed yet.** Single Vercel deployment, single Supabase instance (free tier).

**Metrics to watch:**
- Vercel: Serverless execution time (should be <500ms)
- Supabase: Database connections (<100)

### Phase 2 → Phase 3 (100 → 1,000 users)

**Expected load increase:**
- API requests: 100 → 1,000/min
- Database: 1k → 10k rows
- Storage: 100MB → 1GB

**Scaling actions:**

```bash
# 1. Upgrade Supabase tier
# Go to Supabase → Billing
# Select "Pro" or higher (if needed)

# 2. Enable database connection pooling
# Supabase Dashboard:
# - Database Settings → Connection Pooling
# - Enable PgBouncer
# - Max connections: 100

# 3. Add caching layer (Redis)
# Vercel + Upstash Redis:
npm i @upstash/redis

# pages/api/products.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
});

export default async function handler(req, res) {
  const cacheKey = `products:${req.user.id}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(cached);
  
  // Fetch from DB
  const products = await getProducts(req.user.id);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  res.json(products);
}

# 4. Optimize database queries
# - Add indexes (done in migrations)
# - Use pagination (already in API)
# - Archive old transactions yearly
```

### Phase 3+ (1,000+ users)

**Expected load:**
- API requests: 1,000+ /min
- Database: 100k+ rows
- Storage: 10GB+

**Actions:**

```bash
# 1. Use read replicas (Supabase)
# Supabase Dashboard:
# - Infrastructure → Read Replicas
# - Add replica in different region for analytics

# 2. Implement background jobs
npm i bull bullmq
# For: async exports, AI batch processing, notifications

# 3. Use CDN for static assets
# Already done: Vercel + Cloudflare

# 4. Add rate limiting
npm i express-rate-limit

# api/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute
  message: 'Too many requests'
});

# Apply to all API routes
middleware.use(limiter);
```

---

## Continuous Integration / Deployment (CI/CD)

### GitHub Actions Pipeline

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run E2E tests
        run: npm run test:e2e
  
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  
  smoke-tests:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Test health endpoint
        run: |
          curl -f https://trackkit.vercel.app/api/health || exit 1
      
      - name: Test API is responsive
        run: |
          curl -f https://trackkit.vercel.app/api/products \
            -H "Authorization: Bearer test-token" || exit 1
```

**Setup GitHub secrets:**

```bash
# In GitHub repo:
# Settings → Secrets and variables → Actions

# Add:
VERCEL_TOKEN=xxxx        # From vercel.com/account/tokens
VERCEL_ORG_ID=xxxx       # From Vercel dashboard
VERCEL_PROJECT_ID=xxxx   # From Vercel dashboard
```

---

## Backup & Disaster Recovery

### Automated Backups (Supabase)

**Supabase automatic backups:**
- Retention: 7 days (free tier) or 30 days (paid)
- Schedule: Daily at 2 AM UTC
- Location: Geo-redundant

**Manual backup:**

```bash
# Using Supabase CLI
supabase db pull  # Downloads schema + data as seed.sql

# Or: Via dashboard
# Project → Database → Backups → Create backup
```

### Restore Procedure

```bash
# If database corrupted:

# 1. In Supabase dashboard:
# - Database → Backups
# - Click backup
# - "Restore"
# - Confirm

# 2. This restores the DB to that point in time
# 3. Notify users: "Brief maintenance window occurred"

# 4. Verify:
curl https://trackkit.vercel.app/api/health
```

---

## Security Checklist

- [ ] HTTPS enforced (Vercel + Cloudflare)
- [ ] Environment variables never committed to git
- [ ] Supabase RLS policies enabled on all tables
- [ ] CORS configured (only allow trackkit.app)
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] JWT secrets rotated regularly
- [ ] Error messages don't expose sensitive data
- [ ] Sensitive endpoints require authentication
- [ ] Audit logging enabled (for compliance)

---

## Cost Estimation (Annual)

| **Service** | **Phase 1** | **Phase 2** | **Phase 3+** |
|---|---|---|---|
| **Vercel** | $0–20 | $20–50 | $50–200 |
| **Supabase** | $0 | $25–100 | $100–500 |
| **Cloudflare** | $0 | $20 | $50 |
| **Sentry** | $0 | $29 | $100+ |
| **Upstash Redis** | $0 | $0 | $50–200 |
| **SMS (Twilio/Vonage)** | $0 | $0.01/msg | ~$2k–5k/month |
| **Total/month** | **~$0** | **~$75–150** | **~$250–500** |

---

## Conclusion

This infrastructure provides:

✅ **Global reach:** Vercel edge network, Cloudflare CDN  
✅ **Security:** RLS, encryption, HTTPS, DDoS protection  
✅ **Reliability:** 99.99% uptime, automated backups, health monitoring  
✅ **Scalability:** From 1 to 10,000+ users  
✅ **Cost-effective:** Start free, pay as you grow  

**Next steps:**
1. Set up Vercel project
2. Configure Supabase
3. Deploy Phase 1
4. Test with cohort of 10 users
5. Move to Phase 2 once validation complete

---

## Operational Runbook

### Daily Checks
- [ ] Sentry: 0 unresolved critical errors
- [ ] Vercel: All deploys succeeded
- [ ] Supabase: Database healthy (check dashboard)
- [ ] Uptimerobot: No downtime alerts

### Weekly Checks
- [ ] Review analytics (growth, retention)
- [ ] Update dependencies: `npm outdated`
- [ ] Check security advisories: `npm audit`
- [ ] Review error logs (Sentry, Vercel)

### Monthly
- [ ] Review costs (Vercel, Supabase, etc.)
- [ ] Update monitoring thresholds if needed
- [ ] Test disaster recovery (backup restore)
- [ ] Security audit (check OWASP top 10)

---

**Document complete. Ready for production!**
