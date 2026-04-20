import React, { useEffect, useMemo, useState } from "react";
import { formatRupees } from "../../../utils/currency";
import {
  fetchHistoryPeriods,
  fetchMonthlyHistoryData,
} from "../../../features/history/api";
import type {
  HistoryPeriod,
  MonthlyHistoryData,
} from "../../../features/history/types";

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

const getMonthLabel = (month: number) =>
  monthOptions.find((option) => option.value === month)?.label ?? `Month ${month}`;

const samePeriod = (left: HistoryPeriod, right: HistoryPeriod) =>
  left.year === right.year && left.month === right.month;

export const HistoryPage = () => {
  const [periods, setPeriods] = useState<HistoryPeriod[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [historyData, setHistoryData] = useState<MonthlyHistoryData | null>(null);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPeriods = async () => {
      setIsLoadingPeriods(true);
      setError(null);

      try {
        const data = await fetchHistoryPeriods();

        if (!isMounted) {
          return;
        }

        setPeriods(data);

        if (data.length > 0) {
          setSelectedYear(String(data[0].year));
          setSelectedMonth(String(data[0].month));
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune history periods.", loadError);
        setPeriods([]);
        setError("History periods could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoadingPeriods(false);
        }
      }
    };

    void loadPeriods();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPeriod = useMemo(() => {
    const year = Number(selectedYear);
    const month = Number(selectedMonth);

    if (!year || !month) {
      return null;
    }

    return { year, month };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (!selectedPeriod) {
        setHistoryData(null);
        return;
      }

      setIsLoadingHistory(true);
      setError(null);

      try {
        const data = await fetchMonthlyHistoryData(selectedPeriod);

        if (!isMounted) {
          return;
        }

        setHistoryData(data);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune monthly history.", loadError);
        setHistoryData(null);
        setError("History data could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod]);

  const availableYears = useMemo(
    () => Array.from(new Set(periods.map((period) => period.year))),
    [periods],
  );

  const availableMonths = useMemo(() => {
    const year = Number(selectedYear);

    if (!year) {
      return monthOptions;
    }

    return monthOptions.filter((option) =>
      periods.some((period) => period.year === year && period.month === option.value),
    );
  }, [periods, selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMonth) {
      return;
    }

    const year = Number(selectedYear);
    const month = Number(selectedMonth);

    if (
      periods.length > 0 &&
      !periods.some((period) => samePeriod(period, { year, month }))
    ) {
      const fallback = periods.find((period) => period.year === year) ?? periods[0];

      if (fallback) {
        setSelectedYear(String(fallback.year));
        setSelectedMonth(String(fallback.month));
      }
    }
  }, [periods, selectedMonth, selectedYear]);

  const hasHistoryData =
    Boolean(historyData?.summary) || Boolean(historyData && historyData.products.length > 0);

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          History
        </p>
        <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
          Monthly sales history
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
          Review aggregate-only sales history by month without depending on old
          order records staying in the live orders table.
        </p>
      </div>

      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[220px_220px]">
          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]">
              Year
            </span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              disabled={isLoadingPeriods || periods.length === 0}
              className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
            >
              {availableYears.length === 0 ? (
                <option value="">No years available</option>
              ) : null}
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.18em] text-[#5c5046]">
              Month
            </span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              disabled={isLoadingPeriods || periods.length === 0}
              className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none"
            >
              {availableMonths.length === 0 ? (
                <option value="">No months available</option>
              ) : null}
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoadingPeriods || isLoadingHistory ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          Loading the Velune history ledger...
        </div>
      ) : null}

      {!isLoadingPeriods && !isLoadingHistory && error ? (
        <div className="rounded-[2rem] border border-[#e6c0b7] bg-white px-6 py-12 text-center text-[#9f3c24] shadow-sm">
          {error}
        </div>
      ) : null}

      {!isLoadingPeriods && !isLoadingHistory && !error && periods.length === 0 ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          No monthly history has been recorded yet.
        </div>
      ) : null}

      {!isLoadingPeriods &&
      !isLoadingHistory &&
      !error &&
      periods.length > 0 &&
      !hasHistoryData ? (
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white px-6 py-12 text-center text-[#7a6d62] shadow-sm">
          No history data exists for {getMonthLabel(Number(selectedMonth))} {selectedYear}.
        </div>
      ) : null}

      {!isLoadingPeriods &&
      !isLoadingHistory &&
      !error &&
      historyData?.summary ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
              <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                Total Revenue
              </p>
              <p className="mt-4 font-cinzel text-4xl text-[#1A1817]">
                {formatRupees(historyData.summary.totalRevenue)}
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
              <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                Delivered Orders
              </p>
              <p className="mt-4 font-cinzel text-4xl text-[#1A1817]">
                {historyData.summary.totalDeliveredOrders}
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
              <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                Total Items Sold
              </p>
              <p className="mt-4 font-cinzel text-4xl text-[#1A1817]">
                {historyData.summary.totalItemsSold}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
            <div className="border-b border-[#efe4d2] px-6 py-5">
              <h2 className="font-cinzel text-xl text-[#1A1817]">
                Product breakdown
              </h2>
              <p className="mt-1 text-sm text-[#7a6d62]">
                Revenue and quantity totals for {getMonthLabel(historyData.summary.month)}{" "}
                {historyData.summary.year}.
              </p>
            </div>

            {historyData.products.length === 0 ? (
              <div className="px-6 py-12 text-center text-[#7a6d62]">
                No product-level sales history exists for this month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#efe4d2]">
                  <thead className="bg-[#faf6ef]">
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                      <th className="px-6 py-4 font-cinzel">Product</th>
                      <th className="px-6 py-4 font-cinzel">Quantity Sold</th>
                      <th className="px-6 py-4 font-cinzel">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e7da]">
                    {historyData.products.map((product) => (
                      <tr
                        key={`${historyData.summary?.year}-${historyData.summary?.month}-${product.productName}`}
                        className="align-top text-sm text-[#3f372f]"
                      >
                        <td className="px-6 py-5 font-medium text-[#1A1817]">
                          {product.productName}
                        </td>
                        <td className="px-6 py-5">{product.quantitySold}</td>
                        <td className="px-6 py-5">
                          {formatRupees(product.revenueGenerated)}
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
