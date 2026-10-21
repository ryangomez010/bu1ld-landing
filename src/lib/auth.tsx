/* eslint-disable react-refresh/only-export-components -- Auth context intentionally exports provider and hook together. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { fetchProfile } from "@/lib/profile";
import { logSecurityEvent, currentDeviceLabel } from "@/lib/account-security";
import { migrateLegacyNotifications } from "@/lib/notifications";
import { migrateLegacySaved } from "@/lib/saved";
import { isValidEmail, sanitizeAppPath, validatePassword } from "@/lib/security";
import { getSupabase, checkSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { authErrorMessage, runAuthRequest } from "@/lib/auth-request";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  configured: boolean;
  emailVerified: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    redirect?: string,
  ) => Promise<{
    error: string | null;
    requiresEmailConfirmation?: boolean;
  }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: () => Promise<{ error: string | null }>;
  signOut: (scope?: "local" | "global") => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const currentUserId = useRef<string | null>(null);
  const profileRequest = useRef(0);
  const [configured, setConfigured] = useState(() => checkSupabaseConfigured());

  useEffect(() => {
    setConfigured(checkSupabaseConfigured());
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = currentUserId.current;
    const request = ++profileRequest.current;
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const next = await fetchProfile(userId);
      if (request !== profileRequest.current || userId !== currentUserId.current) return;
      setProfile(next);
    } catch (error) {
      if (request !== profileRequest.current || userId !== currentUserId.current) return;
      console.error("[auth] profile fetch failed", error);
      setProfile(null);
      setProfileError("Your profile could not be loaded. Check your connection and try again.");
    } finally {
      if (request === profileRequest.current && userId === currentUserId.current) {
        setProfileLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    let authRevision = 0;
    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      const nextUserId = nextSession?.user.id ?? null;
      if (currentUserId.current !== nextUserId) {
        currentUserId.current = nextUserId;
        profileRequest.current += 1;
        setProfile(null);
        setProfileError(null);
        setProfileLoading(Boolean(nextUserId));
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (authRevision === 0) applySession(data.session);
      })
      .catch(() => {
        if (authRevision === 0) applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authRevision += 1;
      applySession(nextSession);
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
      profileRequest.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    migrateLegacyNotifications(user.id);
    migrateLegacySaved(user.id);
    void refreshProfile();
  }, [user, refreshProfile]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, redirect?: string) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Account access is temporarily unavailable." };
      if (!isValidEmail(email)) return { error: "Enter a valid email address." };
      if (fullName.trim().length < 2) return { error: "Enter a name with at least 2 characters." };
      const pw = validatePassword(password);
      if (!pw.ok) return { error: pw.reason };

      try {
        const destination = sanitizeAppPath(redirect);
        const callbackPath = `/auth/callback${destination ? `?redirect=${encodeURIComponent(destination)}` : ""}`;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}${callbackPath}`
                : undefined,
          },
        });
        return {
          error: error?.message ?? null,
          requiresEmailConfirmation: !error && !data.session,
        };
      } catch (error) {
        return { error: authErrorMessage(error) };
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Account access is temporarily unavailable." };
    return runAuthRequest(() =>
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
    );
  }, []);

  const signInWithOAuth = useCallback(async (provider: "github" | "google") => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Account access is temporarily unavailable." };
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    return runAuthRequest(() =>
      supabase.auth.signInWithOAuth({ provider, options: { redirectTo } }),
    );
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Account access is temporarily unavailable." };
    if (!isValidEmail(email)) return { error: "Enter a valid email address." };
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    return runAuthRequest(() => supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo }));
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Account access is temporarily unavailable." };
    const pw = validatePassword(password);
    if (!pw.ok) return { error: pw.reason };
    return runAuthRequest(() => supabase.auth.updateUser({ password }));
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user?.email) return { error: "No email on file." };
    return runAuthRequest(() => supabase.auth.resend({ type: "signup", email: user.email! }));
  }, [user]);

  const signOut = useCallback(async (scope: "local" | "global" = "local") => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Account access is temporarily unavailable." };
    const result = await runAuthRequest(() => supabase.auth.signOut({ scope }));
    if (!result.error) {
      profileRequest.current += 1;
      currentUserId.current = null;
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      setUser(null);
      setSession(null);
    }
    return result;
  }, []);

  const emailVerified = Boolean(user?.email_confirmed_at);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      profileError,
      configured,
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
      profileLoading,
      profileError,
      configured,
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
