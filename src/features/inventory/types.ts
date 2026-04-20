import type { ProductRecord } from "../products/types";

export type InventoryProductRecord = ProductRecord;

export type InventoryStatusFilter = "all" | "active" | "inactive";

export type InventoryStockFilter = "all" | "low_stock" | "out_of_stock";

export type InventoryFilters = {
  query: string;
  status: InventoryStatusFilter;
  stockState: InventoryStockFilter;
};
