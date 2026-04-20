import type { RouteObject } from "react-router";
import { AdminLayout } from "../layout/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { DashboardPage } from "../pages/admin/DashboardPage";
import { OrdersPage } from "../pages/admin/OrdersPage";
import { OrderDetailPage } from "../pages/admin/OrderDetailPage";
import { ProductsPage } from "../pages/admin/ProductsPage";
import { NewProductPage } from "../pages/admin/NewProductPage";
import { EditProductPage } from "../pages/admin/EditProductPage";
import { InventoryPage } from "../pages/admin/InventoryPage";
import { HistoryPage } from "../pages/admin/HistoryPage";
import { SettingsPage } from "../pages/admin/SettingsPage";

export const adminRoutes: RouteObject[] = [
  { path: "admin/login", Component: AdminLoginPage },
  {
    path: "admin",
    Component: ProtectedRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: "orders", Component: OrdersPage },
          { path: "orders/:id", Component: OrderDetailPage },
          { path: "products", Component: ProductsPage },
          { path: "products/new", Component: NewProductPage },
          { path: "products/:id/edit", Component: EditProductPage },
          { path: "inventory", Component: InventoryPage },
          { path: "history", Component: HistoryPage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
];
