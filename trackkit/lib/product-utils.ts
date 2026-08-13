import type { Product } from "./types";

export function isLowStock(product: Product): boolean {
  return (
    product.low_stock_threshold != null &&
    product.current_quantity <= product.low_stock_threshold
  );
}

/** Low-stock items first (most urgent — closest to 0 — first), then everything else unchanged. */
export function sortByLowStockFirst(products: Product[]): Product[] {
  const lowStock = products.filter(isLowStock).sort((a, b) => a.current_quantity - b.current_quantity);
  const rest = products.filter((p) => !isLowStock(p));
  return [...lowStock, ...rest];
}
