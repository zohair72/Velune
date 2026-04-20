import React from "react";
import { Link, useLocation, useParams } from "react-router";
import { Sparkles } from "lucide-react";
import type { CheckoutPaymentMethod } from "../../../features/orders/api";

type OrderConfirmationState = {
  customerName?: string;
  paymentMethod?: CheckoutPaymentMethod;
  paymentStatus?: string;
  orderStatus?: string;
  paymentProofMessage?: string;
};

const getPaymentMessage = (paymentMethod?: CheckoutPaymentMethod) => {
  if (paymentMethod === "manual_payment") {
    return "Your manual payment order is recorded. We will review the receipt attached to this order.";
  }

  return "Your order is recorded. You can pay when the delivery arrives.";
};

export const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const state = (location.state as OrderConfirmationState | null) ?? null;

  return (
    <div className="min-h-[80vh] bg-[#1A1817] px-6 py-20 text-[#F4EFE6]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#2A2624] bg-[#121110] p-10 text-center">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
          Order Confirmation
        </p>
        <h1 className="mt-4 font-cinzel text-4xl">Your order has been sealed</h1>
        <p className="mt-6 font-lora text-[#A39E98]">
          {state?.customerName
            ? `Thank you, ${state.customerName}. ${getPaymentMessage(state.paymentMethod)}`
            : "Thank you for your order. Keep this order number close while we prepare your Velune blend."}
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-[#2A2624] bg-[#1A1817] px-6 py-5">
          <p className="font-cinzel text-xs uppercase tracking-[0.28em] text-[#C19A5B]">
            Order Number
          </p>
          <p className="mt-3 font-cinzel text-2xl text-[#F4EFE6]">
            {orderNumber ?? "Pending"}
          </p>
        </div>

        {state?.paymentProofMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#2A2624] bg-[#1A1817] px-6 py-5 text-left">
            <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
              Payment Proof
            </p>
            <p className="mt-2 font-lora text-[#A39E98]">
              {state.paymentProofMessage}
            </p>
          </div>
        ) : null}

        {state?.paymentStatus || state?.orderStatus ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#1A1817] px-5 py-4">
              <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                Payment Status
              </p>
              <p className="mt-2 font-lora text-[#A39E98]">
                {state.paymentStatus ?? "Pending"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#2A2624] bg-[#1A1817] px-5 py-4">
              <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B]">
                Order Status
              </p>
              <p className="mt-2 font-lora text-[#A39E98]">
                {state.orderStatus ?? "New"}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/track-order"
            className="inline-flex items-center justify-center gap-2 border border-[#C19A5B] px-6 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#C19A5B] transition-colors hover:bg-[#C19A5B] hover:text-[#1A1817]"
          >
            Track This Order
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-[#C19A5B] px-6 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#1A1817] transition-colors hover:bg-[#F4EFE6]"
          >
            <Sparkles size={16} /> Continue Brewing
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 border border-[#2A2624] px-6 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#A39E98] transition-colors hover:border-[#C19A5B] hover:text-[#C19A5B]"
          >
            Return to Shelf
          </Link>
        </div>
      </div>
    </div>
  );
};
