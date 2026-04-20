import { fetchLifetimeHistoryTotals, fetchLifetimeTopSellingProducts } from "../history/api";
import { fetchAdminOrders } from "../orders/api";
import type { AdminOrderSummary } from "../orders/types";
import { fetchAdminProducts } from "../products/api";
import type { ProductRecord } from "../products/types";

const lowStockThreshold = 5;
const recentOrderLimit = 6;
const lowStockLimit = 6;
const topSellingLimit = 8;

const hasPendingManualPayment = (order: AdminOrderSummary) =>
  order.paymentStatus === "Pending" &&
  /manual/i.test(order.paymentMethod.replace(/_/g, " "));

const isLowStockProduct = (product: ProductRecord) =>
  product.stockQuantity <= lowStockThreshold;

const isDeliveredOrder = (order: AdminOrderSummary) => order.orderStatus === "Delivered";

const isCancelledOrder = (order: AdminOrderSummary) => order.orderStatus === "Cancelled";

const isOpenOrder = (order: AdminOrderSummary) =>
  !isDeliveredOrder(order) && !isCancelledOrder(order);

export type TopSellingProduct = {
  productName: string;
  totalQuantitySold: number;
  totalSalesAmount: number;
};

export type AdminDashboardData = {
  lifetimeRevenue: number;
  lifetimeDeliveredOrders: number;
  lifetimeItemsSold: number;
  newOrders: number;
  pendingManualPayments: number;
  openOrders: number;
  lowStockProductsCount: number;
  recentOrders: AdminOrderSummary[];
  lowStockProducts: ProductRecord[];
  topSellingProducts: TopSellingProduct[];
};

export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const [orders, products, lifetimeTotals, lifetimeTopProducts] = await Promise.all([
    fetchAdminOrders({
      query: "",
      orderStatus: "",
      paymentStatus: "",
    }),
    fetchAdminProducts(),
    fetchLifetimeHistoryTotals(),
    fetchLifetimeTopSellingProducts(topSellingLimit),
  ]);

  const lowStockProducts = products
    .filter(isLowStockProduct)
    .sort((left, right) => left.stockQuantity - right.stockQuantity);

  return {
    lifetimeRevenue: lifetimeTotals.lifetimeRevenue,
    lifetimeDeliveredOrders: lifetimeTotals.lifetimeDeliveredOrders,
    lifetimeItemsSold: lifetimeTotals.lifetimeItemsSold,
    newOrders: orders.filter((order) => order.orderStatus === "New").length,
    pendingManualPayments: orders.filter(hasPendingManualPayment).length,
    openOrders: orders.filter(isOpenOrder).length,
    lowStockProductsCount: lowStockProducts.length,
    recentOrders: orders.slice(0, recentOrderLimit),
    lowStockProducts: lowStockProducts.slice(0, lowStockLimit),
    topSellingProducts: lifetimeTopProducts.map((product) => ({
      productName: product.productName,
      totalQuantitySold: product.quantitySold,
      totalSalesAmount: product.revenueGenerated,
    })),
  };
};
