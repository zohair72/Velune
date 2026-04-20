import { createBrowserRouter } from "react-router";
import { RootLayout } from "../layout/RootLayout";
import { storefrontRoutes } from "./storefront.routes";
import { adminRoutes } from "./admin.routes";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [storefrontRoutes, ...adminRoutes],
  },
]);
