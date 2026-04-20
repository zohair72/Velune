export const adminOrderStatuses = [
  "New",
  "Awaiting Payment",
  "Payment Received",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export const adminPaymentStatuses = [
  "Pending",
  "COD",
  "Received",
  "Failed",
] as const;

export type AdminOrderStatus = (typeof adminOrderStatuses)[number];
export type AdminPaymentStatus = (typeof adminPaymentStatuses)[number];

export type AdminOrderFilters = {
  query: string;
  orderStatus: string;
  paymentStatus: string;
};

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  paymentProofPath: string | null;
  stockRestored: boolean;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
};

export type AdminOrderStatusUpdate = {
  paymentStatus: string;
  orderStatus: string;
  stockRestored?: boolean;
};
