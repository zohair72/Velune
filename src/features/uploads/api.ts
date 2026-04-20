import { requireSupabase } from "../../utils/supabase";

const PAYMENT_PROOFS_BUCKET = "payment-proofs";
const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const allowedPaymentProofTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const allowedProductImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type UploadPaymentProofInput = {
  orderId: string;
  orderNumber: string;
  file: File;
};

type UploadProductImageInput = {
  productId: string;
  productName: string;
  file: File;
};

class PaymentProofAttachmentError extends Error {
  stage: "validation" | "upload" | "order_update";

  constructor(
    message: string,
    stage: "validation" | "upload" | "order_update",
  ) {
    super(message);
    this.name = "PaymentProofAttachmentError";
    this.stage = stage;
  }
}

const normalizeFileName = (fileName: string) =>
  fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 80) || "upload";

const slugifyUploadSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const validatePaymentProofFile = (file: File | null | undefined) => {
  if (!file) {
    return "Please attach a payment proof for Manual Payment.";
  }

  if (!allowedPaymentProofTypes.has(file.type)) {
    return "Upload a JPG, PNG, WEBP, or PDF payment proof.";
  }

  if (file.size > MAX_PAYMENT_PROOF_BYTES) {
    return "Payment proof must be 5MB or smaller.";
  }

  return null;
};

export const validateProductImageFile = (file: File | null | undefined) => {
  if (!file) {
    return "Please choose a product image to upload.";
  }

  if (!allowedProductImageTypes.has(file.type)) {
    return "Upload a JPG, PNG, or WEBP product image.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return "Product image must be 5MB or smaller.";
  }

  return null;
};

export const uploadPaymentProofForOrder = async ({
  orderId,
  orderNumber,
  file,
}: UploadPaymentProofInput) => {
  const validationError = validatePaymentProofFile(file);

  if (validationError) {
    throw new PaymentProofAttachmentError(validationError, "validation");
  }

  const supabase = requireSupabase();
  const safeFileName = normalizeFileName(file.name);
  const storagePath = `${orderNumber}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new PaymentProofAttachmentError(
      `Payment proof upload failed: ${uploadError.message}`,
      "upload",
    );
  }

  const { data, error: updateError } = await supabase.rpc(
    "attach_order_payment_proof",
    {
      p_order_id: orderId,
      p_order_number: orderNumber,
      p_payment_proof_path: storagePath,
    },
  );

  if (updateError) {
    await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([storagePath]);
    throw new PaymentProofAttachmentError(
      `Payment proof path update failed: ${updateError.message}`,
      "order_update",
    );
  }

  if (data === false) {
    await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([storagePath]);
    throw new PaymentProofAttachmentError(
      "Payment proof path update failed: the order could not be matched for attachment.",
      "order_update",
    );
  }

  return { path: storagePath };
};

export const uploadProductImage = async ({
  productId,
  productName,
  file,
}: UploadProductImageInput) => {
  const validationError = validateProductImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = requireSupabase();
  const safeFileName = normalizeFileName(file.name);
  const productSlug = slugifyUploadSegment(productName) || productId;
  const storagePath = `${productSlug}/${productId}-${Date.now()}-${safeFileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  return { path: storagePath };
};

export const removeProductImage = async (path: string) => {
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return;
  }

  const supabase = requireSupabase();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([normalizedPath]);

  if (error) {
    throw error;
  }
};
