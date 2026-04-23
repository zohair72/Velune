const ORDER_TRACKING_STORAGE_KEY = "velune:last-order-tracking";

export type SavedOrderTrackingDetails = {
  orderNumber: string;
  phoneNumber: string;
};

export const readSavedOrderTrackingDetails = (): SavedOrderTrackingDetails | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(ORDER_TRACKING_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<SavedOrderTrackingDetails>;

    if (
      typeof parsedValue.orderNumber !== "string" ||
      typeof parsedValue.phoneNumber !== "string"
    ) {
      return null;
    }

    return {
      orderNumber: parsedValue.orderNumber,
      phoneNumber: parsedValue.phoneNumber,
    };
  } catch {
    return null;
  }
};

export const saveOrderTrackingDetails = (details: SavedOrderTrackingDetails) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ORDER_TRACKING_STORAGE_KEY,
    JSON.stringify({
      orderNumber: details.orderNumber.trim(),
      phoneNumber: details.phoneNumber.trim(),
    }),
  );
};
