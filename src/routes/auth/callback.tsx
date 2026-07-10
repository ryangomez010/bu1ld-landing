import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LoadingState } from "@/components/member/LoadingState";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      void navigate({ to: "/login" });
      return;
    }

    let active = true;

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      } else {
        const { error: sessionError } = await supabase.auth.getSession();
        if (!active) return;
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
      }

      setSessionReady(true);
    };

    void finish();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!sessionReady || loading) return;
    if (error) {
      void navigate({ to: "/login" });
      return;
    }
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (!profile?.onboarding_completed) {
      void navigate({ to: "/onboarding" });
      return;
    }
    void navigate({ to: "/dashboard" });
  }, [sessionReady, loading, user, profile, error, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
      <LoadingState label={error ? "Sign-in failed" : "Signing you in…"} />
      {error ? <p className="text-sm text-accent-red">{error}</p> : null}
    </div>
  );
}
