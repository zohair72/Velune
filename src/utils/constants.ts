export const BRAND_TERMS = {
  cart: "Cauldron",
  addToCart: "Add to Cauldron",
  continueShopping: "Continue Brewing",
} as const;

export const APP_ROUTES = {
  home: "/",
  shop: "/shop",
  productDetail: "/product/:slug",
  cauldron: "/cauldron",
  checkout: "/checkout",
  orderConfirmation: "/order-confirmation/:orderNumber",
  trackOrder: "/track-order",
  about: "/about",
  contact: "/contact",
  adminLogin: "/admin/login",
  adminDashboard: "/admin",
  adminOrders: "/admin/orders",
  adminOrderDetail: "/admin/orders/:id",
  adminProducts: "/admin/products",
  adminNewProduct: "/admin/products/new",
  adminEditProduct: "/admin/products/:id/edit",
  adminInventory: "/admin/inventory",
  adminSettings: "/admin/settings",
} as const;
