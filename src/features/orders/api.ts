import type { CartItem } from "../../app/components/CauldronContext";
import { generateOrderNumber } from "../../utils/orderNumber";
import {
  normalizePakistanPhoneNumber,
  pakistanPhoneValidationMessage,
} from "../../utils/phone";
import { requireSupabase } from "../../utils/supabase";
import type {
  AdminOrderDetail,
  AdminOrderFilters,
  AdminOrderItem,
  AdminOrderStatusUpdate,
  AdminOrderSummary,
} from "./types";

export type CheckoutPaymentMethod = "cod" | "manual_payment";

export type CheckoutCustomerInput = {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: CheckoutPaymentMethod;
};

export type CreateOrderInput = {
  customer: CheckoutCustomerInput;
  items: CartItem[];
  subtotal: number;
};

type OrderNotificationPayload = {
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number;
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  orderStatus: string;
};

export type TrackOrderInput = {
  orderNumber: string;
  phoneNumber: string;
};

export type TrackedOrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type TrackedOrder = {
  orderNumber: string;
  customerName: string;
  city: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  createdAt: string;
  items: TrackedOrderItem[];
};

export class OrderSubmissionError extends Error {
  reason: "stock" | "generic";
  debugMessage?: string;

  constructor(
    message: string,
    reason: "stock" | "generic",
    debugMessage?: string,
  ) {
    super(message);
    this.name = "OrderSubmissionError";
    this.reason = reason;
    this.debugMessage = debugMessage;
  }
}

export class OrderTrackingError extends Error {
  reason: "no_match" | "generic";

  constructor(message: string, reason: "no_match" | "generic") {
    super(message);
    this.name = "OrderTrackingError";
    this.reason = reason;
  }
}

type RpcOrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type CreateOrderRpcArgs = {
  p_order_number: string;
  p_customer_name: string;
  p_phone: string;
  p_email: string;
  p_address: string;
  p_city: string;
  p_notes: string;
  p_payment_method: string;
  p_payment_status: string;
  p_order_status: string;
  p_subtotal: number;
  p_items: RpcOrderItem[];
};

type CreateOrderRpcVariant = {
  label: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
};

type RpcOrderResult =
  | {
      id?: string;
      order_id?: string;
      order_number?: string;
      payment_status?: string;
      order_status?: string;
    }
  | null;

type TrackOrderRpcItem = {
  product_name?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  line_total?: number | string | null;
};

type TrackOrderRpcResult =
  | {
      order_number?: string | null;
      customer_name?: string | null;
      city?: string | null;
      payment_method?: string | null;
      payment_status?: string | null;
      order_status?: string | null;
      subtotal?: number | string | null;
      created_at?: string | null;
      items?: TrackOrderRpcItem[] | null;
    }
  | null;

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number | string;
  payment_proof_path: string | null;
  stock_restored?: boolean | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  created_at?: string;
};

type OrderDetailRow = OrderRow & {
  order_items?: OrderItemRow[] | null;
};

type AdminStatusRpcResult =
  | {
      payment_status?: string;
      order_status?: string;
      stock_restored?: boolean | null;
    }
  | null;

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const toMoney = (value: number | string | null | undefined) =>
  Number(value ?? 0);

const escapeIlike = (value: string) =>
  value.replace(/[%_,]/g, (match) => `\\${match}`);

const getPaymentStatus = (paymentMethod: CheckoutPaymentMethod) =>
  paymentMethod === "cod" ? "COD" : "Pending";

const getOrderStatus = () => "New";

const getLegacyPaymentMethod = (paymentMethod: CheckoutPaymentMethod) =>
  paymentMethod === "cod" ? "cod" : "manual_transfer";

const getLegacyPaymentStatus = (paymentMethod: CheckoutPaymentMethod) =>
  paymentMethod === "cod" ? "not_required" : "pending";

const getLegacyOrderStatus = () => "new";

const getDisplayPaymentMethod = (paymentMethod: CheckoutPaymentMethod) =>
  paymentMethod === "cod" ? "Cash on Delivery" : "Manual Payment";

const buildOrderNotificationPayload = (
  input: CreateOrderInput,
  order: CreatedOrder,
): OrderNotificationPayload => ({
  order_number: order.orderNumber,
  customer_name: input.customer.fullName.trim(),
  phone: input.customer.phoneNumber.trim(),
  city: input.customer.city.trim(),
  payment_method: getDisplayPaymentMethod(input.customer.paymentMethod),
  payment_status: order.paymentStatus,
  order_status: order.orderStatus,
  subtotal: roundCurrency(input.subtotal),
});

const getOrderNotificationDebugSummary = (
  payload: OrderNotificationPayload,
): Record<string, string | number> => ({
  functionName: "notify-order-email",
  orderNumber: payload.order_number,
  customerName: payload.customer_name,
  phone: payload.phone,
  city: payload.city,
  paymentMethod: payload.payment_method,
  paymentStatus: payload.payment_status,
  orderStatus: payload.order_status,
  subtotal: payload.subtotal,
});

const sendOrderNotificationEmail = async (
  input: CreateOrderInput,
  order: CreatedOrder,
): Promise<void> => {
  const supabase = requireSupabase();
  const payload = buildOrderNotificationPayload(input, order);
  const debugSummary = getOrderNotificationDebugSummary(payload);

  console.info(
    "[Velune Debug] Starting notify-order-email function call after order success.",
    debugSummary,
  );

  const { data, error } = await supabase.functions.invoke("notify-order-email", {
    body: payload,
  });

  if (error) {
    console.error(
      "[Velune Debug] notify-order-email function call failed.",
      {
        ...debugSummary,
        error,
        message: error instanceof Error ? error.message : String(error),
      },
    );
    throw error;
  }

  console.info(
    "[Velune Debug] notify-order-email function call succeeded.",
    {
      ...debugSummary,
      response: data,
    },
  );
};

const isStockSubmissionError = (message: string) =>
  /stock|out of stock|insufficient|not enough|only .* available/i.test(message);

const isLegacyEnumMismatchError = (message: string) =>
  /invalid input value for enum|check constraint|manual_transfer|not_required|payment_method|payment_status|order_status/i.test(
    message,
  );

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const databaseError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
    };

    const parts = [
      typeof databaseError.message === "string" ? databaseError.message : "",
      typeof databaseError.details === "string" ? databaseError.details : "",
      typeof databaseError.hint === "string" ? `Hint: ${databaseError.hint}` : "",
      typeof databaseError.error_description === "string"
        ? databaseError.error_description
        : "",
      typeof databaseError.code === "string" ? `Code: ${databaseError.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" | ");
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "The order could not be created.";
    }
  }

  return "The order could not be created.";
};

const normalizeOrderSubmissionError = (error: unknown) => {
  const message = getErrorMessage(error);

  if (isStockSubmissionError(message)) {
    return new OrderSubmissionError(
      "One or more brews no longer have enough stock. Your Cauldron is still intact, so please adjust the quantities and try again.",
      "stock",
      message,
    );
  }

  return new OrderSubmissionError(message, "generic", message);
};

const isOrderTrackingNoMatchError = (message: string) =>
  /not found|no order|no match|no rows/i.test(message);

const orderTrackingNoMatchMessage =
  "We couldn't find an order with that order number and phone combination.";

const normalizeOrderTrackingError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "We could not look up that order right now.";

  if (isOrderTrackingNoMatchError(message)) {
    return new OrderTrackingError(orderTrackingNoMatchMessage, "no_match");
  }

  return new OrderTrackingError(message, "generic");
};

const buildOrderItemsPayload = (items: CartItem[]): RpcOrderItem[] =>
  items.map((item) => ({
    product_id: item.id,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: roundCurrency(item.price),
    line_total: roundCurrency(item.price * item.quantity),
  }));

const buildCreateOrderRpcArgs = (
  input: CreateOrderInput,
  orderNumber: string,
  variant: CreateOrderRpcVariant,
): CreateOrderRpcArgs => {
  const rawPhoneNumber = input.customer.phoneNumber.trim();
  const normalizedPhoneNumber = normalizePakistanPhoneNumber(
    input.customer.phoneNumber,
  );

  if (!normalizedPhoneNumber) {
    throw new OrderSubmissionError(pakistanPhoneValidationMessage, "generic");
  }

  return {
    p_order_number: orderNumber,
    p_customer_name: input.customer.fullName.trim(),
    p_phone: rawPhoneNumber,
    p_email: input.customer.email.trim(),
    p_address: input.customer.address.trim(),
    p_city: input.customer.city.trim(),
    p_notes: input.customer.notes.trim(),
    p_payment_method: variant.paymentMethod,
    p_payment_status: variant.paymentStatus,
    p_order_status: variant.orderStatus,
    p_subtotal: roundCurrency(input.subtotal),
    p_items: buildOrderItemsPayload(input.items),
  };
};

const buildCreateOrderRpcVariants = (
  paymentMethod: CheckoutPaymentMethod,
): CreateOrderRpcVariant[] => {
  const currentPaymentMethod = paymentMethod;
  const currentPaymentStatus = getPaymentStatus(paymentMethod);
  const currentOrderStatus = getOrderStatus();
  const legacyPaymentMethod = getLegacyPaymentMethod(paymentMethod);
  const legacyPaymentStatus = getLegacyPaymentStatus(paymentMethod);
  const legacyOrderStatus = getLegacyOrderStatus();
  const displayPaymentMethod = getDisplayPaymentMethod(paymentMethod);

  const variants: CreateOrderRpcVariant[] = [
    {
      label: "current",
      paymentMethod: currentPaymentMethod,
      paymentStatus: currentPaymentStatus,
      orderStatus: currentOrderStatus,
    },
    {
      label: "display-method current-status current-order",
      paymentMethod: displayPaymentMethod,
      paymentStatus: currentPaymentStatus,
      orderStatus: currentOrderStatus,
    },
    {
      label: "display-method legacy-status current-order",
      paymentMethod: displayPaymentMethod,
      paymentStatus: legacyPaymentStatus,
      orderStatus: currentOrderStatus,
    },
    {
      label: "current-method legacy-status current-order",
      paymentMethod: currentPaymentMethod,
      paymentStatus: legacyPaymentStatus,
      orderStatus: currentOrderStatus,
    },
    {
      label: "legacy-method legacy-status current-order",
      paymentMethod: legacyPaymentMethod,
      paymentStatus: legacyPaymentStatus,
      orderStatus: currentOrderStatus,
    },
    {
      label: "display-method legacy-status legacy-order",
      paymentMethod: displayPaymentMethod,
      paymentStatus: legacyPaymentStatus,
      orderStatus: legacyOrderStatus,
    },
    {
      label: "legacy-all",
      paymentMethod: legacyPaymentMethod,
      paymentStatus: legacyPaymentStatus,
      orderStatus: legacyOrderStatus,
    },
  ];

  const seenKeys = new Set<string>();

  return variants.filter((variant) => {
    const key = `${variant.paymentMethod}|${variant.paymentStatus}|${variant.orderStatus}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
};

const normalizeRpcResult = (
  data: RpcOrderResult | RpcOrderResult[] | string | null,
  fallbackOrderNumber: string,
  fallbackPaymentStatus: string,
  fallbackOrderStatus: string,
): CreatedOrder => {
  const payload =
    Array.isArray(data) ? (data[0] ?? null) : typeof data === "object" ? data : null;

  return {
    id:
      (payload?.id && String(payload.id)) ||
      (payload?.order_id && String(payload.order_id)) ||
      fallbackOrderNumber,
    orderNumber:
      (payload?.order_number && String(payload.order_number)) || fallbackOrderNumber,
    paymentStatus:
      (payload?.payment_status && String(payload.payment_status)) ||
      fallbackPaymentStatus,
    orderStatus:
      (payload?.order_status && String(payload.order_status)) || fallbackOrderStatus,
  };
};

const mapOrderItemRow = (row: OrderItemRow): AdminOrderItem => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name ?? "Velune Blend",
  quantity: row.quantity,
  unitPrice: toMoney(row.unit_price),
  lineTotal: toMoney(row.line_total),
});

const mapTrackedOrderItem = (item: TrackOrderRpcItem): TrackedOrderItem => ({
  productName: item.product_name?.trim() || "Velune Blend",
  quantity: Number(item.quantity ?? 0),
  unitPrice: toMoney(item.unit_price),
  lineTotal: toMoney(item.line_total),
});

const mapOrderSummaryRow = (row: OrderRow): AdminOrderSummary => ({
  id: row.id,
  orderNumber: row.order_number,
  customerName: row.customer_name,
  phone: row.phone,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  orderStatus: row.order_status,
  subtotal: toMoney(row.subtotal),
  createdAt: row.created_at,
});

const mapOrderDetailRow = (row: OrderDetailRow): AdminOrderDetail => ({
  id: row.id,
  orderNumber: row.order_number,
  customerName: row.customer_name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  city: row.city,
  notes: row.notes,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  orderStatus: row.order_status,
  subtotal: toMoney(row.subtotal),
  paymentProofPath: row.payment_proof_path,
  stockRestored: Boolean(row.stock_restored),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: (row.order_items ?? []).map(mapOrderItemRow),
});

const normalizeAdminStatusResult = (
  data: AdminStatusRpcResult | AdminStatusRpcResult[] | null,
  fallback: AdminOrderStatusUpdate,
): AdminOrderStatusUpdate => {
  const payload = Array.isArray(data) ? (data[0] ?? null) : data;

  return {
    paymentStatus:
      (payload?.payment_status && String(payload.payment_status)) ||
      fallback.paymentStatus,
    orderStatus:
      (payload?.order_status && String(payload.order_status)) || fallback.orderStatus,
    stockRestored:
      typeof payload?.stock_restored === "boolean"
        ? payload.stock_restored
        : fallback.stockRestored,
  };
};

export const submitOrder = async (input: CreateOrderInput): Promise<CreatedOrder> => {
  if (input.items.length === 0) {
    throw new Error("The Cauldron is empty.");
  }

  const supabase = requireSupabase();
  const orderNumber = generateOrderNumber();
  const paymentStatus = getPaymentStatus(input.customer.paymentMethod);
  const orderStatus = getOrderStatus();
  const variants = buildCreateOrderRpcVariants(input.customer.paymentMethod);
  const attemptErrors: string[] = [];

  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    const rpcArgs = buildCreateOrderRpcArgs(input, orderNumber, variant);

    console.info("Velune checkout RPC payload", {
      variant: variant.label,
      payload: rpcArgs,
    });

    const attempt = await supabase.rpc("create_order_with_items", rpcArgs);

    if (!attempt.error) {
      if (index > 0) {
        console.warn("Velune checkout RPC succeeded after compatibility retry.", {
          variant: variant.label,
        });
      }

      const createdOrder = normalizeRpcResult(
        attempt.data as RpcOrderResult | RpcOrderResult[] | string | null,
        orderNumber,
        paymentStatus,
        orderStatus,
      );

      console.info(
        "[Velune Debug] Order creation succeeded. notify-order-email will now be invoked.",
        {
          orderNumber: createdOrder.orderNumber,
          paymentStatus: createdOrder.paymentStatus,
          orderStatus: createdOrder.orderStatus,
        },
      );

      void sendOrderNotificationEmail(input, createdOrder).catch((error) => {
        console.warn(
          "[Velune Debug] Order completed successfully, but notify-order-email failed.",
          {
            orderNumber: createdOrder.orderNumber,
            error,
            message: error instanceof Error ? error.message : String(error),
          },
        );
      });

      return createdOrder;
    }

    const errorMessage = getErrorMessage(attempt.error);
    attemptErrors.push(`${variant.label}: ${errorMessage}`);

    console.error("Velune checkout RPC failed.", {
      variant: variant.label,
      payload: rpcArgs,
      error: attempt.error,
    });

    if (!isLegacyEnumMismatchError(errorMessage) || index === variants.length - 1) {
      const combinedMessage =
        attemptErrors.length > 1 ? attemptErrors.join(" | ") : errorMessage;
      throw normalizeOrderSubmissionError(combinedMessage);
    }
  }

  throw normalizeOrderSubmissionError("The order could not be created.");
};

export const trackOrderByNumberAndPhone = async (
  input: TrackOrderInput,
): Promise<TrackedOrder> => {
  const orderNumber = input.orderNumber.trim();
  const phoneNumber = normalizePakistanPhoneNumber(input.phoneNumber);

  if (!orderNumber || !phoneNumber) {
    throw new OrderTrackingError(
      !orderNumber
        ? "Enter both your order number and phone number to track your order."
        : pakistanPhoneValidationMessage,
      "generic",
    );
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("track_order_by_number_and_phone", {
    p_order_number: orderNumber,
    p_phone: phoneNumber,
  });

  if (error) {
    throw normalizeOrderTrackingError(error);
  }

  const payload =
    Array.isArray(data)
      ? ((data[0] ?? null) as TrackOrderRpcResult)
      : ((data ?? null) as TrackOrderRpcResult);

  if (!payload?.order_number) {
    throw new OrderTrackingError(orderTrackingNoMatchMessage, "no_match");
  }

  return {
    orderNumber: String(payload.order_number),
    customerName: payload.customer_name?.trim() || "Velune Customer",
    city: payload.city?.trim() || "Not provided",
    paymentMethod: payload.payment_method?.trim() || "Not provided",
    paymentStatus: payload.payment_status?.trim() || "Pending",
    orderStatus: payload.order_status?.trim() || "New",
    subtotal: toMoney(payload.subtotal),
    createdAt: payload.created_at ?? new Date().toISOString(),
    items: (payload.items ?? []).map(mapTrackedOrderItem),
  };
};

export const fetchAdminOrders = async (
  filters: AdminOrderFilters,
): Promise<AdminOrderSummary[]> => {
  const supabase = requireSupabase();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, phone, payment_method, payment_status, order_status, subtotal, created_at",
    )
    .order("created_at", { ascending: false });

  const normalizedQuery = filters.query.trim();

  if (normalizedQuery) {
    const escaped = escapeIlike(normalizedQuery);
    query = query.or(
      `order_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    );
  }

  if (filters.orderStatus) {
    query = query.eq("order_status", filters.orderStatus);
  }

  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as OrderRow[]).map(mapOrderSummaryRow);
};

export const fetchAdminOrderById = async (
  orderId: string,
): Promise<AdminOrderDetail | null> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      customer_name,
      phone,
      email,
      address,
      city,
      notes,
      payment_method,
      payment_status,
      order_status,
      subtotal,
      payment_proof_path,
      stock_restored,
      created_at,
      updated_at,
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        line_total,
        created_at
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapOrderDetailRow(data as OrderDetailRow);
};

export const updateAdminOrderStatuses = async (
  orderId: string,
  updates: AdminOrderStatusUpdate,
): Promise<AdminOrderStatusUpdate> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("admin_update_order_statuses", {
    p_order_id: orderId,
    p_payment_status: updates.paymentStatus,
    p_order_status: updates.orderStatus,
  });

  if (error) {
    throw error;
  }

  return normalizeAdminStatusResult(
    data as AdminStatusRpcResult | AdminStatusRpcResult[] | null,
    updates,
  );
};

export const getAdminPaymentProofSignedUrl = async (
  paymentProofPath: string,
): Promise<string> => {
  const normalizedPath = paymentProofPath.trim();

  if (!normalizedPath) {
    throw new Error("Payment proof path is missing.");
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(normalizedPath, 60 * 10);

  if (error) {
    throw error;
  }

  return data.signedUrl;
};
