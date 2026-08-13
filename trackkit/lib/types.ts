export type ProductCategory =
  | "FMCG"
  | "Dairy"
  | "Sugar/Flour"
  | "Spices"
  | "Oil"
  | "Custom";

export type ProductUnit =
  | "Carton"
  | "Tin"
  | "Bag"
  | "Box"
  | "Crate"
  | (string & {});

export interface Product {
  id: string;
  user_id: string | null;
  name: string;
  category: string | null;
  current_quantity: number;
  unit: string;
  low_stock_threshold: number | null;
  selling_price_per_unit: number | null;
  cost_per_unit: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type NewProduct = Pick<
  Product,
  "name" | "unit" | "current_quantity"
> &
  Partial<
    Pick<
      Product,
      "category" | "low_stock_threshold" | "selling_price_per_unit" | "cost_per_unit"
    >
  >;

export type ProductUpdate = Partial<
  Pick<
    Product,
    | "name"
    | "category"
    | "current_quantity"
    | "unit"
    | "low_stock_threshold"
    | "selling_price_per_unit"
    | "cost_per_unit"
  >
>;

export type TransactionType = "sale" | "restock";

export interface Transaction {
  id: string;
  product_id: string;
  transaction_type: TransactionType;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  lowStockItems: Product[];
  totalInventoryValue: number | null;
}
