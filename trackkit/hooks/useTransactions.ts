"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTransactions,
  logTransaction,
  fetchRestockHistory,
  fetchSupplierStats,
  fetchAllSupplierNames,
  type FetchRestockHistoryOptions,
} from "@/lib/transactions";
import { useDatabaseStatus } from "@/lib/db-context";
import { PRODUCTS_QUERY_KEY } from "./useLocalInventory";
import type { TransactionType } from "@/lib/types";

/** Reads and logs sale/restock transactions for a product (or all products). */
export function useTransactions(productId?: string) {
  const { ready } = useDatabaseStatus();
  const queryClient = useQueryClient();
  const queryKey = ["transactions", productId ?? "all"] as const;

  const transactionsQuery = useQuery({
    queryKey,
    queryFn: () => fetchTransactions(productId),
    enabled: ready,
  });

  const logMutation = useMutation({
    mutationFn: ({
      type,
      quantity,
      notes,
      supplier,
      costPerUnit,
    }: {
      type: TransactionType;
      quantity: number;
      notes?: string;
      supplier?: string;
      costPerUnit?: number;
    }) => {
      if (!productId) {
        throw new Error("productId is required to log a transaction");
      }
      return logTransaction(productId, type, quantity, notes, supplier, costPerUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["purchase-history"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: !ready || transactionsQuery.isLoading,
    logTransaction: logMutation.mutateAsync,
    isLogging: logMutation.isPending,
  };
}

/** Hook for purchase history queries with filters. */
export function usePurchaseHistory(opts: FetchRestockHistoryOptions = {}) {
  const { ready } = useDatabaseStatus();
  return useQuery({
    queryKey: ["purchase-history", opts],
    queryFn: () => fetchRestockHistory(opts),
    enabled: ready,
  });
}

/** Hook for supplier stats for a given product. */
export function useSupplierStats(productId: string | null) {
  const { ready } = useDatabaseStatus();
  return useQuery({
    queryKey: ["supplier-stats", productId],
    queryFn: () => fetchSupplierStats(productId!),
    enabled: ready && !!productId,
  });
}

/** Hook for all supplier names (for autocomplete). */
export function useAllSupplierNames() {
  const { ready } = useDatabaseStatus();
  return useQuery({
    queryKey: ["supplier-names"],
    queryFn: () => fetchAllSupplierNames(),
    enabled: ready,
  });
}
