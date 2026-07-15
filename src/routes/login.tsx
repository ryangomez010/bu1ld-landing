import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { RedirectIfAuthed } from "@/components/auth/RequireAuth";
import { CtaLink } from "@/components/member/ContentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { guardAuthAttempt } from "@/lib/auth-rate-limit";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Log in — The Bu1ld" }],
  }),
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
    const blocked = guardAuthAttempt("login", email);
    if (blocked) {
      toast.error(blocked);
      return;
    }
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
    <AuthLayout
      title="Log in"
      subtitle="Sign in to your dashboard — track project applications, resume reading paths, manage saved collections, and browse the member directory."
    >
      {!configured ? (
        <p className="rounded-sm border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red">
          Account access is temporarily unavailable. Please try again later.
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
            <CtaLink to="/forgot-password">Forgot?</CtaLink>
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
        <Button type="submit" className="w-full label-sm" disabled={submitting || !configured}>
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
