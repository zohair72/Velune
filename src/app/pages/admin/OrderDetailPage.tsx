import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ExternalLink, RefreshCw } from "lucide-react";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatRupees } from "../../../utils/currency";
import {
  fetchAdminOrderById,
  getAdminPaymentProofSignedUrl,
  updateAdminOrderStatuses,
} from "../../../features/orders/api";
import {
  adminOrderStatuses,
  adminPaymentStatuses,
  type AdminOrderDetail,
} from "../../../features/orders/types";

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getRestockNote = (order: AdminOrderDetail) => {
  if (order.orderStatus !== "Cancelled" || !order.stockRestored) {
    return null;
  }

  return "This order is cancelled and its item quantities have already been restored to inventory.";
};

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProofLoading, setIsProofLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [proofMessage, setProofMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!id) {
        setError("Order ID is missing.");
        setOrder(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSaveMessage(null);
      setProofMessage(null);

      try {
        const data = await fetchAdminOrderById(id);

        if (!isMounted) {
          return;
        }

        if (!data) {
          setOrder(null);
          setPaymentStatus("");
          setOrderStatus("");
          return;
        }

        setOrder(data);
        setPaymentStatus(data.paymentStatus);
        setOrderStatus(data.orderStatus);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune admin order detail.", loadError);
        setError("This order could not be loaded right now.");
        setOrder(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const itemCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order],
  );
  const restockNote = order ? getRestockNote(order) : null;

  const handleSaveStatuses = async () => {
    if (!order) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      const wasCancelled = order.orderStatus === "Cancelled";
      const hadRestoredStock = order.stockRestored;
      const updatedStatuses = await updateAdminOrderStatuses(order.id, {
        paymentStatus,
        orderStatus,
        stockRestored: order.stockRestored,
      });

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: updatedStatuses.paymentStatus,
              orderStatus: updatedStatuses.orderStatus,
              stockRestored: updatedStatuses.stockRestored ?? prev.stockRestored,
            }
          : prev,
      );

      const isCancelledNow = updatedStatuses.orderStatus === "Cancelled";
      const stockRestoredNow = updatedStatuses.stockRestored ?? hadRestoredStock;

      if (isCancelledNow && stockRestoredNow && !wasCancelled && !hadRestoredStock) {
        setSaveMessage("Order cancelled. Stock was restored to inventory.");
      } else if (isCancelledNow && stockRestoredNow && hadRestoredStock) {
        setSaveMessage(
          "Order remains cancelled. Stock had already been restored earlier.",
        );
      } else {
        setSaveMessage("Order statuses saved.");
      }
    } catch (saveError) {
      console.error("Failed to update Velune order statuses.", saveError);
      setError("Statuses could not be updated right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPaymentProof = async () => {
    if (!order?.paymentProofPath) {
      return;
    }

    setIsProofLoading(true);
    setProofMessage(null);

    try {
      const signedUrl = await getAdminPaymentProofSignedUrl(order.paymentProofPath);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
      setProofMessage("A secure proof link was opened in a new tab.");
    } catch (proofError) {
      console.error("Failed to open secure Velune payment proof link.", proofError);
      setProofMessage("The payment proof could not be opened right now.");
    } finally {
      setIsProofLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
              Order Detail
            </p>
            <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
              {order?.orderNumber ?? "Order Record"}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
              Review customer details, payment state, fulfillment progress, and
              any uploaded payment proof for this Velune order.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-3 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
          >
            Back to Orders
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          Loading this order record...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-[2rem] border border-[#e6c0b7] bg-white px-6 py-12 text-center text-[#9f3c24] shadow-sm">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && !order ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          This order could not be found.
        </div>
      ) : null}

      {!isLoading && !error && order ? (
        <>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_380px]">
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Customer
                    </p>
                    <p className="mt-2 text-lg font-medium text-[#1A1817]">
                      {order.customerName}
                    </p>
                    <p className="mt-1 text-[#5c5046]">{order.phone}</p>
                    <p className="mt-1 text-[#5c5046]">{order.email ?? "No email provided"}</p>
                  </div>
                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Delivery Address
                    </p>
                    <p className="mt-2 text-[#1A1817]">{order.address}</p>
                    <p className="mt-1 text-[#5c5046]">{order.city}</p>
                  </div>
                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Notes
                    </p>
                    <p className="mt-2 text-[#5c5046]">
                      {order.notes?.trim() || "No delivery notes were left on this order."}
                    </p>
                  </div>
                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Placed
                    </p>
                    <p className="mt-2 text-[#1A1817]">{formatDate(order.createdAt)}</p>
                    <p className="mt-1 text-[#5c5046]">
                      Updated {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#efe4d2] pb-4">
                  <div>
                    <h2 className="font-cinzel text-2xl text-[#1A1817]">Order Items</h2>
                    <p className="mt-1 text-sm text-[#7a6d62]">
                      {itemCount} total units across {order.items.length} lines
                    </p>
                  </div>
                  <div className="font-cinzel text-lg text-[#0A3600]">
                    {formatRupees(order.subtotal)}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-[#efe4d2] bg-[#faf6ef] px-5 py-4"
                    >
                      <div>
                        <p className="font-medium text-[#1A1817]">{item.productName}</p>
                        <p className="mt-1 text-sm text-[#7a6d62]">
                          Qty {item.quantity} x {formatRupees(item.unitPrice)}
                        </p>
                      </div>
                      <div className="font-medium text-[#1A1817]">
                        {formatRupees(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
                <h2 className="font-cinzel text-2xl text-[#1A1817]">Status Controls</h2>
                <div className="mt-6 space-y-5">
                  {restockNote ? (
                    <div className="rounded-2xl border border-[#d8cab5] bg-[#f7f1e6] px-4 py-4 text-sm leading-6 text-[#5c5046]">
                      {restockNote}
                    </div>
                  ) : null}

                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Payment Method
                    </p>
                    <p className="mt-2 text-[#1A1817]">{order.paymentMethod}</p>
                  </div>

                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Current Payment Status
                    </p>
                    <div className="mt-2">
                      <StatusBadge value={order.paymentStatus} />
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Payment Status
                    </span>
                    <select
                      value={paymentStatus}
                      onChange={(event) => setPaymentStatus(event.target.value)}
                      className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                    >
                      {adminPaymentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Current Order Status
                    </p>
                    <div className="mt-2">
                      <StatusBadge value={order.orderStatus} />
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      Order Status
                    </span>
                    <select
                      value={orderStatus}
                      onChange={(event) => setOrderStatus(event.target.value)}
                      className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
                    >
                      {adminOrderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  {saveMessage ? (
                    <p className="text-sm text-[#2f5b2d]">{saveMessage}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSaveStatuses}
                    disabled={isSaving}
                    className="w-full rounded-xl bg-[#0A3600] px-4 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save Status Changes"}
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
                <h2 className="font-cinzel text-2xl text-[#1A1817]">Payment Proof</h2>
                <p className="mt-4 text-sm leading-6 text-[#5c5046]">
                  Payment proofs remain private in Supabase Storage. Admins open a
                  short-lived signed link only when needed.
                </p>

                {order.paymentProofPath ? (
                  <div className="mt-6 space-y-4">
                    <p className="rounded-xl border border-[#efe4d2] bg-[#faf6ef] px-4 py-3 text-sm text-[#5c5046]">
                      Stored proof: {order.paymentProofPath.split("/").pop()}
                    </p>
                    {proofMessage ? (
                      <p className="text-sm text-[#5c5046]">{proofMessage}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleOpenPaymentProof}
                      disabled={isProofLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d8cab5] px-4 py-3 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProofLoading ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      {isProofLoading ? "Creating Secure Link" : "Open Secure Proof"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-[#7a6d62]">
                    No payment proof is attached to this order.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
