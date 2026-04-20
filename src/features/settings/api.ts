import { requireSupabase } from "../../utils/supabase";
import type { StoreSettings, StoreSettingsFormValues } from "./types";

type StoreSettingsRow = {
  id: boolean;
  brand_name: string | null;
  whatsapp_number: string | null;
  support_email: string | null;
  manual_payment_title: string | null;
  manual_payment_instructions: string | null;
  bank_name: string | null;
  account_title: string | null;
  account_number: string | null;
  iban: string | null;
  cod_enabled: boolean | null;
  manual_payment_enabled: boolean | null;
};

const storeSettingsSelect = `
  id,
  brand_name,
  whatsapp_number,
  support_email,
  manual_payment_title,
  manual_payment_instructions,
  bank_name,
  account_title,
  account_number,
  iban,
  cod_enabled,
  manual_payment_enabled
`;

const normalizeText = (value: string | null | undefined) => value?.trim() ?? "";

const mapStoreSettingsRow = (row: StoreSettingsRow): StoreSettings => ({
  brandName: normalizeText(row.brand_name),
  whatsappNumber: normalizeText(row.whatsapp_number),
  supportEmail: normalizeText(row.support_email),
  manualPaymentTitle: normalizeText(row.manual_payment_title),
  manualPaymentInstructions: normalizeText(row.manual_payment_instructions),
  bankName: normalizeText(row.bank_name),
  accountTitle: normalizeText(row.account_title),
  accountNumber: normalizeText(row.account_number),
  iban: normalizeText(row.iban),
  codEnabled: Boolean(row.cod_enabled),
  manualPaymentEnabled: Boolean(row.manual_payment_enabled),
});

const buildStoreSettingsPayload = (input: StoreSettingsFormValues) => ({
  brand_name: input.brandName.trim() || null,
  whatsapp_number: input.whatsappNumber.trim() || null,
  support_email: input.supportEmail.trim() || null,
  manual_payment_title: input.manualPaymentTitle.trim() || null,
  manual_payment_instructions: input.manualPaymentInstructions.trim() || null,
  bank_name: input.bankName.trim() || null,
  account_title: input.accountTitle.trim() || null,
  account_number: input.accountNumber.trim() || null,
  iban: input.iban.trim() || null,
  cod_enabled: input.codEnabled,
  manual_payment_enabled: input.manualPaymentEnabled,
});

export const createDefaultStoreSettings = (): StoreSettings => ({
  brandName: "Velune",
  whatsappNumber: "",
  supportEmail: "",
  manualPaymentTitle: "Manual Payment",
  manualPaymentInstructions: "",
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  codEnabled: true,
  manualPaymentEnabled: true,
});

export const mapStoreSettingsToFormValues = (
  settings: StoreSettings,
): StoreSettingsFormValues => ({
  brandName: settings.brandName,
  whatsappNumber: settings.whatsappNumber,
  supportEmail: settings.supportEmail,
  manualPaymentTitle: settings.manualPaymentTitle,
  manualPaymentInstructions: settings.manualPaymentInstructions,
  bankName: settings.bankName,
  accountTitle: settings.accountTitle,
  accountNumber: settings.accountNumber,
  iban: settings.iban,
  codEnabled: settings.codEnabled,
  manualPaymentEnabled: settings.manualPaymentEnabled,
});

export const fetchStoreSettings = async (): Promise<StoreSettings | null> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("store_settings")
    .select(storeSettingsSelect)
    .eq("id", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapStoreSettingsRow(data as StoreSettingsRow);
};

export const updateStoreSettings = async (
  input: StoreSettingsFormValues,
): Promise<StoreSettings> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("store_settings")
    .update(buildStoreSettingsPayload(input))
    .eq("id", true)
    .select(storeSettingsSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapStoreSettingsRow(data as StoreSettingsRow);
};
