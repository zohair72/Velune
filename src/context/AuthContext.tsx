import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { AdminUser } from "../types/admin";
import {
  fetchApprovedAdminUser,
  getSupabaseAuthErrorMessage,
  getSupabaseAuthSetupMessage,
  isSupabaseAuthReady,
  normalizeAdminEmail,
} from "../lib/supabase/auth";
import { requireSupabase } from "../utils/supabase";

type SignInResult = {
  ok: boolean;
  error?: string;
};

type AuthContextValue = {
  user: AdminUser | null;
  authEmail: string | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  isSupabaseReady: boolean;
  authError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabaseReady = isSupabaseAuthReady();

  useEffect(() => {
    if (!supabaseReady) {
      setSession(null);
      setUser(null);
      setAuthError(getSupabaseAuthSetupMessage());
      setIsLoading(false);
      return;
    }

    const supabase = requireSupabase();
    let isMounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      if (!nextSession?.user) {
        setUser(null);
        setAuthError(null);
        setIsLoading(false);
        return;
      }

      const normalizedEmail = normalizeAdminEmail(nextSession.user.email);

      if (!normalizedEmail) {
        setUser(null);
        setAuthError("This Supabase account does not have a usable admin email.");
        setIsLoading(false);
        return;
      }

      try {
        const approvedAdmin = await fetchApprovedAdminUser(normalizedEmail);

        if (!isMounted) {
          return;
        }

        setUser(approvedAdmin);
        setAuthError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setAuthError(
          "We could not verify this admin account against Velune's approved users.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const bootstrap = async () => {
      setIsLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        setUser(null);
        setAuthError(getSupabaseAuthErrorMessage(error));
        setIsLoading(false);
        return;
      }

      await syncSession(data.session);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);
      void syncSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseReady]);

  const signInWithPassword = async (
    email: string,
    password: string,
  ): Promise<SignInResult> => {
    const normalizedEmail = normalizeAdminEmail(email);

    if (!normalizedEmail) {
      return { ok: false, error: "Enter your admin email to continue." };
    }

    if (!password.trim()) {
      return { ok: false, error: "Enter your admin password to continue." };
    }

    if (!supabaseReady) {
      return { ok: false, error: getSupabaseAuthSetupMessage() };
    }

    try {
      const supabase = requireSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { ok: false, error: getSupabaseAuthErrorMessage(error) };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: getSupabaseAuthErrorMessage(
          error instanceof Error ? error : "Unable to sign in right now.",
        ),
      };
    }
  };

  const signOut = async () => {
    if (!supabaseReady) {
      setSession(null);
      setUser(null);
      setAuthError(null);
      return;
    }

    try {
      const supabase = requireSupabase();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Failed to sign out of Velune admin.", error);
      }
    } finally {
      setSession(null);
      setUser(null);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authEmail: user?.email ?? normalizeAdminEmail(session?.user.email),
      isAuthenticated: Boolean(session?.user),
      isAuthorized: Boolean(user),
      isLoading,
      isSupabaseReady: supabaseReady,
      authError,
      signInWithPassword,
      signOut,
    }),
    [authError, isLoading, session, supabaseReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
