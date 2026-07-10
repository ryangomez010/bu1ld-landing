import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BACKGROUND_OPTIONS, INTEREST_OPTIONS } from "@/data/landing";
import { useAuth } from "@/lib/auth";
import { completeOnboarding } from "@/lib/profile";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { isSafeUrl } from "@/lib/urls";
import type { MemberBackground } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const STEPS = ["About you", "Background", "Links", "Timezone"] as const;

function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingForm />
    </RequireAuth>
  );
}

function OnboardingForm() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [background, setBackground] = useState<MemberBackground>("engineer");
  const [interests, setInterests] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_completed) {
      void navigate({ to: "/dashboard" });
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!profile && !fullName && user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name as string);
    }
    if (!timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile, user, fullName, timezone]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (githubUrl.trim() && !isSafeUrl(githubUrl)) {
      toast.error("GitHub URL must use http:// or https://");
      return;
    }
    if (linkedinUrl.trim() && !isSafeUrl(linkedinUrl)) {
      toast.error("LinkedIn URL must use http:// or https://");
      return;
    }
    setSubmitting(true);
    try {
      await completeOnboarding(user.id, {
        full_name: fullName,
        bio,
        background,
        interests,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        timezone,
      });
      if (user.email) {
        const mail = welcomeEmail(fullName);
        void sendEmail({ to: user.email, ...mail });
      }
      await refreshProfile();
      toast.success("Profile complete. Welcome to The Bu1ld.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const canNext =
    step === 0 ? fullName.trim().length > 0 : step === 1 ? interests.length > 0 : true;

  return (
    <AuthLayout
      title="Create your profile"
      subtitle="Tell us who you are and what you're building toward. This helps us match you to projects and community."
    >
      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-accent-blue" : "bg-border/60"}`} />
            <p
              className={`mt-2 font-mono text-[8px] tracking-[0.15em] uppercase ${i === step ? "text-bone" : "text-muted-foreground"}`}
            >
              {i + 1}. {label}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {step === 0 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                placeholder="What are you working on? What do you want to learn or build?"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label>Background</Label>
              <Select
                value={background}
                onValueChange={(v) => setBackground(v as MemberBackground)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select background" />
                </SelectTrigger>
                <SelectContent>
                  {BACKGROUND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase transition ${
                        active
                          ? "border-accent-blue bg-accent-blue/10 text-bone"
                          : "border-border/60 text-muted-foreground hover:border-bone/30"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              {interests.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Your feed will prioritize: {interests.slice(0, 4).join(", ")}
                  {interests.length > 4 ? "…" : ""}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                placeholder="https://github.com/you"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/you"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
            >
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="ml-auto font-mono text-[11px] tracking-[0.2em] uppercase"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting}
              className="ml-auto font-mono text-[11px] tracking-[0.2em] uppercase"
            >
              {submitting ? "Saving…" : "Complete profile"}
            </Button>
          )}
        </div>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-bone transition">
          Skip for now →
        </Link>
      </p>
    </AuthLayout>
  );
}
