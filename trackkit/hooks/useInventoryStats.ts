"use client";

import { useMemo } from "react";
import { useLocalInventory } from "./useLocalInventory";
import { isLowStock } from "@/lib/product-utils";
import type { InventoryStats } from "@/lib/types";

/** Computes dashboard stats (low-stock count, total value) from the current product list. */
export function useInventoryStats(): InventoryStats & { isLoading: boolean } {
  const { products, isLoading } = useLocalInventory();

  const stats = useMemo<InventoryStats>(() => {
    const lowStockItems = products
      .filter(isLowStock)
      .sort((a, b) => a.current_quantity - b.current_quantity);

    const hasAllPrices =
      products.length > 0 &&
      products.every((p) => p.selling_price_per_unit != null);

    const totalInventoryValue = hasAllPrices
      ? products.reduce(
          (sum, p) => sum + p.current_quantity * (p.selling_price_per_unit ?? 0),
          0,
        )
      : null;

    return {
      totalProducts: products.length,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      totalInventoryValue,
    };
  }, [products]);

  return { ...stats, isLoading };
}
