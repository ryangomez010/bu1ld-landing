import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { RedirectIfAuthed } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { guardAuthAttempt } from "@/lib/auth-rate-limit";
import { postAuthDestination, rememberPostAuthRedirect } from "@/lib/post-auth-redirect";
import { sanitizeAppPath } from "@/lib/security";
import { privatePageHead } from "@/lib/seo";

const signupSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: (search) => signupSearchSchema.parse(search),
  component: SignupPage,
  head: () => privatePageHead("Become a member — The Bu1ld"),
});

function SignupPage() {
  const { redirect } = Route.useSearch();
  const destination = postAuthDestination(redirect);
  return (
    <RedirectIfAuthed to={destination}>
      <SignupForm />
    </RedirectIfAuthed>
  );
}

function SignupForm() {
  const { redirect } = Route.useSearch();
  const { signUp, configured } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    rememberPostAuthRedirect(redirect);
  }, [redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blocked = guardAuthAttempt("signup", email);
    if (blocked) {
      toast.error(blocked);
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    rememberPostAuthRedirect(redirect);
    toast.success("Account created — let's set up your profile.");
    void navigate({ to: "/onboarding" });
  };

  const loginSearch = sanitizeAppPath(redirect) ? { redirect: sanitizeAppPath(redirect) } : {};

  return (
    <AuthLayout
      title="Become a member"
      subtitle="Create your The Bu1ld account — access to open projects, six reading paths, paper reviews, event deadlines, job listings, and the member directory. Free at launch, no payment step."
    >
      {!configured ? (
        <p className="rounded-sm border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red">
          Account creation is temporarily unavailable. Please try again later.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-background/50"
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
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
          <p className="text-xs text-muted-foreground">
            At least 8 characters with a letter and a number.
          </p>
        </div>
        <Button
          type="submit"
          className="w-full font-mono text-[11px] tracking-[0.2em] uppercase"
          disabled={submitting || !configured}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <OAuthButtons />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link to="/terms" className="text-accent-blue hover:text-bone">
          Terms
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-accent-blue hover:text-bone">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a member?{" "}
        <Link
          to="/login"
          search={loginSearch}
          className="text-accent-blue hover:text-bone transition"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
