import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { fetchProfile } from "@/lib/profile";
import { logSecurityEvent, currentDeviceLabel } from "@/lib/account-security";
import { migrateLegacyNotifications } from "@/lib/notifications";
import { migrateLegacySaved } from "@/lib/saved";
import { isValidEmail, validatePassword } from "@/lib/security";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  emailVerified: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: () => Promise<{ error: string | null }>;
  signOut: (scope?: "local" | "global") => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const next = await fetchProfile(user.id);
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_IN" && nextSession?.user) {
        void logSecurityEvent(nextSession.user.id, "sign_in", {
          device: currentDeviceLabel(),
          user_agent:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : undefined,
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    migrateLegacyNotifications(user.id);
    migrateLegacySaved(user.id);
    void refreshProfile();
  }, [user, refreshProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) return { error: "Enter a valid email address." };
    const pw = validatePassword(password);
    if (!pw.ok) return { error: pw.reason };
    const name = fullName.trim();
    if (name.length < 2) return { error: "Full name must be at least 2 characters." };

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: redirectTo,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) return { error: "Enter a valid email address." };

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    return { error: error?.message ?? null };
  }, []);

  const signInWithOAuth = useCallback(async (provider: "github" | "google") => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    return { error: error?.message ?? null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) return { error: "Enter a valid email address." };

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured." };

    const pw = validatePassword(password);
    if (!pw.ok) return { error: pw.reason };

    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured." };
    if (!user?.email) return { error: "No email on file." };

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: redirectTo },
    });
    return { error: error?.message ?? null };
  }, [user?.email]);

  const signOut = useCallback(async (scope: "local" | "global" = "local") => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut({ scope });
    setProfile(null);
  }, []);

  const emailVerified = Boolean(user?.email_confirmed_at);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      emailVerified,
      signUp,
      signIn,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      resendVerificationEmail,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      emailVerified,
      signUp,
      signIn,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      resendVerificationEmail,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
