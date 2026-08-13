import { v4 as uuidv4 } from "uuid";
import { getDB, persist } from "./sqlite-init";
import { execute, queryAll } from "./sql-helpers";
import { fetchProduct } from "./products";
import type {
  Product,
  Transaction,
  TransactionType,
  PurchaseHistoryEntry,
  SupplierStat,
} from "./types";

// ─── Basic transaction queries ────────────────────────────────────────────────

export function fetchTransactions(productId?: string): Transaction[] {
  const db = getDB();
  if (productId) {
    return queryAll<Transaction>(
      db,
      `SELECT * FROM transactions WHERE product_id = :product_id ORDER BY created_at DESC`,
      { ":product_id": productId },
    );
  }
  return queryAll<Transaction>(
    db,
    `SELECT * FROM transactions ORDER BY created_at DESC`,
  );
}

/** Logs a sale/restock transaction and applies the resulting quantity change to the product. */
export async function logTransaction(
  productId: string,
  type: TransactionType,
  quantity: number,
  notes?: string,
  supplier?: string,
  costPerUnit?: number,
): Promise<Product> {
  if (quantity <= 0) {
    throw new Error("Transaction quantity must be greater than 0");
  }

  const db = getDB();
  const product = fetchProduct(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const delta = type === "restock" ? quantity : -quantity;
  const newQuantity = Math.max(0, product.current_quantity + delta);
  const now = new Date().toISOString();

  execute(
    db,
    `UPDATE products SET current_quantity = :qty, updated_at = :updated_at WHERE id = :id`,
    { ":qty": newQuantity, ":updated_at": now, ":id": productId },
  );

  execute(
    db,
    `INSERT INTO transactions (id, product_id, transaction_type, quantity, notes, supplier, cost_per_unit, created_at)
     VALUES (:id, :product_id, :transaction_type, :quantity, :notes, :supplier, :cost_per_unit, :created_at)`,
    {
      ":id": uuidv4(),
      ":product_id": productId,
      ":transaction_type": type,
      ":quantity": quantity,
      ":notes": notes ?? null,
      ":supplier": supplier ?? null,
      ":cost_per_unit": costPerUnit ?? null,
      ":created_at": now,
    },
  );

  await persist(db);
  return fetchProduct(productId) as Product;
}

// ─── Purchase History ─────────────────────────────────────────────────────────

export interface FetchRestockHistoryOptions {
  productId?: string;
  supplier?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  limit?: number;
  offset?: number;
}

export interface RestockHistoryResult {
  entries: PurchaseHistoryEntry[];
  total: number;
  summary: {
    totalSpent: number;
    avgCostPerUnit: number | null;
    totalUnits: number;
    frequencyPerMonth: number;
  };
}

/** Fetch paginated restock transactions joined with product info. */
export function fetchRestockHistory(
  opts: FetchRestockHistoryOptions = {},
): RestockHistoryResult {
  const db = getDB();
  const {
    productId,
    supplier,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = opts;

  const conditions: string[] = ["t.transaction_type = 'restock'"];
  const params: Record<string, string | number | null> = {};

  if (productId) {
    conditions.push("t.product_id = :product_id");
    params[":product_id"] = productId;
  }
  if (supplier) {
    conditions.push("LOWER(t.supplier) LIKE :supplier");
    params[":supplier"] = `%${supplier.toLowerCase()}%`;
  }
  if (startDate) {
    conditions.push("t.created_at >= :start_date");
    params[":start_date"] = startDate;
  }
  if (endDate) {
    // Inclusive end-of-day
    params[":end_date"] = endDate.replace("T00:00:00.000Z", "T23:59:59.999Z").length > 10
      ? endDate
      : `${endDate}T23:59:59.999Z`;
    conditions.push("t.created_at <= :end_date");
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const entries = queryAll<PurchaseHistoryEntry>(
    db,
    `SELECT
       t.id,
       t.product_id,
       p.name AS product_name,
       p.unit AS product_unit,
       t.quantity,
       t.cost_per_unit,
       CASE WHEN t.cost_per_unit IS NOT NULL THEN t.quantity * t.cost_per_unit ELSE NULL END AS total_cost,
       t.supplier,
       t.notes,
       t.created_at
     FROM transactions t
     JOIN products p ON p.id = t.product_id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, ":limit": limit, ":offset": offset },
  );

  // Total count for pagination
  const countRows = queryAll<{ cnt: number }>(
    db,
    `SELECT COUNT(*) AS cnt FROM transactions t JOIN products p ON p.id = t.product_id ${where}`,
    params,
  );
  const total = countRows[0]?.cnt ?? 0;

  // Summary aggregates
  const aggRows = queryAll<{
    total_spent: number | null;
    avg_cost: number | null;
    total_units: number;
    first_date: string | null;
    last_date: string | null;
    purchase_count: number;
  }>(
    db,
    `SELECT
       SUM(t.quantity * COALESCE(t.cost_per_unit, 0)) AS total_spent,
       AVG(t.cost_per_unit) AS avg_cost,
       SUM(t.quantity) AS total_units,
       MIN(t.created_at) AS first_date,
       MAX(t.created_at) AS last_date,
       COUNT(*) AS purchase_count
     FROM transactions t
     JOIN products p ON p.id = t.product_id
     ${where}`,
    params,
  );

  const agg = aggRows[0] ?? {
    total_spent: 0,
    avg_cost: null,
    total_units: 0,
    first_date: null,
    last_date: null,
    purchase_count: 0,
  };

  let frequencyPerMonth = 0;
  if (agg.first_date && agg.last_date && agg.purchase_count > 0) {
    const firstMs = new Date(agg.first_date).getTime();
    const lastMs = new Date(agg.last_date).getTime();
    const monthsSpan = Math.max(
      1,
      (lastMs - firstMs) / (1000 * 60 * 60 * 24 * 30),
    );
    frequencyPerMonth = Math.round((agg.purchase_count / monthsSpan) * 10) / 10;
  }

  return {
    entries,
    total,
    summary: {
      totalSpent: agg.total_spent ?? 0,
      avgCostPerUnit: agg.avg_cost ?? null,
      totalUnits: agg.total_units ?? 0,
      frequencyPerMonth,
    },
  };
}

// ─── Supplier Intelligence ────────────────────────────────────────────────────

/** Returns per-supplier aggregated stats for a given product, sorted cheapest first. */
export function fetchSupplierStats(productId: string): SupplierStat[] {
  const db = getDB();

  const rows = queryAll<{
    supplier: string | null;
    last_price: number | null;
    last_date: string | null;
    total_spent: number;
    total_qty: number;
    avg_price: number | null;
    purchase_count: number;
  }>(
    db,
    `SELECT
       COALESCE(t.supplier, 'Unknown') AS supplier,
       (SELECT cost_per_unit FROM transactions
        WHERE product_id = :product_id AND transaction_type = 'restock'
          AND COALESCE(supplier, 'Unknown') = COALESCE(t.supplier, 'Unknown')
        ORDER BY created_at DESC LIMIT 1) AS last_price,
       MAX(t.created_at) AS last_date,
       SUM(t.quantity * COALESCE(t.cost_per_unit, 0)) AS total_spent,
       SUM(t.quantity) AS total_qty,
       AVG(t.cost_per_unit) AS avg_price,
       COUNT(*) AS purchase_count
     FROM transactions t
     WHERE t.product_id = :product_id
       AND t.transaction_type = 'restock'
     GROUP BY COALESCE(t.supplier, 'Unknown')
     ORDER BY avg_price ASC`,
    { ":product_id": productId },
  );

  if (rows.length === 0) return [];

  // Find max avg price to compute savings vs cheapest
  const maxAvg = rows.reduce(
    (mx, r) => Math.max(mx, r.avg_price ?? 0),
    0,
  );

  return rows.map((row, idx) => {
    const avg = row.avg_price ?? 0;
    const savingsPercent =
      maxAvg > 0 ? Math.round(((maxAvg - avg) / maxAvg) * 100) : 0;
    return {
      name: row.supplier ?? "Unknown",
      lastPrice: row.last_price,
      lastDate: row.last_date,
      totalSpent: row.total_spent,
      totalQty: row.total_qty,
      avgPrice: row.avg_price,
      purchaseCount: row.purchase_count,
      savingsPercent,
      isCheapest: idx === 0 && rows.length > 1,
    };
  });
}

/** Returns a list of all unique suppliers the user has bought from (across all products). */
export function fetchAllSupplierNames(): string[] {
  const db = getDB();
  const rows = queryAll<{ supplier: string }>(
    db,
    `SELECT DISTINCT COALESCE(supplier, 'Unknown') AS supplier
     FROM transactions
     WHERE transaction_type = 'restock' AND supplier IS NOT NULL
     ORDER BY supplier ASC`,
  );
  return rows.map((r) => r.supplier);
}
