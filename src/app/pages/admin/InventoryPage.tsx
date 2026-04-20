import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Minus, Plus, Search } from "lucide-react";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { SafeImage } from "../../components/ui/SafeImage";
import {
  fetchInventoryProducts,
  filterInventoryProducts,
  isLowStockQuantity,
  isOutOfStockQuantity,
  updateInventoryProductStock,
} from "../../../features/inventory/api";
import type {
  InventoryProductRecord,
  InventoryStatusFilter,
  InventoryStockFilter,
} from "../../../features/inventory/types";

type InventoryNotice = {
  tone: "success" | "error";
  message: string;
} | null;

const stockFilterOptions: Array<{
  value: InventoryStockFilter;
  label: string;
}> = [
  { value: "all", label: "All Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

const statusFilterOptions: Array<{
  value: InventoryStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const getStockToneClass = (stockQuantity: number) => {
  if (isOutOfStockQuantity(stockQuantity)) {
    return "border-[#e6c0b7] bg-[#fbefeb] text-[#8c3b2a]";
  }

  if (isLowStockQuantity(stockQuantity)) {
    return "border-[#e8d2a8] bg-[#fbf2df] text-[#8a6131]";
  }

  return "border-[#b8d3b6] bg-[#edf7ec] text-[#2f5b2d]";
};

const getStockLabel = (stockQuantity: number) => {
  if (isOutOfStockQuantity(stockQuantity)) {
    return "Out of Stock";
  }

  if (isLowStockQuantity(stockQuantity)) {
    return "Low Stock";
  }

  return "In Stock";
};

export const InventoryPage = () => {
  const [products, setProducts] = useState<InventoryProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InventoryStatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<InventoryStockFilter>("all");
  const [draftStockValues, setDraftStockValues] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [rowFeedback, setRowFeedback] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<InventoryNotice>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchInventoryProducts();

        if (!isMounted) {
          return;
        }

        setProducts(data);
        setDraftStockValues(
          Object.fromEntries(data.map((product) => [product.id, String(product.stockQuantity)])),
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune inventory data.", loadError);
        setProducts([]);
        setError("Inventory data could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(
    () =>
      filterInventoryProducts(products, {
        query,
        status: statusFilter,
        stockState: stockFilter,
      }),
    [products, query, statusFilter, stockFilter],
  );

  const inventoryCounts = useMemo(
    () => ({
      total: products.length,
      lowStock: products.filter((product) => isLowStockQuantity(product.stockQuantity))
        .length,
      outOfStock: products.filter((product) =>
        isOutOfStockQuantity(product.stockQuantity),
      ).length,
      active: products.filter((product) => product.isActive).length,
    }),
    [products],
  );

  const setSavingState = (productId: string, isSaving: boolean) => {
    setSavingMap((prev) => ({
      ...prev,
      [productId]: isSaving,
    }));
  };

  const applyProductUpdate = (updatedProduct: InventoryProductRecord) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product,
      ),
    );
    setDraftStockValues((prev) => ({
      ...prev,
      [updatedProduct.id]: String(updatedProduct.stockQuantity),
    }));
  };

  const saveStockQuantity = async (
    product: InventoryProductRecord,
    nextStockQuantity: number,
  ) => {
    if (savingMap[product.id]) {
      return;
    }

    if (!Number.isInteger(nextStockQuantity) || nextStockQuantity < 0) {
      const message = "Stock quantity must be a whole number of zero or greater.";
      setRowFeedback((prev) => ({ ...prev, [product.id]: message }));
      setNotice({ tone: "error", message });
      return;
    }

    setSavingState(product.id, true);
    setRowFeedback((prev) => ({ ...prev, [product.id]: "" }));

    try {
      const updatedProduct = await updateInventoryProductStock(
        product.id,
        nextStockQuantity,
      );

      applyProductUpdate(updatedProduct);
      const successMessage = `${updatedProduct.name} stock saved at ${updatedProduct.stockQuantity}.`;
      setRowFeedback((prev) => ({
        ...prev,
        [product.id]: successMessage,
      }));
      setNotice({ tone: "success", message: successMessage });
    } catch (saveError) {
      console.error("Failed to update Velune product stock.", saveError);
      const failureMessage =
        saveError instanceof Error
          ? saveError.message
          : "Stock could not be updated right now.";
      setRowFeedback((prev) => ({
        ...prev,
        [product.id]: failureMessage,
      }));
      setNotice({ tone: "error", message: failureMessage });
    } finally {
      setSavingState(product.id, false);
    }
  };

  const handleAdjustStock = (
    product: InventoryProductRecord,
    delta: number,
  ) => {
    const nextStockQuantity = product.stockQuantity + delta;

    if (nextStockQuantity < 0) {
      const message = "Stock cannot be reduced below zero.";
      setRowFeedback((prev) => ({ ...prev, [product.id]: message }));
      setNotice({ tone: "error", message });
      return;
    }

    void saveStockQuantity(product, nextStockQuantity);
  };

  const handleExactStockSave = (product: InventoryProductRecord) => {
    const rawValue = draftStockValues[product.id]?.trim() ?? "";

    if (!rawValue) {
      const message = "Enter a stock quantity before saving.";
      setRowFeedback((prev) => ({ ...prev, [product.id]: message }));
      setNotice({ tone: "error", message });
      return;
    }

    if (!/^\d+$/.test(rawValue)) {
      const message = "Stock quantity must be a whole number of zero or greater.";
      setRowFeedback((prev) => ({ ...prev, [product.id]: message }));
      setNotice({ tone: "error", message });
      return;
    }

    void saveStockQuantity(product, Number(rawValue));
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          Inventory
        </p>
        <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
          Manage live product stock
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
          Monitor inventory across the active catalog, catch low-stock blends
          early, and adjust stock directly without opening the full product form.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
          <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
            Total Products
          </p>
          <p className="mt-4 font-cinzel text-4xl text-[#1A1817]">
            {inventoryCounts.total}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
          <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
            Low Stock
          </p>
          <p className="mt-4 font-cinzel text-4xl text-[#8a6131]">
            {inventoryCounts.lowStock}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
          <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
            Out of Stock
          </p>
          <p className="mt-4 font-cinzel text-4xl text-[#8c3b2a]">
            {inventoryCounts.outOfStock}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
          <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
            Active Products
          </p>
          <p className="mt-4 font-cinzel text-4xl text-[#1A1817]">
            {inventoryCounts.active}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_220px_220px]">
          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.16em] text-[#7a6d62]">
              Search by Product or Slug
            </span>
            <div className="flex items-center gap-3 rounded-xl border border-[#d8cab5] bg-[#faf6ef] px-4 py-3">
              <Search size={16} className="text-[#7a6d62]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Bare Vanilla or bare-vanilla"
                className="w-full bg-transparent text-sm text-[#1A1817] outline-none placeholder:text-[#97887a]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.16em] text-[#7a6d62]">
              Stock State
            </span>
            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value as InventoryStockFilter)
              }
              className="w-full rounded-xl border border-[#d8cab5] bg-[#faf6ef] px-4 py-3 text-sm text-[#1A1817] outline-none"
            >
              {stockFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.16em] text-[#7a6d62]">
              Product Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as InventoryStatusFilter)
              }
              className="w-full rounded-xl border border-[#d8cab5] bg-[#faf6ef] px-4 py-3 text-sm text-[#1A1817] outline-none"
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {notice ? (
        <div
          className={`rounded-[1.5rem] border px-5 py-4 text-sm shadow-sm ${
            notice.tone === "success"
              ? "border-[#b8d3b6] bg-white text-[#2f5b2d]"
              : "border-[#e6c0b7] bg-white text-[#8c3b2a]"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#efe4d2] px-6 py-5">
          <div>
            <h2 className="font-cinzel text-xl text-[#1A1817]">Inventory Table</h2>
            <p className="mt-1 text-sm text-[#7a6d62]">
              {isLoading
                ? "Loading inventory..."
                : `${filteredProducts.length} products match the current filters`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-[#7a6d62]">
            Loading live inventory from Supabase...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="px-6 py-12 text-center text-[#9f3c24]">{error}</div>
        ) : null}

        {!isLoading && !error && filteredProducts.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#7a6d62]">
            No products match the current inventory filters.
          </div>
        ) : null}

        {!isLoading && !error && filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#efe4d2]">
              <thead className="bg-[#faf6ef]">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                  <th className="px-6 py-4 font-cinzel">Product</th>
                  <th className="px-6 py-4 font-cinzel">Stock</th>
                  <th className="px-6 py-4 font-cinzel">Status</th>
                  <th className="px-6 py-4 font-cinzel">Adjust</th>
                  <th className="px-6 py-4 font-cinzel">Exact Stock</th>
                  <th className="px-6 py-4 font-cinzel">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e7da]">
                {filteredProducts.map((product) => {
                  const isSaving = Boolean(savingMap[product.id]);

                  return (
                    <tr key={product.id} className="align-top text-sm text-[#3f372f]">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-16 overflow-hidden rounded-xl border border-[#efe4d2] bg-[#faf6ef]">
                            <SafeImage
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              fallbackClassName="h-full w-full text-[10px]"
                              fallbackLabel={product.name}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-cinzel text-sm uppercase tracking-[0.14em] text-[#1A1817]">
                              {product.name}
                            </div>
                            <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[#7a6d62]">
                              /product/{product.slug}
                            </div>
                            {rowFeedback[product.id] ? (
                              <p className="mt-3 max-w-md text-sm text-[#7a6d62]">
                                {rowFeedback[product.id]}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-3">
                          <p className="font-cinzel text-2xl text-[#1A1817]">
                            {product.stockQuantity}
                          </p>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 font-cinzel text-[11px] uppercase tracking-[0.16em] ${getStockToneClass(product.stockQuantity)}`}
                          >
                            {getStockLabel(product.stockQuantity)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge value={product.isActive ? "Active" : "Inactive"} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(product, -1)}
                            disabled={isSaving || product.stockQuantity <= 0}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cab5] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Minus size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(product, 1)}
                            disabled={isSaving}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cab5] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex min-w-[220px] items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={draftStockValues[product.id] ?? String(product.stockQuantity)}
                            onChange={(event) =>
                              setDraftStockValues((prev) => ({
                                ...prev,
                                [product.id]: event.target.value,
                              }))
                            }
                            className="w-24 rounded-xl border border-[#d8cab5] bg-[#faf6ef] px-3 py-2 text-sm text-[#1A1817] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleExactStockSave(product)}
                            disabled={isSaving}
                            className="inline-flex rounded-xl bg-[#0A3600] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#F4EFE6] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
                        >
                          Edit Product
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
};
