import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { RedirectIfAuthed } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <RedirectIfAuthed to="/dashboard">
      <LoginForm />
    </RedirectIfAuthed>
  );
}

function LoginForm() {
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back.");
    void navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout title="Log in" subtitle="Access your member dashboard, projects, and profile.">
      {!configured ? (
        <p className="rounded-sm border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red">
          Supabase is not configured yet. Copy{" "}
          <code className="font-mono text-xs">.env.example</code> to{" "}
          <code className="font-mono text-xs">.env</code> and add your project keys.
        </p>
      ) : null}
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone transition"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background/50"
          />
        </div>
        <Button
          type="submit"
          className="w-full font-mono text-[11px] tracking-[0.2em] uppercase"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <OAuthButtons />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/signup" className="text-accent-blue hover:text-bone transition">
          Become a member
        </Link>
      </p>
    </AuthLayout>
  );
}
