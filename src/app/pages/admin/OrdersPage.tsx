import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatRupees } from "../../../utils/currency";
import { fetchAdminOrders } from "../../../features/orders/api";
import {
  adminOrderStatuses,
  adminPaymentStatuses,
  type AdminOrderFilters,
  type AdminOrderSummary,
} from "../../../features/orders/types";

const initialFilters: AdminOrderFilters = {
  query: "",
  orderStatus: "",
  paymentStatus: "",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const OrdersPage = () => {
  const [draftFilters, setDraftFilters] = useState<AdminOrderFilters>(initialFilters);
  const [filters, setFilters] = useState<AdminOrderFilters>(initialFilters);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAdminOrders(filters);

        if (!isMounted) {
          return;
        }

        setOrders(data);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune admin orders.", loadError);
        setOrders([]);
        setError("Orders could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.query.trim() || filters.orderStatus.trim() || filters.paymentStatus.trim(),
      ),
    [filters],
  );

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      query: draftFilters.query.trim(),
      orderStatus: draftFilters.orderStatus,
      paymentStatus: draftFilters.paymentStatus,
    });
  };

  const handleResetFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          Orders
        </p>
        <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
          Track every order
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
          Search by order number, customer name, or phone number, then narrow the
          queue with operational payment and fulfillment statuses.
        </p>
      </div>

      <form
        onSubmit={handleApplyFilters}
        className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]">
              Search
            </span>
            <div className="flex items-center rounded-xl border border-[#d8cab5] px-4">
              <Search size={16} className="text-[#7a6d62]" />
              <input
                value={draftFilters.query}
                onChange={(event) =>
                  setDraftFilters((prev) => ({ ...prev, query: event.target.value }))
                }
                placeholder="Order number, customer name, or phone"
                className="w-full bg-transparent px-3 py-3 outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]">
              Order Status
            </span>
            <select
              value={draftFilters.orderStatus}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  orderStatus: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
            >
              <option value="">All statuses</option>
              {adminOrderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]">
              Payment Status
            </span>
            <select
              value={draftFilters.paymentStatus}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  paymentStatus: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
            >
              <option value="">All payments</option>
              {adminPaymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-xl bg-[#0A3600] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity hover:opacity-90"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-[#d8cab5] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#efe4d2] px-6 py-5">
          <div>
            <h2 className="font-cinzel text-xl text-[#1A1817]">Order Queue</h2>
            <p className="mt-1 text-sm text-[#7a6d62]">
              {isLoading ? "Loading orders..." : `${orders.length} orders shown`}
            </p>
          </div>
          {hasActiveFilters ? (
            <span className="rounded-full border border-[#d8cab5] bg-[#f7f1e8] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#5c5046]">
              Filtered
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-[#7a6d62]">
            Loading the Velune order ledger...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="px-6 py-12 text-center text-[#9f3c24]">{error}</div>
        ) : null}

        {!isLoading && !error && orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#7a6d62]">
            No orders match the current search and filter settings.
          </div>
        ) : null}

        {!isLoading && !error && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#efe4d2]">
              <thead className="bg-[#faf6ef]">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                  <th className="px-6 py-4 font-cinzel">Order</th>
                  <th className="px-6 py-4 font-cinzel">Customer</th>
                  <th className="px-6 py-4 font-cinzel">Payment</th>
                  <th className="px-6 py-4 font-cinzel">Fulfillment</th>
                  <th className="px-6 py-4 font-cinzel">Subtotal</th>
                  <th className="px-6 py-4 font-cinzel">Placed</th>
                  <th className="px-6 py-4 font-cinzel">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e7da]">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top text-sm text-[#3f372f]">
                    <td className="px-6 py-5">
                      <div className="font-cinzel text-sm uppercase tracking-[0.14em] text-[#1A1817]">
                        {order.orderNumber}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[#7a6d62]">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-medium text-[#1A1817]">
                        {order.customerName}
                      </div>
                      <div className="mt-1 text-[#7a6d62]">{order.phone}</div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge value={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    <td className="px-6 py-5 font-medium text-[#1A1817]">
                      {formatRupees(order.subtotal)}
                    </td>
                    <td className="px-6 py-5 text-[#7a6d62]">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
                      >
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
};
