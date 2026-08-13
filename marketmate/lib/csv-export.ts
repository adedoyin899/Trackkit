import Papa from "papaparse";
import type { Product, Transaction } from "./types";

function formatTimestamp(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Builds the MarketMate export CSV: inventory snapshot (per PHASE-1-MVP.md's
 * format) plus full transaction history, so a phone-loss backup doesn't lose
 * the sale/restock log — just the current quantities.
 */
export function buildInventoryCsv(
  products: Product[],
  transactions: Transaction[],
  shopName: string | null,
): string {
  const header = [
    "MarketMate Inventory Export",
    `Exported: ${formatTimestamp(new Date())}`,
    `Shop Name: ${shopName ?? ""}`,
    "",
  ].join("\n");

  const productRows = products.map((p) => ({
    "Product Name": p.name,
    Category: p.category ?? "",
    "Current Qty": p.current_quantity,
    Unit: p.unit,
    "Selling Price": p.selling_price_per_unit ?? "",
    "Low-Stock Threshold": p.low_stock_threshold ?? "",
  }));
  const productsTable = Papa.unparse(productRows);

  const productNameById = new Map(products.map((p) => [p.id, p.name]));
  const transactionRows = transactions.map((t) => ({
    Date: t.created_at,
    "Product Name": productNameById.get(t.product_id) ?? "(deleted product)",
    Type: t.transaction_type,
    Quantity: t.quantity,
    Notes: t.notes ?? "",
  }));
  const transactionsTable = Papa.unparse(transactionRows);

  return [
    header,
    productsTable,
    "",
    "Transaction History",
    transactionsTable,
  ].join("\n");
}

/** Triggers a browser download of the given CSV content. */
export function downloadCsv(csv: string, filename = "marketmate-export.csv") {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
