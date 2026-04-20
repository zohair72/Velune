const LOW_STOCK_THRESHOLD = 5;

export const isLowStock = (stockQuantity: number | null | undefined) =>
  typeof stockQuantity === "number" &&
  stockQuantity > 0 &&
  stockQuantity <= LOW_STOCK_THRESHOLD;

export const isOutOfStock = (stockQuantity: number | null | undefined) =>
  typeof stockQuantity === "number" && stockQuantity <= 0;

export const getLowStockMessage = (
  stockQuantity: number | null | undefined,
  options?: {
    outOfStockLabel?: string;
    lowStockLabel?: (quantity: number) => string;
  },
) => {
  if (isOutOfStock(stockQuantity)) {
    return options?.outOfStockLabel ?? "Out of stock";
  }

  if (typeof stockQuantity === "number" && isLowStock(stockQuantity)) {
    const quantity = stockQuantity;

    return (
      options?.lowStockLabel?.(quantity) ?? `Only ${quantity} left`
    );
  }

  return null;
};

export { LOW_STOCK_THRESHOLD };
