import React from "react";
import { ImageIcon } from "lucide-react";
import type {
  ProductFormErrors,
  ProductFormValues,
} from "../../../features/products/types";

type ProductFormProps = {
  mode: "create" | "edit";
  values: ProductFormValues;
  errors: ProductFormErrors;
  imageFile: File | null;
  imagePreviewUrl: string;
  isSubmitting: boolean;
  submitLabel: string;
  submitError: string | null;
  onChange: <TField extends keyof ProductFormValues>(
    field: TField,
    value: ProductFormValues[TField],
  ) => void;
  onImageChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const fieldLabelClassName =
  "mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]";

const fieldClassName =
  "w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none transition-colors focus:border-[#0A3600]";

export const ProductForm = ({
  mode,
  values,
  errors,
  imageFile,
  imagePreviewUrl,
  isSubmitting,
  submitLabel,
  submitError,
  onChange,
  onImageChange,
  onSubmit,
}: ProductFormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className={fieldLabelClassName}>Product Name</span>
              <input
                className={fieldClassName}
                value={values.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Bare Vanilla"
              />
              {errors.name ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">{errors.name}</span>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className={fieldLabelClassName}>Slug</span>
              <input
                className={fieldClassName}
                value={values.slug}
                onChange={(event) => onChange("slug", event.target.value)}
                placeholder="bare-vanilla"
              />
              <p className="mt-2 text-sm text-[#7a6d62]">
                Used in the product URL. Keep it lowercase and hyphenated.
              </p>
              {errors.slug ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">{errors.slug}</span>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className={fieldLabelClassName}>Short Description</span>
              <textarea
                className={`${fieldClassName} min-h-28 resize-y`}
                value={values.shortDescription}
                onChange={(event) => onChange("shortDescription", event.target.value)}
                placeholder="A velvety vanilla blend warmed with ambered sweetness."
              />
              {errors.shortDescription ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">
                  {errors.shortDescription}
                </span>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className={fieldLabelClassName}>Notes</span>
              <textarea
                className={`${fieldClassName} min-h-24 resize-y`}
                value={values.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder="Vanilla, Amber, Musk"
              />
              <p className="mt-2 text-sm text-[#7a6d62]">
                Separate fragrance notes with commas.
              </p>
              {errors.notes ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">{errors.notes}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={fieldLabelClassName}>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldClassName}
                value={values.price}
                onChange={(event) => onChange("price", event.target.value)}
                placeholder="18.00"
              />
              {errors.price ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">{errors.price}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={fieldLabelClassName}>Stock Quantity</span>
              <input
                type="number"
                min="0"
                step="1"
                className={fieldClassName}
                value={values.stockQuantity}
                onChange={(event) => onChange("stockQuantity", event.target.value)}
                placeholder="12"
              />
              {errors.stockQuantity ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">
                  {errors.stockQuantity}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={fieldLabelClassName}>Volume (ml)</span>
              <input
                type="number"
                min="0"
                step="1"
                className={fieldClassName}
                value={values.volumeMl}
                onChange={(event) => onChange("volumeMl", event.target.value)}
                placeholder="10"
              />
              {errors.volumeMl ? (
                <span className="mt-2 block text-sm text-[#9f3c24]">{errors.volumeMl}</span>
              ) : null}
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[#d8cab5] px-4 py-4">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => onChange("isActive", event.target.checked)}
                className="h-4 w-4"
              />
              <span>
                <span className="block font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817]">
                  Active on Storefront
                </span>
                <span className="mt-1 block text-sm text-[#7a6d62]">
                  {values.isActive
                    ? "This product will appear live on the storefront."
                    : "Keep this product hidden until it is ready."}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#efe4d2] bg-[#faf6ef] p-5">
          <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]">
            Product Image
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#d8cab5] bg-white">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={values.name || "Product preview"}
                className="h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-[#f4efe6] text-[#7a6d62]">
                <div className="text-center">
                  <ImageIcon size={28} className="mx-auto" />
                  <p className="mt-3 font-cinzel text-xs uppercase tracking-[0.18em]">
                    No image selected
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            className="mt-4 block w-full text-sm text-[#7a6d62] file:mr-4 file:rounded-full file:border-0 file:bg-[#0A3600] file:px-4 file:py-2 file:font-cinzel file:text-xs file:uppercase file:tracking-[0.18em] file:text-[#F4EFE6] hover:file:opacity-90"
          />

          <p className="mt-3 text-sm text-[#7a6d62]">
            {imageFile
              ? `Selected upload: ${imageFile.name}`
              : mode === "edit"
                ? "Leave this empty to keep the current image."
                : "Upload a JPG, PNG, or WEBP image up to 5MB."}
          </p>

          {errors.image ? (
            <span className="mt-2 block text-sm text-[#9f3c24]">{errors.image}</span>
          ) : null}
        </div>
      </div>

      {submitError ? (
        <div className="mt-6 rounded-xl border border-[#e6c0b7] bg-[#fbefeb] px-4 py-3 text-sm text-[#9f3c24]">
          {submitError}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#0A3600] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        <p className="text-sm text-[#7a6d62]">
          Saved changes update the live storefront automatically for active products.
        </p>
      </div>
    </form>
  );
};
