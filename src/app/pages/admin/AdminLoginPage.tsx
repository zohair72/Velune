import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { AdminAccessCard } from "../../components/admin/AdminAccessCard";
import { useAuth } from "../../../context/AuthContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    authEmail,
    authError,
    isAuthenticated,
    isAuthorized,
    isLoading,
    isSupabaseReady,
    signInWithPassword,
    signOut,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as LocationState | null)?.from?.pathname ?? "/admin";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signInWithPassword(email, password);

    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.error ?? "Unable to sign in.");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <AdminAccessCard
        eyebrow="Admin Access"
        title="Opening Velune Admin"
        message="Checking your Supabase session and approved admin access."
      />
    );
  }

  if (!isSupabaseReady) {
    return (
      <AdminAccessCard
        eyebrow="Admin Access"
        title="Supabase Setup Required"
        message={
          authError ??
          "Supabase browser configuration is missing, so admin sign-in cannot start yet."
        }
      />
    );
  }

  if (isAuthenticated && isAuthorized) {
    return <Navigate to={from} replace />;
  }

  if (isAuthenticated && !isAuthorized) {
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
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="w-full rounded-xl bg-[#0A3600] px-4 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity hover:opacity-90"
          >
            Sign Out
          </button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe6] px-6 py-16 text-[#1A1817]">
      <div className="w-full max-w-lg rounded-[2rem] border border-[#d8cab5] bg-white p-10 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          Admin Access
        </p>
        <h1 className="mt-4 font-cinzel text-4xl">Sign in to Velune Admin</h1>
        <p className="mt-5 text-base leading-7 text-[#5c5046]">
          Use your Supabase admin email and password. Access opens only when the
          signed-in email is also listed in Velune&apos;s approved{" "}
          <code className="rounded bg-[#efe4d2] px-2 py-1 text-sm">admin_users</code>
          {" "}table.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#5c5046]">
              Admin Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@velune.com"
              className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none transition-colors focus:border-[#0A3600]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-cinzel text-xs uppercase tracking-[0.2em] text-[#5c5046]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your admin password"
              className="w-full rounded-xl border border-[#d8cab5] px-4 py-3 outline-none transition-colors focus:border-[#0A3600]"
            />
          </label>

          {error ? <p className="text-sm text-[#9f3c24]">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#0A3600] px-4 py-3 font-cinzel text-sm uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Entering..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#7a6d62]">
          Supabase configured: {isSupabaseReady ? "Yes" : "Not yet"}
        </p>
      </div>
    </div>
  );
};
