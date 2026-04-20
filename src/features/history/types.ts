export type HistoryPeriod = {
  year: number;
  month: number;
};

export type MonthlyHistorySummary = {
  year: number;
  month: number;
  totalRevenue: number;
  totalDeliveredOrders: number;
  totalItemsSold: number;
};

export type MonthlyProductHistory = {
  productName: string;
  quantitySold: number;
  revenueGenerated: number;
};

export type MonthlyHistoryData = {
  summary: MonthlyHistorySummary | null;
  products: MonthlyProductHistory[];
};

export type LifetimeHistoryTotals = {
  lifetimeRevenue: number;
  lifetimeDeliveredOrders: number;
  lifetimeItemsSold: number;
};

export type LifetimeProductHistory = {
  productId: string | null;
  productName: string;
  quantitySold: number;
  revenueGenerated: number;
};
