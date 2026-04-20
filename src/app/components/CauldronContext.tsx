import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  imagePath: string | null;
  description: string;
  notes: string[];
  volumeMl: number | null;
  stockQuantity: number | null;
};

export type CartItem = Product & {
  quantity: number;
};

export type CauldronActionResult = {
  ok: boolean;
  message?: string;
};

interface CauldronContextType {
  items: CartItem[];
  addToCauldron: (product: Product) => CauldronActionResult;
  removeFromCauldron: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => CauldronActionResult;
  clearCauldron: () => void;
  totalItems: number;
  subtotal: number;
}

const CauldronContext = createContext<CauldronContextType | undefined>(undefined);
const CAULDRON_STORAGE_KEY = "velune_cauldron";

const getStockLimit = (stockQuantity: number | null | undefined) =>
  typeof stockQuantity === "number" ? stockQuantity : null;

const getOutOfStockMessage = (productName: string) =>
  `${productName} is currently out of stock.`;

const getStockLimitMessage = (productName: string, stockLimit: number | null) =>
  stockLimit === null
    ? `${productName} cannot be added right now.`
    : `Only ${stockLimit} of ${productName} are available right now.`;

const normalizeStoredCartItem = (value: unknown): CartItem | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CartItem>;

  if (
    typeof item.id !== "string" ||
    typeof item.slug !== "string" ||
    typeof item.name !== "string" ||
    typeof item.price !== "number" ||
    typeof item.image !== "string" ||
    !Array.isArray(item.notes) ||
    typeof item.quantity !== "number"
  ) {
    return null;
  }

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image,
    imagePath: typeof item.imagePath === "string" ? item.imagePath : null,
    description: typeof item.description === "string" ? item.description : "",
    notes: item.notes.filter((note): note is string => typeof note === "string"),
    volumeMl: typeof item.volumeMl === "number" ? item.volumeMl : null,
    stockQuantity:
      typeof item.stockQuantity === "number" ? item.stockQuantity : null,
    quantity: item.quantity,
  };
};

const readStoredCauldron = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CAULDRON_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(normalizeStoredCartItem)
      .filter((item): item is CartItem => item !== null);
  } catch (error) {
    console.error("Failed to read the Velune cauldron from local storage.", error);
    return [];
  }
};

export const CauldronProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCauldron());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(CAULDRON_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to store the Velune cauldron in local storage.", error);
    }
  }, [items]);

  const addToCauldron = (product: Product): CauldronActionResult => {
    const stockLimit = getStockLimit(product.stockQuantity);

    if (stockLimit !== null && stockLimit <= 0) {
      return { ok: false, message: getOutOfStockMessage(product.name) };
    }

    let actionResult: CauldronActionResult = { ok: true };

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (!existing) {
        return [...prev, { ...product, quantity: 1 }];
      }

      const nextStockLimit = getStockLimit(product.stockQuantity ?? existing.stockQuantity);

      if (nextStockLimit !== null && existing.quantity >= nextStockLimit) {
        actionResult = {
          ok: false,
          message: getStockLimitMessage(product.name, nextStockLimit),
        };
        return prev.map((item) =>
          item.id === product.id ? { ...item, stockQuantity: nextStockLimit } : item,
        );
      }

      return prev.map((item) =>
        item.id === product.id
          ? {
              ...item,
              ...product,
              stockQuantity: nextStockLimit,
              quantity: item.quantity + 1,
            }
          : item,
      );
    });

    return actionResult;
  };

  const removeFromCauldron = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
  ): CauldronActionResult => {
    if (quantity < 1) {
      removeFromCauldron(productId);
      return { ok: true };
    }

    let actionResult: CauldronActionResult = { ok: true };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        const stockLimit = getStockLimit(item.stockQuantity);

        if (stockLimit !== null && quantity > stockLimit) {
          actionResult = {
            ok: false,
            message: getStockLimitMessage(item.name, stockLimit),
          };
          return item;
        }

        return { ...item, quantity };
      }),
    );

    return actionResult;
  };

  const clearCauldron = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  return (
    <CauldronContext.Provider
      value={{
        items,
        addToCauldron,
        removeFromCauldron,
        updateQuantity,
        clearCauldron,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CauldronContext.Provider>
  );
};

export const useCauldron = () => {
  const context = useContext(CauldronContext);
  if (!context) {
    throw new Error("useCauldron must be used within a CauldronProvider");
  }
  return context;
};
