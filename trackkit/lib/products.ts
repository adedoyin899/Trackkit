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
      (id, user_id, name, category, current_quantity, unit, low_stock_threshold, selling_price_per_unit, cost_per_unit, created_at, updated_at, deleted_at)
     VALUES
      (:id, NULL, :name, :category, :current_quantity, :unit, :low_stock_threshold, :selling_price_per_unit, :cost_per_unit, :created_at, :updated_at, NULL)`,
    {
      ":id": id,
      ":name": input.name,
      ":category": input.category ?? null,
      ":current_quantity": input.current_quantity,
      ":unit": input.unit,
      ":low_stock_threshold": input.low_stock_threshold ?? null,
      ":selling_price_per_unit": input.selling_price_per_unit ?? null,
      ":cost_per_unit": input.cost_per_unit ?? null,
      ":created_at": now,
      ":updated_at": now,
    },
  );

  // Queue product CREATE mutation
  const payload = {
    id,
    user_id: null,
    name: input.name,
    category: input.category ?? null,
    current_quantity: input.current_quantity,
    unit: input.unit,
    low_stock_threshold: input.low_stock_threshold ?? null,
    selling_price_per_unit: input.selling_price_per_unit ?? null,
    cost_per_unit: input.cost_per_unit ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  execute(
    db,
    `INSERT INTO sync_queue (id, table_name, mutation_type, record_id, payload)
     VALUES (:id, 'products', 'CREATE', :record_id, :payload)`,
    {
      ":id": uuidv4(),
      ":record_id": id,
      ":payload": JSON.stringify(payload),
    }
  );

  // Write initial price log to prices table
  const cost = input.cost_per_unit ?? 0;
  const selling = input.selling_price_per_unit ?? 0;
  if (cost > 0 || selling > 0) {
    const priceId = uuidv4();
    const marginPercent = cost > 0 ? Math.round(((selling - cost) / cost) * 100) : null;
    const today = now.substring(0, 10);
    execute(
      db,
      `INSERT INTO prices (id, user_id, product_id, cost_per_unit, selling_price_per_unit, margin_percent, effective_date, created_at, updated_at)
       VALUES (:id, NULL, :product_id, :cost_per_unit, :selling_price_per_unit, :margin_percent, :effective_date, :created_at, :updated_at)`,
      {
        ":id": priceId,
        ":product_id": id,
        ":cost_per_unit": cost,
        ":selling_price_per_unit": selling,
        ":margin_percent": marginPercent,
        ":effective_date": today,
        ":created_at": now,
        ":updated_at": now,
      }
    );

    // Queue price CREATE mutation
    const pricePayload = {
      id: priceId,
      user_id: null,
      product_id: id,
      cost_per_unit: cost,
      selling_price_per_unit: selling,
      margin_percent: marginPercent,
      effective_date: today,
      created_at: now,
      updated_at: now,
    };
    execute(
      db,
      `INSERT INTO sync_queue (id, table_name, mutation_type, record_id, payload)
       VALUES (:id, 'prices', 'CREATE', :record_id, :payload)`,
      {
        ":id": uuidv4(),
        ":record_id": priceId,
        ":payload": JSON.stringify(pricePayload),
      }
    );
  }

  await persist(db);
  return fetchProduct(id) as Product;
}

export async function updateProduct(
  id: string,
  patch: ProductUpdate,
): Promise<Product> {
  const db = getDB();
  const productBefore = fetchProduct(id);
  if (!productBefore) {
    throw new Error(`Product ${id} not found`);
  }

  const fields = Object.keys(patch) as (keyof ProductUpdate)[];

  if (fields.length > 0) {
    const setClause = fields.map((field) => `${field} = :${field}`).join(", ");
    const now = new Date().toISOString();
    const params: Record<string, string | number | null> = {
      ":updated_at": now,
    };
    for (const field of fields) {
      params[`:${field}`] = patch[field] ?? null;
    }

    execute(
      db,
      `UPDATE products SET ${setClause}, updated_at = :updated_at WHERE id = :id`,
      { ...params, ":id": id },
    );

    // Queue product UPDATE mutation
    const updatedProduct = fetchProduct(id) as Product;
    execute(
      db,
      `INSERT INTO sync_queue (id, table_name, mutation_type, record_id, payload)
       VALUES (:id, 'products', 'UPDATE', :record_id, :payload)`,
      {
        ":id": uuidv4(),
        ":record_id": id,
        ":payload": JSON.stringify(updatedProduct),
      }
    );

    // If cost or selling price changes, log a new entry in prices table
    const costChanged = "cost_per_unit" in patch && patch.cost_per_unit !== productBefore.cost_per_unit;
    const priceChanged = "selling_price_per_unit" in patch && patch.selling_price_per_unit !== productBefore.selling_price_per_unit;

    if (costChanged || priceChanged) {
      const cost = patch.cost_per_unit !== undefined ? patch.cost_per_unit : productBefore.cost_per_unit;
      const selling = patch.selling_price_per_unit !== undefined ? patch.selling_price_per_unit : productBefore.selling_price_per_unit;

      const finalCost = cost ?? 0;
      const finalSelling = selling ?? 0;

      if (finalCost > 0 || finalSelling > 0) {
        const priceId = uuidv4();
        const marginPercent = finalCost > 0 ? Math.round(((finalSelling - finalCost) / finalCost) * 100) : null;
        const today = now.substring(0, 10);

        execute(
          db,
          `INSERT INTO prices (id, user_id, product_id, cost_per_unit, selling_price_per_unit, margin_percent, effective_date, created_at, updated_at)
           VALUES (:id, NULL, :product_id, :cost_per_unit, :selling_price_per_unit, :margin_percent, :effective_date, :created_at, :updated_at)`,
          {
            ":id": priceId,
            ":product_id": id,
            ":cost_per_unit": finalCost,
            ":selling_price_per_unit": finalSelling,
            ":margin_percent": marginPercent,
            ":effective_date": today,
            ":created_at": now,
            ":updated_at": now,
          }
        );

        // Queue price CREATE mutation
        const pricePayload = {
          id: priceId,
          user_id: null,
          product_id: id,
          cost_per_unit: finalCost,
          selling_price_per_unit: finalSelling,
          margin_percent: marginPercent,
          effective_date: today,
          created_at: now,
          updated_at: now,
        };
        execute(
          db,
          `INSERT INTO sync_queue (id, table_name, mutation_type, record_id, payload)
           VALUES (:id, 'prices', 'CREATE', :record_id, :payload)`,
          {
            ":id": uuidv4(),
            ":record_id": priceId,
            ":payload": JSON.stringify(pricePayload),
          }
        );
      }
    }

    await persist(db);
  }

  return fetchProduct(id) as Product;
}

export async function softDeleteProduct(id: string): Promise<void> {
  const db = getDB();
  const now = new Date().toISOString();
  execute(
    db,
    `UPDATE products SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id`,
    {
      ":deleted_at": now,
      ":updated_at": now,
      ":id": id,
    },
  );

  // Queue product UPDATE mutation for soft delete sync
  const deletedProduct = fetchProduct(id) as Product;
  execute(
    db,
    `INSERT INTO sync_queue (id, table_name, mutation_type, record_id, payload)
     VALUES (:id, 'products', 'UPDATE', :record_id, :payload)`,
    {
      ":id": uuidv4(),
      ":record_id": id,
      ":payload": JSON.stringify(deletedProduct),
    }
  );

  await persist(db);
}
