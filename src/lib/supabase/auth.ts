import type { AuthError } from "@supabase/supabase-js";
import type { AdminUser } from "../../types/admin";
import {
  hasSupabaseBrowserConfig,
  requireSupabase,
  supabaseConfigError,
} from "../../utils/supabase";

type AdminUserRow = {
  email: string;
  is_active: boolean;
};

export const normalizeAdminEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() ?? "";

export const isSupabaseAuthReady = () => hasSupabaseBrowserConfig;

export const getSupabaseAuthSetupMessage = () =>
  supabaseConfigError ??
  "Missing Supabase browser env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.";

export const getSupabaseAuthErrorMessage = (error: AuthError | Error | string) => {
  const message = typeof error === "string" ? error : error.message;

  if (!message) {
    return "Unable to continue with Supabase Auth right now.";
  }

  if (/invalid login credentials/i.test(message)) {
    return "The email or password is not correct.";
  }

  if (/email not confirmed/i.test(message)) {
    return "This Supabase account needs email confirmation before it can enter admin.";
  }

  return message;
};

export const fetchApprovedAdminUser = async (
  email: string,
): Promise<AdminUser | null> => {
  const normalizedEmail = normalizeAdminEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .select("email, is_active")
    .eq("is_active", true)
    .ilike("email", normalizedEmail);

  if (error) {
    throw error;
  }

  const approvedRow =
    ((data ?? []) as AdminUserRow[]).find(
      (candidate) => normalizeAdminEmail(candidate.email) === normalizedEmail,
    ) ?? null;

  if (!approvedRow) {
    return null;
  }

  return {
    email: approvedRow.email,
    isActive: approvedRow.is_active,
  };
};
