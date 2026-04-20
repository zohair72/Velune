import React from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AdminAccessCard } from "../components/admin/AdminAccessCard";

export const ProtectedRoute = () => {
  const {
    authEmail,
    authError,
    isAuthenticated,
    isAuthorized,
    isLoading,
    signOut,
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <AdminAccessCard
        eyebrow="Admin Access"
        title="Checking Admin Session"
        message="Verifying your Supabase session and approved Velune access."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAuthorized) {
    return (
      <AdminAccessCard
        eyebrow="Admin Access"
        title="Unauthorized Account"
        message={
          authError ? (
            authError
          ) : (
            <>
              {authEmail ? (
                <>
                  <span className="font-medium text-[#1A1817]">{authEmail}</span>{" "}
                  is signed in, but it is not listed in Velune&apos;s approved admin
                  users.
                </>
              ) : (
                "This signed-in account is not approved for Velune admin."
              )}
            </>
          )
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="w-full rounded-xl bg-[#0A3600] px-4 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity hover:opacity-90"
            >
              Sign Out
            </button>
            <Link
              to="/"
              className="block w-full rounded-xl border border-[#d8cab5] px-4 py-3 text-center font-cinzel text-sm uppercase tracking-[0.2em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
            >
              Return to Storefront
            </Link>
          </>
        }
      />
    );
  }

  return <Outlet />;
};
