"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTransactions, logTransaction } from "@/lib/transactions";
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
    }: {
      type: TransactionType;
      quantity: number;
      notes?: string;
    }) => {
      if (!productId) {
        throw new Error("productId is required to log a transaction");
      }
      return logTransaction(productId, type, quantity, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: !ready || transactionsQuery.isLoading,
    logTransaction: logMutation.mutateAsync,
    isLogging: logMutation.isPending,
  };
}
