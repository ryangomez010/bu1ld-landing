import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { InlineEmpty } from "@/components/member/ContentCard";
import { LoadingState } from "@/components/member/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { postAuthNavigateTarget, rememberPostAuthRedirect } from "@/lib/post-auth-redirect";
import { sanitizeAppPath } from "@/lib/security";

function useLoginRedirectPath(): string {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const initialPath = useRef(
    sanitizeAppPath(`${pathname}${search}${hash ? `#${hash}` : ""}`) ?? "/dashboard",
  );
  return initialPath.current;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const redirectPath = useLoginRedirectPath();

  useEffect(() => {
    if (!loading && !user) {
      rememberPostAuthRedirect(redirectPath);
      void navigate({ to: "/login", search: { redirect: redirectPath }, replace: true });
    }
  }, [user, loading, navigate, redirectPath]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}

/** Require auth + completed onboarding for member portal routes. */
export function RequireMember({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading, profileError, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const redirectPath = useLoginRedirectPath();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      rememberPostAuthRedirect(redirectPath);
      void navigate({ to: "/login", search: { redirect: redirectPath }, replace: true });
      return;
    }
    if (!profileError && !profile?.onboarding_completed) {
      rememberPostAuthRedirect(redirectPath);
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [user, profile, loading, profileLoading, profileError, navigate, redirectPath]);

  if (loading || profileLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <InlineEmpty
          title="Could not load your profile"
          body="Check your connection and try again. If this keeps happening, sign out and back in."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => void refreshProfile()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!profile.onboarding_completed) return null;
  return <>{children}</>;
}

export function RedirectIfAuthed({ to, children }: { to: string; children: React.ReactNode }) {
  const { user, profile, loading, profileLoading, profileError, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || profileLoading || profileError || !user) return;
    if (!profile?.onboarding_completed) {
      rememberPostAuthRedirect(to);
      void navigate({ to: "/onboarding" });
      return;
    }
    const target = postAuthNavigateTarget(to);
    if ("href" in target) window.location.assign(target.href);
    else void navigate(target);
  }, [user, profile, loading, profileLoading, profileError, navigate, to]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (user && profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <InlineEmpty
          title="Could not load your profile"
          body={profileError}
          action={
            <Button variant="outline" onClick={() => void refreshProfile()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }
  if (user) return null;
  return <>{children}</>;
}
