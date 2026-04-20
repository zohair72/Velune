import type { RouteObject } from "react-router";
import { StorefrontLayout } from "../layout/StorefrontLayout";
import { HomePage } from "../pages/storefront/HomePage";
import { ShopPage } from "../pages/storefront/ShopPage";
import { ProductDetailPage } from "../pages/storefront/ProductDetailPage";
import { CauldronPage } from "../pages/storefront/CauldronPage";
import { CheckoutPage } from "../pages/storefront/CheckoutPage";
import { OrderConfirmationPage } from "../pages/storefront/OrderConfirmationPage";
import { OrderTrackingPage } from "../pages/storefront/OrderTrackingPage";
import { AboutPage } from "../pages/storefront/AboutPage";
import { ContactPage } from "../pages/storefront/ContactPage";
import { NotFoundPage } from "../pages/storefront/NotFoundPage";

export const storefrontRoutes: RouteObject = {
  Component: StorefrontLayout,
  children: [
    { index: true, Component: HomePage },
    { path: "shop", Component: ShopPage },
    { path: "product/:slug", Component: ProductDetailPage },
    { path: "cauldron", Component: CauldronPage },
    { path: "checkout", Component: CheckoutPage },
    {
      path: "order-confirmation/:orderNumber",
      Component: OrderConfirmationPage,
    },
    { path: "track-order", Component: OrderTrackingPage },
    { path: "about", Component: AboutPage },
    { path: "contact", Component: ContactPage },
    { path: "*", Component: NotFoundPage },
  ],
};
