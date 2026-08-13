import { v4 as uuidv4 } from "uuid";
import { getDB, persist } from "./sqlite-init";
import { execute, queryAll, queryOne } from "./sql-helpers";
import type { NewProduct, Product, ProductUpdate } from "./types";

export function fetchProducts(): Product[] {
  const db = getDB();
  return queryAll<Product>(
    db,
    `SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC`,
  );
}

export function fetchProduct(id: string): Product | null {
  const db = getDB();
  return queryOne<Product>(db, `SELECT * FROM products WHERE id = :id`, {
    ":id": id,
  });
}

export async function addProduct(input: NewProduct): Promise<Product> {
  const db = getDB();
  const id = uuidv4();
  const now = new Date().toISOString();

  execute(
    db,
    `INSERT INTO products
      (id, user_id, name, category, current_quantity, unit, low_stock_threshold, selling_price_per_unit, created_at, updated_at, deleted_at)
     VALUES
      (:id, NULL, :name, :category, :current_quantity, :unit, :low_stock_threshold, :selling_price_per_unit, :created_at, :updated_at, NULL)`,
    {
      ":id": id,
      ":name": input.name,
      ":category": input.category ?? null,
      ":current_quantity": input.current_quantity,
      ":unit": input.unit,
      ":low_stock_threshold": input.low_stock_threshold ?? null,
      ":selling_price_per_unit": input.selling_price_per_unit ?? null,
      ":created_at": now,
      ":updated_at": now,
    },
  );

  await persist(db);
  return fetchProduct(id) as Product;
}

export async function updateProduct(
  id: string,
  patch: ProductUpdate,
): Promise<Product> {
  const db = getDB();
  const fields = Object.keys(patch) as (keyof ProductUpdate)[];

  if (fields.length > 0) {
    const setClause = fields.map((field) => `${field} = :${field}`).join(", ");
    const params: Record<string, string | number | null> = {
      ":updated_at": new Date().toISOString(),
    };
    for (const field of fields) {
      params[`:${field}`] = patch[field] ?? null;
    }

    execute(
      db,
      `UPDATE products SET ${setClause}, updated_at = :updated_at WHERE id = :id`,
      { ...params, ":id": id },
    );
    await persist(db);
  }

  return fetchProduct(id) as Product;
}

export async function softDeleteProduct(id: string): Promise<void> {
  const db = getDB();
  execute(
    db,
    `UPDATE products SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id`,
    {
      ":deleted_at": new Date().toISOString(),
      ":updated_at": new Date().toISOString(),
      ":id": id,
    },
  );
  await persist(db);
}
