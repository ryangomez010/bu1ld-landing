import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/member/LoadingState";
import { validatePassword } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { authCallbackError, authErrorMessage, runAuthRequest } from "@/lib/auth-request";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setChecking(false);
      return;
    }

    let active = true;

    const establishSession = async () => {
      const errorDesc = authCallbackError(window.location.search, window.location.hash);

      if (errorDesc) {
        toast.error(errorDesc);
        setReady(false);
        setChecking(false);
        return;
      }

      const { error: initializationError } = await supabase.auth.initialize();
      if (!active) return;
      if (initializationError) {
        toast.error(initializationError.message);
        setReady(false);
        setChecking(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) toast.error(error.message);
      setReady(!error && !!data.session);
      setChecking(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") setReady(false);
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(!!session);
        setChecking(false);
      }
    });

    void establishSession().catch((error) => {
      if (!active) return;
      toast.error(authErrorMessage(error));
      setReady(false);
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !ready) return;
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    const check = validatePassword(password);
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Account access is temporarily unavailable.");
      return;
    }
    setSubmitting(true);
    const { error } = await runAuthRequest(() => supabase.auth.updateUser({ password }));
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Password updated.");
    void navigate({ to: "/dashboard" });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <LoadingState label="Verifying reset link…" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="New password"
      subtitle="Choose a new password that meets the strength rules below. You can review and sign out other sessions from account security."
    >
      {!ready ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Open the reset link from your email to continue. Links expire after a short time.
          </p>
          <Button
            asChild
            variant="outline"
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            At least 8 characters with a letter and a number.
          </p>
          <Button
            type="submit"
            className="w-full font-mono text-[11px] tracking-[0.2em] uppercase"
            disabled={submitting}
          >
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-accent-blue hover:text-bone transition">
          ← Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
