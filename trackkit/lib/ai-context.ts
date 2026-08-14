import { fetchProducts } from "./products";
import { fetchTransactions } from "./transactions";
import { calculateMargin } from "@/hooks/useMarginCalculation";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AIProductSummary {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  currentQuantity: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  costPerUnit: number | null;
  sellingPricePerUnit: number | null;
  marginPercent: number | null;
  unitsSoldLast7Days: number;
  unitsSoldLast30Days: number;
  lastRestock: {
    date: string;
    supplier: string | null;
    costPerUnit: number | null;
  } | null;
}

export interface AIContextPayload {
  currency: string;
  today: string;
  focusProductId?: string;
  products: AIProductSummary[];
}

/**
 * Builds a compact summary of the user's LOCAL inventory/transaction data
 * for the AI chat backend. Runs client-side because that's where the real
 * data lives — Supabase's products/transactions tables aren't populated
 * (no sync engine pushes to them yet), so a server-side query would return
 * nothing for almost every user. The backend never touches local SQLite;
 * it just formats whatever this function sends it for Claude.
 */
export function buildAIContext(focusProductId?: string): AIContextPayload {
  const products = fetchProducts();
  const transactions = fetchTransactions();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * DAY_MS;
  const thirtyDaysAgo = now - 30 * DAY_MS;

  const productSummaries: AIProductSummary[] = products.map((p) => {
    const productTx = transactions.filter((t) => t.product_id === p.id);
    const sales = productTx.filter((t) => t.transaction_type === "sale");
    const restocks = productTx.filter((t) => t.transaction_type === "restock");

    const unitsSoldLast7Days = sales
      .filter((t) => new Date(t.created_at).getTime() >= sevenDaysAgo)
      .reduce((sum, t) => sum + t.quantity, 0);
    const unitsSoldLast30Days = sales
      .filter((t) => new Date(t.created_at).getTime() >= thirtyDaysAgo)
      .reduce((sum, t) => sum + t.quantity, 0);

    const { marginPercent } = calculateMargin(p.cost_per_unit, p.selling_price_per_unit);

    // transactions.ts's fetchTransactions() is ordered created_at DESC, and
    // Array.filter preserves order, so [0] here is the most recent restock.
    const lastRestockTx = restocks[0] ?? null;

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      currentQuantity: p.current_quantity,
      lowStockThreshold: p.low_stock_threshold,
      isLowStock:
        p.low_stock_threshold != null && p.current_quantity <= p.low_stock_threshold,
      costPerUnit: p.cost_per_unit,
      sellingPricePerUnit: p.selling_price_per_unit,
      marginPercent,
      unitsSoldLast7Days,
      unitsSoldLast30Days,
      lastRestock: lastRestockTx
        ? {
            date: lastRestockTx.created_at,
            supplier: lastRestockTx.supplier,
            costPerUnit: lastRestockTx.cost_per_unit,
          }
        : null,
    };
  });

  return {
    currency: "₦",
    today: new Date().toISOString().slice(0, 10),
    focusProductId,
    products: productSummaries,
  };
}
