import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ProductForm } from "../../components/admin/ProductForm";
import {
  fetchAdminProductById,
  slugifyProductName,
  updateAdminProductWithOptionalImage,
} from "../../../features/products/api";
import {
  mapProductToFormValues,
  toProductMutationInput,
  validateProductFormValues,
} from "../../../features/products/form";
import type {
  ProductFormErrors,
  ProductFormValues,
} from "../../../features/products/types";

const emptyFormValues: ProductFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  notes: "",
  price: "",
  stockQuantity: "",
  isActive: false,
  volumeMl: "",
};

export const EditProductPage = () => {
  const { id } = useParams();
  const [values, setValues] = useState<ProductFormValues>(emptyFormValues);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadedPreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (uploadedPreviewUrl) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }
    };
  }, [uploadedPreviewUrl]);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!id) {
        setSubmitError("Product ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSubmitError(null);
      setSaveMessage(null);

      try {
        const product = await fetchAdminProductById(id);

        if (!isMounted) {
          return;
        }

        if (!product) {
          setSubmitError("This product could not be found.");
          setIsLoading(false);
          return;
        }

        setValues(mapProductToFormValues(product));
        setCurrentImagePath(product.imagePath);
        setCurrentImageUrl(product.imageUrl);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load a Velune product for editing.", error);
        setSubmitError("This product could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const imagePreviewUrl = uploadedPreviewUrl || currentImageUrl;

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
    setSaveMessage(null);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: undefined }));
    setSubmitError(null);
    setSaveMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      setSubmitError("Product ID is missing.");
      return;
    }

    const validationErrors = validateProductFormValues(values, imageFile, "edit");
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSaveMessage(null);

    try {
      const updatedProduct = await updateAdminProductWithOptionalImage(id, {
        ...toProductMutationInput(values, currentImagePath),
        imageFile,
      });

      setValues(mapProductToFormValues(updatedProduct));
      setCurrentImagePath(updatedProduct.imagePath);
      setCurrentImageUrl(updatedProduct.imageUrl);
      setImageFile(null);
      setSaveMessage("Product changes saved.");
    } catch (error) {
      console.error("Failed to save Velune product changes.", error);
      setSubmitError(
        "This product could not be updated right now. Check the slug and try again.",
      );
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
              Edit Product
            </p>
            <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
              {isLoading ? "Loading fragrance..." : values.name || "Update fragrance"}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
              Update the storefront details, image, pricing, stock, and active state
              for this fragrance.
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

      {isLoading ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          Loading this product record...
        </div>
      ) : null}

      {!isLoading && submitError && !values.name ? (
        <div className="rounded-[2rem] border border-[#e6c0b7] bg-white px-6 py-12 text-center text-[#9f3c24] shadow-sm">
          {submitError}
        </div>
      ) : null}

      {!isLoading && (values.name || currentImageUrl || submitError) ? (
        <div className="space-y-4">
          {saveMessage ? (
            <div className="rounded-xl border border-[#b8d3b6] bg-[#edf7ec] px-4 py-3 text-sm text-[#2f5b2d]">
              {saveMessage}
            </div>
          ) : null}

          <ProductForm
            mode="edit"
            values={values}
            errors={errors}
            imageFile={imageFile}
            imagePreviewUrl={imagePreviewUrl}
            isSubmitting={isSubmitting}
            submitLabel="Save Product"
            submitError={values.name ? submitError : null}
            onChange={handleChange}
            onImageChange={handleImageChange}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </section>
  );
};
