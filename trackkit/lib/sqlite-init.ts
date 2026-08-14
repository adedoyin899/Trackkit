import initSqlJs, { type Database } from "sql.js";
import { get, set } from "idb-keyval";

const DB_STORAGE_KEY = "trackkit-db";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  category TEXT,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  low_stock_threshold INTEGER,
  selling_price_per_unit DECIMAL(10, 2),
  cost_per_unit DECIMAL(10, 2) DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  CHECK (current_quantity >= 0),
  CHECK (low_stock_threshold >= 0 OR low_stock_threshold IS NULL)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  supplier TEXT DEFAULT NULL,
  cost_per_unit DECIMAL(10, 2) DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_synced_at TEXT,
  last_sync_error TEXT,
  pending_mutations_count INTEGER DEFAULT 0,
  is_syncing INTEGER DEFAULT 0,
  device_id TEXT UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  mutation_type TEXT NOT NULL CHECK (mutation_type IN ('CREATE', 'UPDATE', 'DELETE')),
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  client_timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  synced_at TEXT DEFAULT NULL,
  retry_count INTEGER DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  selling_price_per_unit DECIMAL(10, 2) NOT NULL,
  margin_percent INTEGER,
  effective_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_supplier ON transactions(supplier);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON sync_queue(synced_at);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON prices(product_id);
`;

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function loadDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`,
  });

  const savedBytes = await get<Uint8Array>(DB_STORAGE_KEY);
  const db = savedBytes ? new SQL.Database(savedBytes) : new SQL.Database();

  db.run(SCHEMA_SQL);

  // Migrate existing databases to add cost_per_unit to products if missing
  try {
    db.exec("SELECT cost_per_unit FROM products LIMIT 1");
  } catch {
    db.run("ALTER TABLE products ADD COLUMN cost_per_unit DECIMAL(10, 2) DEFAULT NULL");
  }

  // Migrate existing databases to add supplier + cost_per_unit to transactions if missing
  try {
    db.exec("SELECT supplier FROM transactions LIMIT 1");
  } catch {
    db.run("ALTER TABLE transactions ADD COLUMN supplier TEXT DEFAULT NULL");
  }
  try {
    db.exec("SELECT cost_per_unit FROM transactions LIMIT 1");
  } catch {
    db.run("ALTER TABLE transactions ADD COLUMN cost_per_unit DECIMAL(10, 2) DEFAULT NULL");
  }

  if (!savedBytes) {
    db.run(
      `INSERT OR IGNORE INTO sync_metadata (id, device_id) VALUES (1, :device_id)`,
      {
        ":device_id":
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) +
              Math.random().toString(36).substring(2),
      }
    );
    await persist(db);
  }

  return db;
}

/** Persists the current in-memory database to IndexedDB. Call after every mutation. */
export async function persist(db: Database = requireDB()): Promise<void> {
  const bytes = db.export();
  await set(DB_STORAGE_KEY, bytes);
}

function requireDB(): Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return dbInstance;
}

/** Initializes (or returns the already-initialized) local SQLite database. Browser-only. */
export function initDB(): Promise<Database> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("initDB() can only be called in the browser"),
    );
  }
  if (!initPromise) {
    initPromise = loadDatabase().then((db) => {
      dbInstance = db;
      if (typeof window !== "undefined") {
        (window as unknown as { __db: Database }).__db = db;
      }
      return db;
    });
  }
  return initPromise;
}

/** Returns the initialized database instance. Throws if initDB() hasn't resolved yet. */
export function getDB(): Database {
  return requireDB();
}
