import { requireSupabase } from "../../utils/supabase";
import type {
  HistoryPeriod,
  LifetimeHistoryTotals,
  LifetimeProductHistory,
  MonthlyHistoryData,
  MonthlyHistorySummary,
  MonthlyProductHistory,
} from "./types";

type SalesHistoryMonthlyRow = {
  year: number | string | null;
  month: number | string | null;
  total_revenue?: number | string | null;
  total_orders_delivered?: number | string | null;
  total_items_sold?: number | string | null;
};

type ProductSalesHistoryMonthlyRow = {
  year: number | string | null;
  month: number | string | null;
  product_id?: string | null;
  product_name?: string | null;
  quantity_sold?: number | string | null;
  revenue_generated?: number | string | null;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const toPositiveInteger = (value: number | string | null | undefined) =>
  Math.max(0, Math.trunc(toNumber(value)));

const mapHistoryPeriod = (row: SalesHistoryMonthlyRow): HistoryPeriod => ({
  year: toPositiveInteger(row.year),
  month: toPositiveInteger(row.month),
});

const mapMonthlyHistorySummary = (
  row: SalesHistoryMonthlyRow,
): MonthlyHistorySummary => ({
  year: toPositiveInteger(row.year),
  month: toPositiveInteger(row.month),
  totalRevenue: toNumber(row.total_revenue),
  totalDeliveredOrders: toPositiveInteger(row.total_orders_delivered),
  totalItemsSold: toPositiveInteger(row.total_items_sold),
});

const mapMonthlyProductHistory = (
  row: ProductSalesHistoryMonthlyRow,
): MonthlyProductHistory => ({
  productName: row.product_name?.trim() || "Velune Blend",
  quantitySold: toPositiveInteger(row.quantity_sold),
  revenueGenerated: toNumber(row.revenue_generated),
});

const mapLifetimeProductHistory = (
  row: ProductSalesHistoryMonthlyRow,
): LifetimeProductHistory => ({
  productId: row.product_id?.trim() || null,
  productName: row.product_name?.trim() || "Velune Blend",
  quantitySold: toPositiveInteger(row.quantity_sold),
  revenueGenerated: toNumber(row.revenue_generated),
});

export const fetchHistoryPeriods = async (): Promise<HistoryPeriod[]> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_history_monthly")
    .select("year, month")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) {
    throw error;
  }

  const seen = new Set<string>();

  return ((data ?? []) as SalesHistoryMonthlyRow[])
    .map(mapHistoryPeriod)
    .filter((period) => period.year > 0 && period.month >= 1 && period.month <= 12)
    .filter((period) => {
      const key = `${period.year}-${period.month}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

export const fetchMonthlyHistoryData = async (
  period: HistoryPeriod,
): Promise<MonthlyHistoryData> => {
  const supabase = requireSupabase();

  const [summaryResponse, productsResponse] = await Promise.all([
    supabase
      .from("sales_history_monthly")
      .select("year, month, total_revenue, total_orders_delivered, total_items_sold")
      .eq("year", period.year)
      .eq("month", period.month)
      .maybeSingle(),
    supabase
      .from("product_sales_history_monthly")
      .select("year, month, product_name, quantity_sold, revenue_generated")
      .eq("year", period.year)
      .eq("month", period.month)
      .order("revenue_generated", { ascending: false })
      .order("quantity_sold", { ascending: false })
      .order("product_name", { ascending: true }),
  ]);

  if (summaryResponse.error) {
    throw summaryResponse.error;
  }

  if (productsResponse.error) {
    throw productsResponse.error;
  }

  return {
    summary: summaryResponse.data
      ? mapMonthlyHistorySummary(summaryResponse.data as SalesHistoryMonthlyRow)
      : null,
    products: ((productsResponse.data ?? []) as ProductSalesHistoryMonthlyRow[]).map(
      mapMonthlyProductHistory,
    ),
  };
};

export const fetchLifetimeHistoryTotals = async (): Promise<LifetimeHistoryTotals> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_history_monthly")
    .select("total_revenue, total_orders_delivered, total_items_sold");

  if (error) {
    throw error;
  }

  return ((data ?? []) as SalesHistoryMonthlyRow[]).reduce<LifetimeHistoryTotals>(
    (totals, row) => ({
      lifetimeRevenue: totals.lifetimeRevenue + toNumber(row.total_revenue),
      lifetimeDeliveredOrders:
        totals.lifetimeDeliveredOrders + toPositiveInteger(row.total_orders_delivered),
      lifetimeItemsSold: totals.lifetimeItemsSold + toPositiveInteger(row.total_items_sold),
    }),
    {
      lifetimeRevenue: 0,
      lifetimeDeliveredOrders: 0,
      lifetimeItemsSold: 0,
    },
  );
};

export const fetchLifetimeTopSellingProducts = async (
  limit = 8,
): Promise<LifetimeProductHistory[]> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("product_sales_history_monthly")
    .select("product_id, product_name, quantity_sold, revenue_generated");

  if (error) {
    throw error;
  }

  return Array.from(
    ((data ?? []) as ProductSalesHistoryMonthlyRow[])
      .map(mapLifetimeProductHistory)
      .reduce<Map<string, LifetimeProductHistory>>((accumulator, row) => {
        const key = row.productId ?? row.productName;
        const current = accumulator.get(key) ?? {
          productId: row.productId,
          productName: row.productName,
          quantitySold: 0,
          revenueGenerated: 0,
        };

        current.quantitySold += row.quantitySold;
        current.revenueGenerated += row.revenueGenerated;
        accumulator.set(key, current);
        return accumulator;
      }, new Map())
      .values(),
  )
    .sort((left, right) => {
      if (right.quantitySold !== left.quantitySold) {
        return right.quantitySold - left.quantitySold;
      }

      return right.revenueGenerated - left.revenueGenerated;
    })
    .slice(0, limit);
};
