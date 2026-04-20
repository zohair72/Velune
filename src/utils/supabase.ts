import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ??
  "";

export const hasSupabaseBrowserConfig = Boolean(supabaseUrl && supabaseKey);

export const supabaseConfigError = hasSupabaseBrowserConfig
  ? null
  : "Missing Supabase browser env vars. Set VITE_SUPABASE_URL and " +
    "VITE_SUPABASE_PUBLISHABLE_KEY in .env.local. During transition, " +
    "VITE_SUPABASE_ANON_KEY is also accepted.";

export const supabase = hasSupabaseBrowserConfig
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const requireSupabase = () => {
  if (!supabase || supabaseConfigError) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
};
