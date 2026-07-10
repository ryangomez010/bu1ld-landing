import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { LoadingState } from "@/components/member/LoadingState";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

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
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (profile && !profile.onboarding_completed) {
      void navigate({ to: "/onboarding" });
    }
  }, [user, profile, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (profile && !profile.onboarding_completed) return null;
  return <>{children}</>;
}

export function RedirectIfAuthed({ to, children }: { to: string; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (!profile?.onboarding_completed) {
      void navigate({ to: "/onboarding" });
      return;
    }
    void navigate({ to });
  }, [user, profile, loading, navigate, to]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (user) return null;
  return <>{children}</>;
}
