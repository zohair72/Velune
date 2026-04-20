import type { ProductRecord, ProductFormErrors, ProductFormValues } from "./types";
import { slugifyProductName } from "./api";
import { normalizeProductNotesValue } from "../../utils/notes";
import { validateProductImageFile } from "../uploads/api";

export const createEmptyProductFormValues = (): ProductFormValues => ({
  name: "",
  slug: "",
  shortDescription: "",
  notes: "",
  price: "",
  stockQuantity: "",
  isActive: true,
  volumeMl: "10",
});

export const mapProductToFormValues = (product: ProductRecord): ProductFormValues => ({
  name: product.name,
  slug: product.slug,
  shortDescription: product.shortDescription,
  notes: product.notes.join(", "),
  price: String(product.price),
  stockQuantity: String(product.stockQuantity),
  isActive: product.isActive,
  volumeMl: product.volumeMl === null ? "" : String(product.volumeMl),
});

export const normalizeProductNotesInput = (value: string) =>
  normalizeProductNotesValue(value);

export const validateProductFormValues = (
  values: ProductFormValues,
  imageFile: File | null,
  mode: "create" | "edit",
): ProductFormErrors => {
  const errors: ProductFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter a product name.";
  }

  if (!values.slug.trim()) {
    errors.slug = "Enter a product slug.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  }

  if (!values.shortDescription.trim()) {
    errors.shortDescription = "Enter a short description.";
  }

  if (normalizeProductNotesInput(values.notes).length === 0) {
    errors.notes = "Enter at least one fragrance note.";
  }

  const price = Number(values.price);
  if (!values.price.trim()) {
    errors.price = "Enter a price.";
  } else if (Number.isNaN(price) || price < 0) {
    errors.price = "Price must be zero or greater.";
  }

  const stockQuantity = Number(values.stockQuantity);
  if (!values.stockQuantity.trim()) {
    errors.stockQuantity = "Enter a stock quantity.";
  } else if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    errors.stockQuantity = "Stock quantity must be a whole number zero or above.";
  }

  if (values.volumeMl.trim()) {
    const volume = Number(values.volumeMl);

    if (!Number.isInteger(volume) || volume < 0) {
      errors.volumeMl = "Volume must be a whole number zero or above.";
    }
  }

  if (mode === "create" && imageFile) {
    const imageError = validateProductImageFile(imageFile);

    if (imageError) {
      errors.image = imageError;
    }
  }

  if (mode === "edit" && imageFile) {
    const imageError = validateProductImageFile(imageFile);

    if (imageError) {
      errors.image = imageError;
    }
  }

  return errors;
};

export const toProductMutationInput = (
  values: ProductFormValues,
  currentImagePath: string | null,
) => ({
  name: values.name.trim(),
  slug: values.slug.trim() || slugifyProductName(values.name),
  shortDescription: values.shortDescription.trim(),
  notes: normalizeProductNotesInput(values.notes),
  price: Number(values.price),
  stockQuantity: Number(values.stockQuantity),
  isActive: values.isActive,
  volumeMl: values.volumeMl.trim() ? Number(values.volumeMl) : null,
  imagePath: currentImagePath,
});
