import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RedirectIfAuthed } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { guardAuthAttempt } from "@/lib/auth-rate-limit";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <RedirectIfAuthed to="/dashboard">
      <ForgotPasswordForm />
    </RedirectIfAuthed>
  );
}

function ForgotPasswordForm() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blocked = guardAuthAttempt("forgot-password", email);
    if (blocked) {
      toast.error(blocked);
      return;
    }
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
    toast.success("Check your email for a reset link.");
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll send a password reset link to your email — the link expires after one use."
    >
      {!configured ? (
        <p className="rounded-sm border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red">
          Supabase is not configured yet.
        </p>
      ) : null}
      {sent ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          If an account exists for <strong className="text-bone">{email}</strong>, you&apos;ll
          receive a reset link shortly.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <Button
            type="submit"
            className="w-full font-mono text-[11px] tracking-[0.2em] uppercase"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send reset link"}
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
