import React, { useEffect, useState } from "react";
import { trackOrderByNumberAndPhone, type TrackedOrder } from "../../../features/orders/api";
import { formatRupees } from "../../../utils/currency";
import {
  normalizePakistanPhoneNumber,
  pakistanPhoneValidationMessage,
} from "../../../utils/phone";
import {
  readSavedOrderTrackingDetails,
  saveOrderTrackingDetails,
} from "../../../utils/orderTracking";

type TrackingFormErrors = {
  orderNumber?: string;
  phoneNumber?: string;
};

type OrderTrackingSectionProps = {
  variant?: "embedded" | "page";
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const validateTrackingForm = (
  orderNumber: string,
  phoneNumber: string,
): TrackingFormErrors => {
  const errors: TrackingFormErrors = {};

  if (!orderNumber.trim()) {
    errors.orderNumber = "Enter your order number.";
  }

  if (!phoneNumber.trim()) {
    errors.phoneNumber = "Enter the phone number used for the order.";
  } else if (!normalizePakistanPhoneNumber(phoneNumber)) {
    errors.phoneNumber = pakistanPhoneValidationMessage;
  }

  return errors;
};

export const OrderTrackingSection = ({
  variant = "embedded",
}: OrderTrackingSectionProps) => {
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<TrackingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"neutral" | "error">("neutral");
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    const savedDetails = readSavedOrderTrackingDetails();

    if (!savedDetails) {
      return;
    }

    setOrderNumber(savedDetails.orderNumber);
    setPhoneNumber(savedDetails.phoneNumber);
    setMessage("Your latest order details are ready to track again.");
    setMessageTone("neutral");
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateTrackingForm(orderNumber, phoneNumber);
    setErrors(nextErrors);
    setMessage(null);
    setTrackedOrder(null);

    if (Object.keys(nextErrors).length > 0) {
      setMessageTone("error");
      setMessage("Enter both your order number and phone number to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await trackOrderByNumberAndPhone({
        orderNumber,
        phoneNumber,
      });

      saveOrderTrackingDetails({
        orderNumber,
        phoneNumber: normalizePakistanPhoneNumber(phoneNumber) ?? phoneNumber,
      });
      setTrackedOrder(order);
      setMessageTone("neutral");
      setMessage("Order found. Review the latest status below.");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "We could not look up that order right now.";

      setMessageTone("error");
      setMessage(nextMessage);
      setTrackedOrder(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionClassName =
    variant === "page"
      ? "min-h-[80vh] bg-[#1A1817] px-6 py-20 text-[#F4EFE6]"
      : "bg-[#161413] px-6 py-20 text-[#F4EFE6]";
  const heading = variant === "page" ? "Track your Velune order" : "Track an existing order";
  const description =
    variant === "page"
      ? "Enter the order number and phone number you used at checkout to review the latest payment and delivery progress for your blend."
      : "Already placed a Velune order? Enter the same order number and phone used at checkout to see the latest payment and delivery progress before you continue brewing.";

  return (
    <section className={sectionClassName}>
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#2A2624] bg-[#121110] p-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
              Order Tracking
            </p>
            <h1 className="mt-4 font-cinzel text-4xl">{heading}</h1>
            <p className="mt-6 font-lora leading-8 text-[#A39E98]">{description}</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                  Order Number
                </span>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(event) => {
                    setOrderNumber(event.target.value);
                    setErrors((prev) => ({ ...prev, orderNumber: undefined }));
                    setMessage(null);
                  }}
                  placeholder="VLN-20260420-ABC123"
                  className="w-full rounded-xl border border-[#2A2624] bg-[#1A1817] px-4 py-3 text-[#F4EFE6] outline-none transition-colors focus:border-[#C19A5B]"
                />
                {errors.orderNumber ? (
                  <p className="mt-2 text-sm text-[#d9a08c]">{errors.orderNumber}</p>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                  Phone Number
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => {
                    setPhoneNumber(event.target.value);
                    setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                    setMessage(null);
                  }}
                  placeholder="Phone used at checkout"
                  className="w-full rounded-xl border border-[#2A2624] bg-[#1A1817] px-4 py-3 text-[#F4EFE6] outline-none transition-colors focus:border-[#C19A5B]"
                />
                {errors.phoneNumber ? (
                  <p className="mt-2 text-sm text-[#d9a08c]">{errors.phoneNumber}</p>
                ) : null}
              </label>

              {message ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                    messageTone === "error"
                      ? "border-[#6a3429] bg-[#261714] text-[#e4b8a8]"
                      : "border-[#2A2624] bg-[#1A1817] text-[#A39E98]"
                  }`}
                >
                  {message}
                </div>
              ) : (
                <div className="rounded-xl border border-[#2A2624] bg-[#1A1817] px-4 py-3 text-sm leading-6 text-[#A39E98]">
                  Keep your order number close after checkout so tracking stays quick
                  and easy.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#C19A5B] px-4 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#1A1817] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Looking Up Order..." : "Track Order"}
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-[#2A2624] bg-[#1A1817] p-6">
            {!trackedOrder ? (
              <div className="flex min-h-full flex-col justify-center rounded-[1.5rem] border border-dashed border-[#3a3633] px-6 py-12 text-center">
                <p className="font-cinzel text-xs uppercase tracking-[0.22em] text-[#C19A5B]">
                  Order Status
                </p>
                <h2 className="mt-4 font-cinzel text-2xl text-[#F4EFE6]">
                  Ready when you are
                </h2>
                <p className="mt-4 font-lora leading-7 text-[#A39E98]">
                  Once you submit your order number and phone number, this panel
                  will show the latest fulfillment and payment progress without
                  exposing private address or payment proof details.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                  <p className="font-cinzel text-xs uppercase tracking-[0.22em] text-[#C19A5B]">
                    {trackedOrder.orderNumber}
                  </p>
                  <p className="mt-3 text-sm text-[#A39E98]">
                    Placed {formatDate(trackedOrder.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-[#A39E98]">
                    For {trackedOrder.customerName} in {trackedOrder.city}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#C19A5B]">
                      Order Status
                    </p>
                    <p className="mt-3 text-lg text-[#F4EFE6]">
                      {trackedOrder.orderStatus}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#C19A5B]">
                      Payment Status
                    </p>
                    <p className="mt-3 text-lg text-[#F4EFE6]">
                      {trackedOrder.paymentStatus}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#C19A5B]">
                      Payment Method
                    </p>
                    <p className="mt-3 text-lg text-[#F4EFE6]">
                      {trackedOrder.paymentMethod}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#C19A5B]">
                      Subtotal
                    </p>
                    <p className="mt-3 text-lg text-[#F4EFE6]">
                      {formatRupees(trackedOrder.subtotal)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#121110] p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-[#2A2624] pb-4">
                    <div>
                      <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#C19A5B]">
                        Item Summary
                      </p>
                      <p className="mt-2 text-sm text-[#A39E98]">
                        The blends included in this order.
                      </p>
                    </div>
                    <p className="text-sm text-[#A39E98]">
                      {trackedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} units
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {trackedOrder.items.map((item, index) => (
                      <div
                        key={`${item.productName}-${index}`}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-[#2A2624] bg-[#1A1817] px-4 py-4"
                      >
                        <div>
                          <p className="font-medium text-[#F4EFE6]">{item.productName}</p>
                          <p className="mt-1 text-sm text-[#A39E98]">
                            Qty {item.quantity} x {formatRupees(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-medium text-[#F4EFE6]">
                          {formatRupees(item.lineTotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
