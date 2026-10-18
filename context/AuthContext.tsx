"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isStaffUser } from "@/lib/auth/roles";

export interface SignUpData {
  firstName: string;
  lastName: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isStaff: boolean;
  role: string | null;
  signInWithEmail: (
    email: string,
    password: string,
    redirectFrom?: string | null
  ) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    data: SignUpData
  ) => Promise<{ error?: string; confirmationSent?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const isStaff = isStaffUser(user);
  const role =
    typeof (user?.app_metadata?.role || user?.user_metadata?.role) === "string"
      ? (user?.app_metadata?.role || user?.user_metadata?.role).toLowerCase()
      : null;

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    async function initAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        console.error("Failed to retrieve auth session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign in with email and password
  const signInWithEmail = useCallback(
    async (email: string, password: string, redirectFrom?: string | null) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Check role directly on authenticated user
      const currentUser = data.user;
      if (isStaffUser(currentUser)) {
        router.push("/menage");
      } else {
        router.push(
          redirectFrom && redirectFrom !== "/login"
            ? redirectFrom
            : "/dashboard"
        );
      }
      router.refresh();
      return {};
    },
    [router, supabase]
  );

  // Sign up with email and password
  const signUpWithEmail = useCallback(
    async (email: string, password: string, data: SignUpData) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { confirmationSent: true };
    },
    [supabase]
  );

  // OAuth Google sign-in
  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch {
      return { error: "Failed to sign in with Google" };
    }
  }, [supabase]);

  // Sign out user
  const signOutUser = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push("/login");
    router.refresh();
  }, [router, supabase]);

  const value = {
    user,
    session,
    isLoading,
    isStaff,
    role,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
