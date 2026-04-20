import React, { useEffect, useState } from "react";
import { createDefaultStoreSettings, fetchStoreSettings } from "../../../features/settings/api";
import type { StoreSettings } from "../../../features/settings/types";

export const ContactPage = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStoreSettings = async () => {
      try {
        const settings = await fetchStoreSettings();

        if (!isMounted) {
          return;
        }

        setStoreSettings(settings ?? createDefaultStoreSettings());
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune contact settings.", error);
        setStoreSettings(createDefaultStoreSettings());
      }
    };

    void loadStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const whatsappNumber = storeSettings?.whatsappNumber.trim() ?? "";
  const supportEmail = storeSettings?.supportEmail.trim() ?? "";
  const brandName = storeSettings?.brandName.trim() || "Velune";
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined;

  return (
    <div className="min-h-[80vh] bg-[#1A1817] px-6 py-20 text-[#F4EFE6]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#2A2624] bg-[#121110] p-10">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
          Contact
        </p>
        <h1 className="mt-4 font-cinzel text-4xl">Send word to the apothecary</h1>
        <p className="mt-6 font-lora text-[#A39E98]">
          Reach {brandName} through the live support channels below whenever you
          need help with an order or payment question.
        </p>
        {supportEmail ? (
          <p className="mt-6 font-lora text-[#A39E98]">
            Support email:{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="text-[#C19A5B] transition-colors hover:text-[#F4EFE6]"
            >
              {supportEmail}
            </a>
          </p>
        ) : null}
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex border border-[#C19A5B] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B] transition-colors hover:bg-[#C19A5B] hover:text-[#1A1817]"
          >
            Chat on WhatsApp
          </a>
        ) : null}
        {!supportEmail && !whatsappLink ? (
          <p className="mt-6 font-lora text-[#A39E98]">
            Live support details will appear here once they are added in store
            settings.
          </p>
        ) : null}
      </div>
    </div>
  );
};
