import { v4 as uuidv4 } from "uuid";
import { getDB, persist } from "./sqlite-init";
import { execute, queryAll } from "./sql-helpers";
import { fetchProduct } from "./products";
import type { Product, Transaction, TransactionType } from "./types";

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
    `INSERT INTO transactions (id, product_id, transaction_type, quantity, notes, created_at)
     VALUES (:id, :product_id, :transaction_type, :quantity, :notes, :created_at)`,
    {
      ":id": uuidv4(),
      ":product_id": productId,
      ":transaction_type": type,
      ":quantity": quantity,
      ":notes": notes ?? null,
      ":created_at": now,
    },
  );

  await persist(db);
  return fetchProduct(productId) as Product;
}
