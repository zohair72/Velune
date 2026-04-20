import React from "react";
import { Link, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

const adminLinks = [
  { label: "Dashboard", to: "/admin" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Products", to: "/admin/products" },
  { label: "Inventory", to: "/admin/inventory" },
  { label: "History", to: "/admin/history" },
  { label: "Settings", to: "/admin/settings" },
];

export const AdminLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#1A1817]">
      <header className="border-b border-[#d8cab5] bg-[#efe4d2]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/admin"
              className="font-cinzel text-2xl tracking-[0.2em] text-[#0A3600]"
            >
              Velune Admin
            </Link>
            <p className="mt-1 text-sm text-[#5c5046]">
              Operational tools for products, orders, inventory, and payments.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-[#5c5046]">
            <span>{user?.email}</span>
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="rounded border border-[#1A1817] px-3 py-2 font-cinzel text-xs uppercase tracking-[0.2em] transition-colors hover:bg-[#1A1817] hover:text-[#F4EFE6]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#d8cab5] bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block rounded-xl px-4 py-3 font-cinzel text-sm tracking-[0.14em] text-[#1A1817] transition-colors hover:bg-[#0A3600] hover:text-[#F4EFE6]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
