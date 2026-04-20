import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { formatRupees } from "../../../utils/currency";
import {
  fetchAdminDashboardData,
  type AdminDashboardData,
} from "../../../features/dashboard/api";

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const summaryCards: Array<{
  key: keyof Pick<
    AdminDashboardData,
    "lifetimeRevenue" | "lifetimeDeliveredOrders" | "lifetimeItemsSold"
  >;
  label: string;
  hint: string;
  format?: "currency";
}> = [
  {
    key: "lifetimeRevenue",
    label: "Lifetime Revenue",
    hint: "Cumulative delivered business revenue from monthly history records.",
    format: "currency",
  },
  {
    key: "lifetimeDeliveredOrders",
    label: "Lifetime Delivered Orders",
    hint: "All delivered orders counted into aggregate history so cleanup will not erase totals.",
  },
  {
    key: "lifetimeItemsSold",
    label: "Lifetime Items Sold",
    hint: "Total units sold across aggregate history, independent of live order retention.",
  },
];

const analyticsCards: Array<{
  key: keyof Pick<
    AdminDashboardData,
    "newOrders" | "pendingManualPayments" | "openOrders" | "lowStockProductsCount"
  >;
  label: string;
  hint: string;
}> = [
  {
    key: "newOrders",
    label: "New Orders",
    hint: "Fresh live orders that still need first action from the team.",
  },
  {
    key: "pendingManualPayments",
    label: "Pending Manual Payments",
    hint: "Manual payment orders still waiting for payment confirmation.",
  },
  {
    key: "openOrders",
    label: "Open Orders",
    hint: "Current live orders not yet delivered or cancelled.",
  },
  {
    key: "lowStockProductsCount",
    label: "Low Stock Products",
    hint: "Products at or below 5 units remaining.",
  },
];

export const DashboardPage = () => {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAdminDashboardData();

        if (!isMounted) {
          return;
        }

        setDashboard(data);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune admin dashboard.", loadError);
        setDashboard(null);
        setError("Dashboard data could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          Dashboard
        </p>
        <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
          Velune operations at a glance
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
          Separate long-term business performance from today&apos;s operational queue so
          delivered history stays accurate even after older orders are cleaned up.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          Loading the Velune operations overview...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-[2rem] border border-[#e6c0b7] bg-white px-6 py-12 text-center text-[#9f3c24] shadow-sm">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && dashboard ? (
        <>
          <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
            <div className="border-b border-[#efe4d2] pb-5">
              <h2 className="font-cinzel text-2xl text-[#1A1817]">Lifetime Business</h2>
              <p className="mt-2 text-sm leading-6 text-[#5c5046]">
                These totals come only from aggregate history, so they stay correct even
                after finalized live orders are cleaned up.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <div
                  key={card.key}
                  className="rounded-[1.75rem] border border-[#efe4d2] bg-[#faf6ef] p-5"
                >
                  <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    {card.label}
                  </p>
                  <p className="mt-4 font-cinzel text-3xl text-[#1A1817]">
                    {card.format === "currency"
                      ? formatRupees(dashboard[card.key] as number)
                      : dashboard[card.key]}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#5c5046]">{card.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
            <div className="border-b border-[#efe4d2] pb-5">
              <h2 className="font-cinzel text-2xl text-[#1A1817]">Live Operations</h2>
              <p className="mt-2 text-sm leading-6 text-[#5c5046]">
                These counts come from current orders and products only, so they show
                what still needs attention right now.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {analyticsCards.map((card) => (
                <div
                  key={card.key}
                  className="rounded-[1.75rem] border border-[#efe4d2] bg-[#faf6ef] p-5"
                >
                  <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                    {card.label}
                  </p>
                  <p className="mt-4 font-cinzel text-3xl text-[#1A1817]">
                    {dashboard[card.key]}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#5c5046]">{card.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
            <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#efe4d2] px-6 py-5">
                <div>
                  <h2 className="font-cinzel text-xl text-[#1A1817]">Recent Orders</h2>
                  <p className="mt-1 text-sm text-[#7a6d62]">
                    The newest customer orders in the queue.
                  </p>
                </div>
                <Link
                  to="/admin/orders"
                  className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
                >
                  View All Orders
                </Link>
              </div>

              {dashboard.recentOrders.length === 0 ? (
                <div className="px-6 py-12 text-center text-[#7a6d62]">
                  No orders have been placed yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#efe4d2]">
                    <thead className="bg-[#faf6ef]">
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                        <th className="px-6 py-4 font-cinzel">Order</th>
                        <th className="px-6 py-4 font-cinzel">Customer</th>
                        <th className="px-6 py-4 font-cinzel">Payment</th>
                        <th className="px-6 py-4 font-cinzel">Status</th>
                        <th className="px-6 py-4 font-cinzel">Subtotal</th>
                        <th className="px-6 py-4 font-cinzel">Placed</th>
                        <th className="px-6 py-4 font-cinzel">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0e7da]">
                      {dashboard.recentOrders.map((order) => (
                        <tr key={order.id} className="align-top text-sm text-[#3f372f]">
                          <td className="px-6 py-5">
                            <div className="font-cinzel text-sm uppercase tracking-[0.14em] text-[#1A1817]">
                              {order.orderNumber}
                            </div>
                          </td>
                          <td className="px-6 py-5 font-medium text-[#1A1817]">
                            {order.customerName}
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
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#efe4d2] px-6 py-5">
                <div>
                  <h2 className="font-cinzel text-xl text-[#1A1817]">
                    Low Stock Products
                  </h2>
                  <p className="mt-1 text-sm text-[#7a6d62]">
                    Products with 5 units or fewer remaining.
                  </p>
                </div>
                <Link
                  to="/admin/products"
                  className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
                >
                  View Catalog
                </Link>
              </div>

              {dashboard.lowStockProducts.length === 0 ? (
                <div className="px-6 py-12 text-center text-[#7a6d62]">
                  No products are currently at low stock.
                </div>
              ) : (
                <div className="divide-y divide-[#f0e7da]">
                  {dashboard.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-4 px-6 py-5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1817]">{product.name}</p>
                        <p className="mt-1 text-sm text-[#7a6d62]">
                          {product.stockQuantity} units remaining
                        </p>
                      </div>
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="inline-flex shrink-0 rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#efe4d2] px-6 py-5">
              <div>
                <h2 className="font-cinzel text-xl text-[#1A1817]">
                  Top-Selling Products
                </h2>
                <p className="mt-1 text-sm text-[#7a6d62]">
                  Ranked from cumulative monthly history so cleanup of older orders does
                  not shrink the long-term picture.
                </p>
              </div>
              <Link
                to="/admin/products"
                className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
              >
                View Products
              </Link>
            </div>

            {dashboard.topSellingProducts.length === 0 ? (
              <div className="px-6 py-12 text-center text-[#7a6d62]">
                There is not enough order history yet to rank products.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#efe4d2]">
                  <thead className="bg-[#faf6ef]">
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      <th className="px-6 py-4 font-cinzel">Product</th>
                      <th className="px-6 py-4 font-cinzel">Quantity Sold</th>
                      <th className="px-6 py-4 font-cinzel">Sales Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e7da]">
                    {dashboard.topSellingProducts.map((product) => (
                      <tr
                        key={product.productName}
                        className="align-top text-sm text-[#3f372f]"
                      >
                        <td className="px-6 py-5 font-medium text-[#1A1817]">
                          {product.productName}
                        </td>
                        <td className="px-6 py-5">{product.totalQuantitySold}</td>
                        <td className="px-6 py-5 font-medium text-[#1A1817]">
                          {formatRupees(product.totalSalesAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
};
