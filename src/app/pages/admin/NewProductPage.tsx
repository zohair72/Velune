import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ProductForm } from "../../components/admin/ProductForm";
import {
  createAdminProductWithOptionalImage,
  getProductMutationErrorMessage,
  slugifyProductName,
} from "../../../features/products/api";
import {
  createEmptyProductFormValues,
  toProductMutationInput,
  validateProductFormValues,
} from "../../../features/products/form";
import type {
  ProductFormErrors,
  ProductFormValues,
} from "../../../features/products/types";

export const NewProductPage = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState<ProductFormValues>(createEmptyProductFormValues);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleChange = <TField extends keyof ProductFormValues>(
    field: TField,
    value: ProductFormValues[TField],
  ) => {
    setValues((prev) => {
      const nextValues = { ...prev, [field]: value };

      if (field === "name" && !prev.slug.trim()) {
        nextValues.slug = slugifyProductName(String(value));
      }

      return nextValues;
    });

    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateProductFormValues(values, imageFile, "create");
    console.info("Velune admin new product submit attempted.", {
      slug: values.slug.trim(),
      hasImageFile: Boolean(imageFile),
      validationErrors,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("Please complete the highlighted product details.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.info("Velune admin new product submit starting.", {
        name: values.name.trim(),
        slug: values.slug.trim(),
        hasImageFile: Boolean(imageFile),
      });

      const createdProduct = await createAdminProductWithOptionalImage({
        ...toProductMutationInput(values, null),
        imageFile,
      });

      console.info("Velune admin new product submit succeeded.", {
        id: createdProduct.id,
        slug: createdProduct.slug,
      });
      navigate(`/admin/products/${createdProduct.id}/edit`, {
        replace: true,
      });
    } catch (error) {
      console.error("Failed to create a Velune product.", error);
      setSubmitError(getProductMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
              New Product
            </p>
            <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
              Create a new fragrance
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
              Add the fragrance details, set stock and pricing, and upload the
              product image used by the storefront.
            </p>
          </div>

          <Link
            to="/admin/products"
            className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-3 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
          >
            Back to Products
          </Link>
        </div>
      </div>

      <ProductForm
        mode="create"
        values={values}
        errors={errors}
        imageFile={imageFile}
        imagePreviewUrl={imagePreviewUrl}
        isSubmitting={isSubmitting}
        submitLabel="Create Product"
        submitError={submitError}
        onChange={handleChange}
        onImageChange={handleImageChange}
        onSubmit={handleSubmit}
      />
    </section>
  );
};
