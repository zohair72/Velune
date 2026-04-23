import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MoveLeft, Sparkles, Upload } from "lucide-react";
import { useCauldron } from "../../components/CauldronContext";
import { SafeImage } from "../../components/ui/SafeImage";
import { formatRupees } from "../../../utils/currency";
import {
  OrderSubmissionError,
  submitOrder,
  type CheckoutPaymentMethod,
} from "../../../features/orders/api";
import {
  uploadPaymentProofForOrder,
  validatePaymentProofFile,
} from "../../../features/uploads/api";
import {
  createDefaultStoreSettings,
  fetchStoreSettings,
} from "../../../features/settings/api";
import type { StoreSettings } from "../../../features/settings/types";
import {
  normalizePakistanPhoneNumber,
  pakistanPhoneValidationMessage,
} from "../../../utils/phone";
import { saveOrderTrackingDetails } from "../../../utils/orderTracking";

type CheckoutFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: CheckoutPaymentMethod;
};

type CheckoutErrors = Partial<
  Record<keyof CheckoutFormState | "paymentProof", string>
>;

type ConfirmationState = {
  customerName: string;
  paymentMethod: CheckoutPaymentMethod;
  paymentStatus: string;
  orderStatus: string;
  paymentProofMessage?: string;
};

const initialFormState: CheckoutFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  paymentMethod: "cod",
};

const validateCheckoutForm = (
  values: CheckoutFormState,
  paymentProofFile: File | null,
  availablePaymentMethods: CheckoutPaymentMethod[],
): CheckoutErrors => {
  const errors: CheckoutErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Please enter the customer's full name.";
  }

  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = "Please enter a phone number.";
  } else if (!normalizePakistanPhoneNumber(values.phoneNumber)) {
    errors.phoneNumber = pakistanPhoneValidationMessage;
  }

  if (!values.email.trim()) {
    errors.email = "Please enter an email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.address.trim()) {
    errors.address = "Please enter a delivery address.";
  }

  if (!values.city.trim()) {
    errors.city = "Please enter a city.";
  }

  if (availablePaymentMethods.length === 0) {
    errors.paymentMethod = "No payment methods are currently available.";
  } else if (!values.paymentMethod || !availablePaymentMethods.includes(values.paymentMethod)) {
    errors.paymentMethod = "Please choose a payment method.";
  }

  if (values.paymentMethod === "manual_payment") {
    const fileError = validatePaymentProofFile(paymentProofFile);

    if (fileError) {
      errors.paymentProof = fileError;
    }
  }

  return errors;
};

const fieldClassName =
  "w-full rounded-2xl border border-[#2A2624] bg-[#1A1817] px-4 py-3 text-[#F4EFE6] outline-none transition-colors placeholder:text-[#6f655c] focus:border-[#C19A5B]";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getManualPaymentFallbackMessage = (settings: StoreSettings | null) => {
  if (!settings) {
    return "Manual payment details are loading. If anything looks incomplete, place the order and use the support details below for confirmation.";
  }

  if (settings.manualPaymentInstructions.trim()) {
    return settings.manualPaymentInstructions;
  }

  return "Transfer the total using the account details below, then attach your receipt so the Velune team can confirm the payment.";
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCauldron } = useCauldron();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CheckoutFormState>(initialFormState);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCartEmpty = items.length === 0;
  const availablePaymentMethods = useMemo(() => {
    if (!storeSettings) {
      return [] as CheckoutPaymentMethod[];
    }

    const methods: CheckoutPaymentMethod[] = [];

    if (storeSettings.codEnabled) {
      methods.push("cod");
    }

    if (storeSettings.manualPaymentEnabled) {
      methods.push("manual_payment");
    }

    return methods;
  }, [storeSettings]);
  const isManualPayment =
    formValues.paymentMethod === "manual_payment" &&
    availablePaymentMethods.includes("manual_payment");

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  useEffect(() => {
    let isMounted = true;

    const loadStoreSettings = async () => {
      setIsSettingsLoading(true);
      setSettingsError(null);

      try {
        const settings = await fetchStoreSettings();

        if (!isMounted) {
          return;
        }

        setStoreSettings(settings ?? createDefaultStoreSettings());
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune checkout store settings.", loadError);
        setStoreSettings(createDefaultStoreSettings());
        setSettingsError(
          "Live store settings could not be loaded. Default payment options are being used for now.",
        );
      } finally {
        if (isMounted) {
          setIsSettingsLoading(false);
        }
      }
    };

    void loadStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (availablePaymentMethods.length === 0) {
      return;
    }

    setFormValues((prev) => {
      if (availablePaymentMethods.includes(prev.paymentMethod)) {
        return prev;
      }

      return {
        ...prev,
        paymentMethod: availablePaymentMethods[0],
      };
    });
  }, [availablePaymentMethods]);

  const handleFieldChange = <TField extends keyof CheckoutFormState>(
    field: TField,
    value: CheckoutFormState[TField],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(field === "paymentMethod" ? { paymentProof: undefined } : {}),
    }));
    setSubmitError(null);
  };

  const handlePaymentProofChange = (file: File | null) => {
    setPaymentProofFile(file);
    const paymentProofError = validatePaymentProofFile(file);

    setErrors((prev) => ({ ...prev, paymentProof: paymentProofError ?? undefined }));
    setSubmitError(paymentProofError);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateCheckoutForm(
      formValues,
      paymentProofFile,
      availablePaymentMethods,
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError(
        validationErrors.paymentProof ??
          "Please complete the highlighted checkout details.",
      );
      return;
    }

    if (isCartEmpty) {
      setSubmitError("Add a fragrance to your Cauldron before placing an order.");
      return;
    }

    if (isSettingsLoading || !storeSettings) {
      setSubmitError("Checkout payment methods are unavailable right now.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const createdOrder = await submitOrder({
        customer: formValues,
        items,
        subtotal,
      });

      let paymentProofMessage: string | undefined;

      if (isManualPayment && paymentProofFile) {
        try {
          await uploadPaymentProofForOrder({
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            file: paymentProofFile,
          });

          paymentProofMessage =
            "Your payment proof was attached to this order and is ready for review.";
        } catch (uploadError) {
          console.error(
            "Velune order was created, but the payment proof upload failed.",
            uploadError,
          );
          const uploadErrorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "The payment proof could not be attached after order creation.";
          paymentProofMessage =
            `Your order was placed, but we could not attach the payment proof. ${uploadErrorMessage}`;
        }
      }

      clearCauldron();
      saveOrderTrackingDetails({
        orderNumber: createdOrder.orderNumber,
        phoneNumber:
          normalizePakistanPhoneNumber(formValues.phoneNumber) ??
          formValues.phoneNumber.trim(),
      });

      navigate(`/order-confirmation/${createdOrder.orderNumber}`, {
        state: {
          customerName: formValues.fullName.trim(),
          paymentMethod: formValues.paymentMethod,
          paymentStatus: createdOrder.paymentStatus,
          orderStatus: createdOrder.orderStatus,
          paymentProofMessage,
        } satisfies ConfirmationState,
      });
    } catch (submissionError) {
      console.error("Failed to create the Velune order in Supabase.", submissionError);
      if (
        submissionError instanceof OrderSubmissionError &&
        submissionError.reason === "stock"
      ) {
        setSubmitError(
          submissionError.message ||
            "One or more brews no longer have enough stock. Your Cauldron is still intact, so please adjust the quantities and try again.",
        );
      } else {
        setSubmitError(
          submissionError instanceof OrderSubmissionError
            ? submissionError.message
            : submissionError instanceof Error
              ? submissionError.message
              : "We could not place your order just now. Please review the details and try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#1A1817] px-6 py-20 text-[#F4EFE6]">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/cauldron"
          className="mb-10 inline-flex items-center gap-2 font-cinzel text-sm uppercase tracking-[0.2em] text-[#A39E98] transition-colors hover:text-[#C19A5B]"
        >
          <MoveLeft size={16} /> Return to Cauldron
        </Link>

        <div className="mb-12">
          <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
            Checkout
          </p>
          <h1 className="mt-4 font-cinzel text-4xl md:text-5xl">
            Complete your order details
          </h1>
          <p className="mt-4 max-w-2xl font-lora text-lg leading-relaxed text-[#A39E98]">
            Keep this step simple and clear. Confirm your delivery details,
            review the brews in your Cauldron, and choose how you want to pay.
          </p>
        </div>

        {isCartEmpty ? (
          <div className="rounded-[2rem] border border-[#2A2624] bg-[#121110] px-10 py-16 text-center">
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
              Empty Cauldron
            </p>
            <p className="mt-4 font-lora text-[#A39E98]">
              Add a fragrance to your Cauldron before moving into checkout.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 bg-[#C19A5B] px-6 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#1A1817] transition-colors hover:bg-[#F4EFE6]"
            >
              <Sparkles size={16} /> Continue Brewing
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-[#2A2624] bg-[#121110] p-8 md:p-10"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                    Full Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={formValues.fullName}
                    onChange={(event) =>
                      handleFieldChange("fullName", event.target.value)
                    }
                    placeholder="Your full name"
                  />
                  {errors.fullName ? (
                    <span className="mt-2 block text-sm text-[#d8a07f]">
                      {errors.fullName}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                    Phone Number
                  </span>
                  <input
                    className={fieldClassName}
                    value={formValues.phoneNumber}
                    onChange={(event) =>
                      handleFieldChange("phoneNumber", event.target.value)
                    }
                    placeholder="+92 300 0000000"
                  />
                  {errors.phoneNumber ? (
                    <span className="mt-2 block text-sm text-[#d8a07f]">
                      {errors.phoneNumber}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                    Email
                  </span>
                  <input
                    className={fieldClassName}
                    value={formValues.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    placeholder="you@example.com"
                    type="email"
                  />
                  {errors.email ? (
                    <span className="mt-2 block text-sm text-[#d8a07f]">
                      {errors.email}
                    </span>
                  ) : null}
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                    Address
                  </span>
                  <textarea
                    className={`${fieldClassName} min-h-28 resize-y`}
                    value={formValues.address}
                    onChange={(event) =>
                      handleFieldChange("address", event.target.value)
                    }
                    placeholder="House / street / area"
                  />
                  {errors.address ? (
                    <span className="mt-2 block text-sm text-[#d8a07f]">
                      {errors.address}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                    City
                  </span>
                  <input
                    className={fieldClassName}
                    value={formValues.city}
                    onChange={(event) =>
                      handleFieldChange("city", event.target.value)
                    }
                    placeholder="City"
                  />
                  {errors.city ? (
                    <span className="mt-2 block text-sm text-[#d8a07f]">
                      {errors.city}
                    </span>
                  ) : null}
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                    Notes / Delivery Instructions
                  </span>
                  <textarea
                    className={`${fieldClassName} min-h-28 resize-y`}
                    value={formValues.notes}
                    onChange={(event) =>
                      handleFieldChange("notes", event.target.value)
                    }
                    placeholder="Apartment number, landmark, preferred delivery timing, etc."
                  />
                </label>
              </div>

              <div className="mt-10 rounded-[1.5rem] border border-[#2A2624] bg-[#1A1817] p-6">
                <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
                  Payment Method
                </p>

                {isSettingsLoading ? (
                  <div className="mt-5 rounded-2xl border border-[#2A2624] bg-[#121110] px-4 py-4 font-lora text-sm text-[#A39E98]">
                    Loading available payment methods...
                  </div>
                ) : null}

                {!isSettingsLoading && settingsError ? (
                  <div className="mt-5 rounded-2xl border border-[#5a2a24] bg-[#211311] px-4 py-4 font-lora text-sm text-[#ddb1a3]">
                    {settingsError}
                  </div>
                ) : null}

                {!isSettingsLoading ? (
                  <div className="mt-5 space-y-3">
                    {storeSettings?.codEnabled ? (
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#2A2624] bg-[#121110] px-4 py-4 transition-colors hover:border-[#C19A5B]">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={formValues.paymentMethod === "cod"}
                          onChange={() => handleFieldChange("paymentMethod", "cod")}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-cinzel text-sm uppercase tracking-[0.18em] text-[#F4EFE6]">
                            Cash on Delivery
                          </span>
                          <span className="mt-1 block font-lora text-sm text-[#A39E98]">
                            Pay when your order arrives.
                          </span>
                        </span>
                      </label>
                    ) : null}

                    {storeSettings?.manualPaymentEnabled ? (
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#2A2624] bg-[#121110] px-4 py-4 transition-colors hover:border-[#C19A5B]">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={formValues.paymentMethod === "manual_payment"}
                          onChange={() =>
                            handleFieldChange("paymentMethod", "manual_payment")
                          }
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-cinzel text-sm uppercase tracking-[0.18em] text-[#F4EFE6]">
                            {storeSettings.manualPaymentTitle || "Manual Payment"}
                          </span>
                          <span className="mt-1 block font-lora text-sm text-[#A39E98]">
                            Use the live payment instructions below and attach your receipt for review.
                          </span>
                        </span>
                      </label>
                    ) : null}

                    {availablePaymentMethods.length === 0 ? (
                      <div className="rounded-2xl border border-[#5a2a24] bg-[#211311] px-4 py-4 font-lora text-sm text-[#ddb1a3]">
                        Checkout is temporarily unavailable because no payment methods
                        are enabled right now.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {errors.paymentMethod ? (
                  <span className="mt-3 block text-sm text-[#d8a07f]">
                    {errors.paymentMethod}
                  </span>
                ) : null}

                {isManualPayment ? (
                  <div className="mt-6 rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                    <div className="mb-5 rounded-2xl border border-[#2A2624] bg-[#1A1817] px-4 py-4">
                      <p className="font-cinzel text-sm uppercase tracking-[0.18em] text-[#F4EFE6]">
                        {storeSettings?.manualPaymentTitle || "Manual Payment"}
                      </p>
                      <p className="mt-2 whitespace-pre-line font-lora text-sm leading-6 text-[#A39E98]">
                        {getManualPaymentFallbackMessage(storeSettings)}
                      </p>

                      {storeSettings?.bankName ||
                      storeSettings?.accountTitle ||
                      storeSettings?.accountNumber ||
                      storeSettings?.iban ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {storeSettings.bankName ? (
                            <div>
                              <p className="font-cinzel text-xs uppercase tracking-[0.16em] text-[#C19A5B]">
                                Bank Name
                              </p>
                              <p className="mt-1 font-lora text-sm text-[#A39E98]">
                                {storeSettings.bankName}
                              </p>
                            </div>
                          ) : null}
                          {storeSettings.accountTitle ? (
                            <div>
                              <p className="font-cinzel text-xs uppercase tracking-[0.16em] text-[#C19A5B]">
                                Account Title
                              </p>
                              <p className="mt-1 font-lora text-sm text-[#A39E98]">
                                {storeSettings.accountTitle}
                              </p>
                            </div>
                          ) : null}
                          {storeSettings.accountNumber ? (
                            <div>
                              <p className="font-cinzel text-xs uppercase tracking-[0.16em] text-[#C19A5B]">
                                Account Number
                              </p>
                              <p className="mt-1 font-lora text-sm text-[#A39E98]">
                                {storeSettings.accountNumber}
                              </p>
                            </div>
                          ) : null}
                          {storeSettings.iban ? (
                            <div>
                              <p className="font-cinzel text-xs uppercase tracking-[0.16em] text-[#C19A5B]">
                                IBAN
                              </p>
                              <p className="mt-1 break-all font-lora text-sm text-[#A39E98]">
                                {storeSettings.iban}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-4 font-lora text-sm text-[#A39E98]">
                          Account details will appear here once they are added in
                          store settings.
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <Upload size={18} className="mt-1 text-[#C19A5B]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-cinzel text-sm uppercase tracking-[0.18em] text-[#F4EFE6]">
                          Payment Proof
                        </p>
                        <p className="mt-2 font-lora text-sm text-[#A39E98]">
                          Required for Manual Payment. Upload a JPG, PNG, WEBP, or PDF up to 2 MB.
                        </p>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(event) =>
                            handlePaymentProofChange(event.target.files?.[0] ?? null)
                          }
                          className="mt-4 block w-full text-sm text-[#A39E98] file:mr-4 file:rounded-full file:border-0 file:bg-[#C19A5B] file:px-4 file:py-2 file:font-cinzel file:text-xs file:uppercase file:tracking-[0.18em] file:text-[#1A1817] hover:file:bg-[#F4EFE6]"
                        />
                        {paymentProofFile ? (
                          <p className="mt-3 font-lora text-sm text-[#A39E98]">
                            Attached: {paymentProofFile.name} ({formatFileSize(paymentProofFile.size)})
                          </p>
                        ) : null}
                        {errors.paymentProof ? (
                          <span className="mt-3 block text-sm text-[#d8a07f]">
                            {errors.paymentProof}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {submitError ? (
                <div className="mt-6 rounded-2xl border border-[#2A2624] bg-[#1A1817] px-5 py-4 font-lora text-sm text-[#A39E98]">
                  {submitError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isSettingsLoading ||
                  !storeSettings ||
                  availablePaymentMethods.length === 0
                }
                className={`mt-8 flex w-full items-center justify-center gap-3 px-6 py-4 font-cinzel text-sm uppercase tracking-[0.2em] transition-colors ${
                  isSubmitting ||
                  isSettingsLoading ||
                  !storeSettings ||
                  availablePaymentMethods.length === 0
                    ? "cursor-wait bg-[#8f7244] text-[#1A1817]"
                    : "bg-[#C19A5B] text-[#1A1817] hover:bg-[#F4EFE6]"
                }`}
              >
                <Sparkles size={16} />
                {isSubmitting
                  ? isManualPayment
                    ? "Sealing Order & Proof"
                    : "Sealing Your Order"
                  : "Place Order"}
              </button>
            </form>

            <aside className="h-fit rounded-[2rem] border border-[#2A2624] bg-[#121110] p-8 lg:sticky lg:top-32">
              <h2 className="border-b border-[#2A2624] pb-4 font-cinzel text-2xl text-[#F4EFE6]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-2xl border border-[#2A2624] bg-[#1A1817] p-4"
                  >
                    <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#121110]">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full"
                        fallbackLabel={item.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-cinzel text-sm uppercase tracking-[0.14em] text-[#F4EFE6]">
                        {item.name}
                      </p>
                      <p className="mt-1 font-lora text-sm text-[#A39E98]">
                        Qty {item.quantity}
                        {item.volumeMl ? ` | ${item.volumeMl}ml` : ""}
                      </p>
                      <p className="mt-2 font-cinzel text-sm text-[#C19A5B]">
                        {formatRupees(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-[#2A2624] pt-6 font-lora text-[#A39E98]">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span>{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#2A2624] pt-6">
                <span className="font-cinzel text-lg text-[#F4EFE6]">Total</span>
                <span className="font-cinzel text-2xl text-[#C19A5B]">
                  {formatRupees(subtotal)}
                </span>
              </div>

              {storeSettings?.supportEmail || storeSettings?.whatsappNumber ? (
                <div className="mt-6 border-t border-[#2A2624] pt-6">
                  <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#C19A5B]">
                    Need help?
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[#A39E98]">
                    {storeSettings.supportEmail ? (
                      <p>Support email: {storeSettings.supportEmail}</p>
                    ) : null}
                    {storeSettings.whatsappNumber ? (
                      <p>WhatsApp: {storeSettings.whatsappNumber}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
