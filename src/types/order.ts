export type PaymentMethod = "cod" | "manual_payment";

export type PaymentStatus = "Pending" | "COD" | "Received" | "Failed";

export type OrderStatus =
  | "New"
  | "Awaiting Payment"
  | "Payment Received"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus | string;
  orderStatus: OrderStatus | string;
  subtotal: number;
  paymentProofPath: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};
