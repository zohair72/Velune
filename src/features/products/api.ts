import type { Product as CauldronProduct } from "../../app/components/CauldronContext";
import { getProductImageUrl } from "../../lib/supabase/storage";
import { normalizeProductNotes } from "../../utils/notes";
import { requireSupabase } from "../../utils/supabase";
import { removeProductImage, uploadProductImage } from "../uploads/api";
import type {
  ProductNoteValue,
  ProductRecord,
} from "./types";

export type StorefrontShelfProduct = CauldronProduct & {
  slug: string;
  imagePath: string | null;
  volumeMl: number | null;
  stockQuantity: number | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  notes: ProductNoteValue;
  price: number | string | null;
  stock_quantity: number | null;
  is_active: boolean;
  image_path?: string | null;
  volume_ml: number | null;
  created_at: string;
  updated_at: string;
};

type ProductMutationInput = {
  name: string;
  slug: string;
  shortDescription: string;
  notes: string[];
  price: number;
  stockQuantity: number;
  isActive: boolean;
  volumeMl: number | null;
  imagePath?: string | null;
};

type ProductSaveInput = ProductMutationInput & {
  imageFile?: File | null;
};

const productSelect = `
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

const normalizeInteger = (value: number | null | undefined) =>
  Number(value ?? 0);

export const getProductMutationErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const databaseError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof databaseError.message === "string" ? databaseError.message : "",
      typeof databaseError.details === "string" ? databaseError.details : "",
      typeof databaseError.hint === "string" ? `Hint: ${databaseError.hint}` : "",
      typeof databaseError.code === "string" ? `Code: ${databaseError.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "This product could not be saved right now.";
};

export const slugifyProductName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const mapProductRow = (row: ProductRow): ProductRecord => ({
  id: row.id,
  name: row.name,
  slug: row.slug || row.id,
  shortDescription: row.short_description ?? "",
  notes: normalizeProductNotes(row.notes),
  price: normalizeMoney(row.price),
  stockQuantity: normalizeInteger(row.stock_quantity),
  isActive: row.is_active,
  imagePath: row.image_path ?? null,
  imageUrl: getProductImageUrl(row.image_path),
  volumeMl: row.volume_ml,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapStorefrontProduct = (row: ProductRow): StorefrontShelfProduct => {
  const product = mapProductRow(row);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imagePath: product.imagePath,
    image: product.imageUrl,
    description: product.shortDescription,
    notes: product.notes,
    volumeMl: product.volumeMl,
    stockQuantity: product.stockQuantity,
  };
};

const buildProductPayload = (input: ProductMutationInput) => ({
  name: input.name.trim(),
  slug: input.slug.trim(),
  short_description: input.shortDescription.trim() || null,
  notes: input.notes.join(", "),
  price: input.price,
  stock_quantity: input.stockQuantity,
  is_active: input.isActive,
  image_path:
    input.imagePath === undefined ? undefined : input.imagePath?.trim() || null,
  volume_ml: input.volumeMl,
});

export const fetchPublishedProducts = async (): Promise<StorefrontShelfProduct[]> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProductRow[]).map(mapStorefrontProduct);
};

export const fetchPublishedProductBySlug = async (
  slug: string,
): Promise<StorefrontShelfProduct | null> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapStorefrontProduct(data as ProductRow);
};

export const fetchAdminProducts = async (): Promise<ProductRecord[]> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .order("created_at", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProductRow[]).map(mapProductRow);
};

export const fetchAdminProductById = async (
  productId: string,
): Promise<ProductRecord | null> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProductRow(data as ProductRow);
};

export const createAdminProduct = async (
  input: ProductMutationInput,
): Promise<ProductRecord> => {
  const supabase = requireSupabase();
  const payload = buildProductPayload(input);
  console.info("Velune admin product insert starting.", {
    slug: payload.slug,
    hasImagePath: Boolean(payload.image_path),
    isActive: payload.is_active,
  });
  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select(productSelect)
    .single();

  if (error) {
    console.error("Velune admin product insert failed.", error);
    throw error;
  }

  console.info("Velune admin product insert succeeded.", {
    id: (data as ProductRow).id,
    slug: (data as ProductRow).slug,
  });
  return mapProductRow(data as ProductRow);
};

export const updateAdminProduct = async (
  productId: string,
  input: ProductMutationInput,
): Promise<ProductRecord> => {
  const supabase = requireSupabase();
  const payload = buildProductPayload(input);
  console.info("Velune admin product update starting.", {
    productId,
    slug: payload.slug,
    hasImagePath: Boolean(payload.image_path),
  });
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select(productSelect)
    .single();

  if (error) {
    console.error("Velune admin product update failed.", error);
    throw error;
  }

  console.info("Velune admin product update succeeded.", {
    productId: (data as ProductRow).id,
    slug: (data as ProductRow).slug,
  });
  return mapProductRow(data as ProductRow);
};

export const createAdminProductWithOptionalImage = async (
  input: ProductSaveInput,
): Promise<ProductRecord> => {
  const { imageFile, ...productInput } = input;
  console.info("Velune admin create product flow started.", {
    slug: productInput.slug,
    hasImageFile: Boolean(imageFile),
  });
  const createdProduct = await createAdminProduct({
    ...productInput,
    imagePath: null,
  });

  if (!imageFile) {
    console.info("Velune admin create product finished without image upload.", {
      id: createdProduct.id,
    });
    return createdProduct;
  }

  console.info("Velune admin product image upload starting.", {
    productId: createdProduct.id,
    fileName: imageFile.name,
  });
  const upload = await uploadProductImage({
    productId: createdProduct.id,
    productName: productInput.name,
    file: imageFile,
  });

  console.info("Velune admin product image upload succeeded.", {
    productId: createdProduct.id,
    imagePath: upload.path,
  });

  try {
    return await updateAdminProduct(createdProduct.id, {
      ...productInput,
      imagePath: upload.path,
    });
  } catch (error) {
    console.error(
      "Velune admin product image path update failed after upload; cleaning up image.",
      error,
    );

    try {
      await removeProductImage(upload.path);
    } catch (cleanupError) {
      console.error(
        "Velune admin product image cleanup failed after update error.",
        cleanupError,
      );
    }

    throw error;
  }
};

export const updateAdminProductWithOptionalImage = async (
  productId: string,
  input: ProductSaveInput,
): Promise<ProductRecord> => {
  const { imageFile, ...productInput } = input;
  let nextImagePath = productInput.imagePath;

  if (imageFile) {
    const upload = await uploadProductImage({
      productId,
      productName: productInput.name,
      file: imageFile,
    });

    nextImagePath = upload.path;
  }

  return updateAdminProduct(productId, {
    ...productInput,
    imagePath: nextImagePath,
  });
};
