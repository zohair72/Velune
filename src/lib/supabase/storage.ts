import { requireSupabase } from "../../utils/supabase";

export const getProductImageUrl = (imagePath: string | null | undefined) => {
  const normalizedPath = imagePath?.trim() ?? "";

  if (!normalizedPath) {
    return "";
  }

  const supabase = requireSupabase();

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(normalizedPath);

  return data.publicUrl;
};
