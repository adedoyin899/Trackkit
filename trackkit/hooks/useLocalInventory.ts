"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addProduct, fetchProducts, softDeleteProduct, updateProduct } from "@/lib/products";
import { useDatabaseStatus } from "@/lib/db-context";
import type { NewProduct, ProductUpdate } from "@/lib/types";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

/** CRUD access to the local SQLite product catalog. Offline-only, no network calls. */
export function useLocalInventory() {
  const { ready } = useDatabaseStatus();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchProducts,
    enabled: ready,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });

  const addMutation = useMutation({
    mutationFn: (input: NewProduct) => addProduct(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProductUpdate }) =>
      updateProduct(id, patch),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteProduct(id),
    onSuccess: invalidate,
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: !ready || productsQuery.isLoading,
    error: productsQuery.error,
    addProduct: addMutation.mutateAsync,
    updateProduct: (id: string, patch: ProductUpdate) =>
      updateMutation.mutateAsync({ id, patch }),
    deleteProduct: deleteMutation.mutateAsync,
    isMutating:
      addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
