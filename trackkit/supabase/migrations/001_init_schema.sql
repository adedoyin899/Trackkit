-- Trackkit — initial Supabase schema
-- Run in the Supabase SQL Editor (or `supabase migration up` if linked via CLI).
-- Mirrors the local SQLite schema in lib/sqlite-init.ts, adapted for
-- Postgres + RLS: user_id becomes a real FK to auth users instead of a
-- nullable local field, and transactions carries the same supplier /
-- cost_per_unit columns the Phase 2 restock and purchase-history features
-- read locally, so a future sync engine has a matching contract.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  current_quantity INT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  low_stock_threshold INT,
  selling_price_per_unit DECIMAL(10, 2),
  cost_per_unit DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  CONSTRAINT valid_quantity CHECK (current_quantity >= 0),
  CONSTRAINT unique_product_name UNIQUE (user_id, name)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock')),
  quantity INT NOT NULL CHECK (quantity > 0),
  supplier TEXT,
  cost_per_unit DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

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

-- sync_metadata / sync_queue are client-side only (local SQLite) — a device's
-- outbox for mutations not yet pushed here. They have no server-side table.

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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users own prices"
ON prices
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users read own audit log"
ON audit_log
FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(user_id, category);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_supplier ON transactions(supplier);
CREATE INDEX idx_prices_product_id ON prices(product_id, effective_date DESC);
CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);

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
