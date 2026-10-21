import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LoadingState } from "@/components/member/LoadingState";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { authCallbackError, authErrorMessage } from "@/lib/auth-request";
import {
  consumePostAuthRedirect,
  postAuthNavigateTarget,
  rememberPostAuthRedirect,
} from "@/lib/post-auth-redirect";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, profile, loading, profileLoading, profileError, refreshProfile } = useAuth();
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
      const destination = params.get("redirect");
      if (destination) rememberPostAuthRedirect(destination);
      const oauthError = authCallbackError(window.location.search, window.location.hash);

      if (oauthError) {
        setError(oauthError);
        return;
      }

      // This client uses detectSessionInUrl + PKCE. Initialization owns the one-use
      // code exchange; exchanging again consumes an already-used code/verifier.
      const { error: initializationError } = await supabase.auth.initialize();
      if (!active) return;
      if (initializationError) {
        setError(initializationError.message);
        return;
      }
      const { error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      setSessionReady(true);
    };

    void finish().catch((failure) => {
      if (active) setError(authErrorMessage(failure));
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!sessionReady || loading || profileLoading || error || profileError) return;
    if (!user) {
      setError("No sign-in session was returned. Please try signing in again.");
      return;
    }
    if (!profile?.onboarding_completed) {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }
    const target = postAuthNavigateTarget(consumePostAuthRedirect());
    if ("href" in target) window.location.replace(target.href);
    else void navigate({ ...target, replace: true });
  }, [sessionReady, loading, profileLoading, user, profile, profileError, error, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
      {error || profileError ? (
        <>
          <h1 className="font-display text-xl">Sign-in needs attention</h1>
          <p role="alert" className="max-w-md text-center text-sm text-accent-red">
            {error || profileError}
          </p>
          {profileError ? (
            <Button onClick={() => void refreshProfile()} disabled={profileLoading}>
              Retry profile
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </>
      ) : (
        <LoadingState label="Signing you in…" />
      )}
    </div>
  );
}
