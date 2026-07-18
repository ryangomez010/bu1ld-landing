import { useEffect } from "react";
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
  return sanitizeAppPath(`${pathname}${search}`) ?? "/dashboard";
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const redirectPath = useLoginRedirectPath();

  useEffect(() => {
    if (!loading && !user) {
      rememberPostAuthRedirect(redirectPath);
      void navigate({ to: "/login", search: { redirect: redirectPath } });
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
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const redirectPath = useLoginRedirectPath();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      rememberPostAuthRedirect(redirectPath);
      void navigate({ to: "/login", search: { redirect: redirectPath } });
      return;
    }
    if (profile && !profile.onboarding_completed) {
      rememberPostAuthRedirect(redirectPath);
      void navigate({ to: "/onboarding" });
    }
  }, [user, profile, loading, profileLoading, navigate, redirectPath]);

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
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || profileLoading || !user) return;
    if (!profile?.onboarding_completed) {
      rememberPostAuthRedirect(to);
      void navigate({ to: "/onboarding" });
      return;
    }
    void navigate(postAuthNavigateTarget(to));
  }, [user, profile, loading, profileLoading, navigate, to]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (user) return null;
  return <>{children}</>;
}
