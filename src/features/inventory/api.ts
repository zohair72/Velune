import { getProductImageUrl } from "../../lib/supabase/storage";
import { normalizeProductNotes } from "../../utils/notes";
import { requireSupabase } from "../../utils/supabase";
import type { ProductNoteValue } from "../products/types";
import type {
  InventoryFilters,
  InventoryProductRecord,
} from "./types";

type InventoryProductRow = {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  notes: ProductNoteValue;
  price: number | string | null;
  stock_quantity: number | null;
  is_active: boolean;
  image_path: string | null;
  volume_ml: number | null;
  created_at: string;
  updated_at: string;
};

const inventoryProductSelect = `
  id,
  name,
  slug,
  short_description,
  notes,
  price,
  stock_quantity,
  is_active,
  image_path,
  volume_ml,
  created_at,
  updated_at
`;

const normalizeMoney = (value: number | string | null | undefined) =>
  Number(value ?? 0);

const normalizeStockQuantity = (value: number | null | undefined) =>
  Math.max(0, Math.trunc(Number(value ?? 0)));

const mapInventoryProductRow = (
  row: InventoryProductRow,
): InventoryProductRecord => ({
  id: row.id,
  name: row.name,
  slug: row.slug || row.id,
  shortDescription: row.short_description ?? "",
  notes: normalizeProductNotes(row.notes),
  price: normalizeMoney(row.price),
  stockQuantity: normalizeStockQuantity(row.stock_quantity),
  isActive: row.is_active,
  imagePath: row.image_path ?? null,
  imageUrl: getProductImageUrl(row.image_path),
  volumeMl: row.volume_ml,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const isLowStockQuantity = (stockQuantity: number) => stockQuantity <= 5;

export const isOutOfStockQuantity = (stockQuantity: number) => stockQuantity <= 0;

export const fetchInventoryProducts = async (): Promise<InventoryProductRecord[]> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(inventoryProductSelect)
    .order("stock_quantity", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as InventoryProductRow[]).map(mapInventoryProductRow);
};

export const updateInventoryProductStock = async (
  productId: string,
  stockQuantity: number,
): Promise<InventoryProductRecord> => {
  const nextStockQuantity = Math.trunc(stockQuantity);

  if (!Number.isFinite(nextStockQuantity) || nextStockQuantity < 0) {
    throw new Error("Stock quantity must be zero or greater.");
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .update({ stock_quantity: nextStockQuantity })
    .eq("id", productId)
    .select(inventoryProductSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapInventoryProductRow(data as InventoryProductRow);
};

export const filterInventoryProducts = (
  products: InventoryProductRecord[],
  filters: InventoryFilters,
) => {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.slug.toLowerCase().includes(normalizedQuery);

    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" ? product.isActive : !product.isActive);

    const matchesStockState =
      filters.stockState === "all" ||
      (filters.stockState === "low_stock"
        ? isLowStockQuantity(product.stockQuantity)
        : isOutOfStockQuantity(product.stockQuantity));

    return matchesQuery && matchesStatus && matchesStockState;
  });
};
