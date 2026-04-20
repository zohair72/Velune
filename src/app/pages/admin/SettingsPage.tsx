import React, { useEffect, useState } from "react";
import {
  createDefaultStoreSettings,
  fetchStoreSettings,
  mapStoreSettingsToFormValues,
  updateStoreSettings,
} from "../../../features/settings/api";
import type { StoreSettingsFormValues } from "../../../features/settings/types";

export const SettingsPage = () => {
  const [formValues, setFormValues] = useState<StoreSettingsFormValues>(
    mapStoreSettingsToFormValues(createDefaultStoreSettings()),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStoreSettings = async () => {
      setIsLoading(true);
      setError(null);
      setSaveMessage(null);

      try {
        const settings = await fetchStoreSettings();

        if (!isMounted) {
          return;
        }

        setFormValues(
          mapStoreSettingsToFormValues(settings ?? createDefaultStoreSettings()),
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune store settings.", loadError);
        setError("Store settings could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = <TField extends keyof StoreSettingsFormValues>(
    field: TField,
    value: StoreSettingsFormValues[TField],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const nextSettings = await updateStoreSettings(formValues);
      setFormValues(mapStoreSettingsToFormValues(nextSettings));
      setSaveMessage("Store settings saved.");
    } catch (saveError) {
      console.error("Failed to update Velune store settings.", saveError);
      setError("Store settings could not be saved right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          Settings
        </p>
        <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
          Store settings
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
          Keep customer support details and payment instructions up to date for
          checkout and storefront contact touchpoints.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          Loading the Velune store settings...
        </div>
      ) : null}

      {!isLoading ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm"
        >
          <div className="grid gap-8 xl:grid-cols-2">
            <div className="space-y-5">
              <div>
                <h2 className="font-cinzel text-2xl text-[#1A1817]">
                  Brand & Support
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5c5046]">
                  These details appear in customer-facing support areas.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                  Brand Name
                </span>
                <input
                  value={formValues.brandName}
                  onChange={(event) => handleChange("brandName", event.target.value)}
                  className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                  WhatsApp Number
                </span>
                <input
                  value={formValues.whatsappNumber}
                  onChange={(event) =>
                    handleChange("whatsappNumber", event.target.value)
                  }
                  placeholder="923001234567"
                  className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                  Support Email
                </span>
                <input
                  type="email"
                  value={formValues.supportEmail}
                  onChange={(event) =>
                    handleChange("supportEmail", event.target.value)
                  }
                  placeholder="support@velune.com"
                  className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                />
              </label>
            </div>

            <div className="space-y-5">
              <div>
                <h2 className="font-cinzel text-2xl text-[#1A1817]">
                  Payment Method Toggles
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5c5046]">
                  Control which checkout payment methods customers can see.
                </p>
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-[#efe4d2] bg-[#faf6ef] px-5 py-4">
                <div>
                  <p className="font-cinzel text-sm uppercase tracking-[0.16em] text-[#1A1817]">
                    Cash on Delivery
                  </p>
                  <p className="mt-1 text-sm text-[#5c5046]">
                    Show cash on delivery at checkout.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formValues.codEnabled}
                  onChange={(event) => handleChange("codEnabled", event.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-[#efe4d2] bg-[#faf6ef] px-5 py-4">
                <div>
                  <p className="font-cinzel text-sm uppercase tracking-[0.16em] text-[#1A1817]">
                    Manual Payment
                  </p>
                  <p className="mt-1 text-sm text-[#5c5046]">
                    Show bank transfer style payment at checkout.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formValues.manualPaymentEnabled}
                  onChange={(event) =>
                    handleChange("manualPaymentEnabled", event.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>

            <div className="space-y-5 xl:col-span-2">
              <div>
                <h2 className="font-cinzel text-2xl text-[#1A1817]">
                  Manual Payment Details
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5c5046]">
                  These details appear to customers when Manual Payment is selected.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    Manual Payment Title
                  </span>
                  <input
                    value={formValues.manualPaymentTitle}
                    onChange={(event) =>
                      handleChange("manualPaymentTitle", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    Bank Name
                  </span>
                  <input
                    value={formValues.bankName}
                    onChange={(event) => handleChange("bankName", event.target.value)}
                    className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    Account Title
                  </span>
                  <input
                    value={formValues.accountTitle}
                    onChange={(event) =>
                      handleChange("accountTitle", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    Account Number
                  </span>
                  <input
                    value={formValues.accountNumber}
                    onChange={(event) =>
                      handleChange("accountNumber", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    IBAN
                  </span>
                  <input
                    value={formValues.iban}
                    onChange={(event) => handleChange("iban", event.target.value)}
                    className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    Manual Payment Instructions
                  </span>
                  <textarea
                    value={formValues.manualPaymentInstructions}
                    onChange={(event) =>
                      handleChange("manualPaymentInstructions", event.target.value)
                    }
                    className="min-h-32 w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>
          </div>

          {error ? <p className="mt-6 text-sm text-[#9f3c24]">{error}</p> : null}
          {saveMessage ? <p className="mt-6 text-sm text-[#2f5b2d]">{saveMessage}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-8 rounded-xl bg-[#0A3600] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Store Settings"}
          </button>
        </form>
      ) : null}
    </section>
  );
};
