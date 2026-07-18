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
import { consumePostAuthRedirect, postAuthNavigateTarget } from "@/lib/post-auth-redirect";
import { isSafeUrl } from "@/lib/urls";
import type { MemberBackground } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [{ title: "Set up your profile — The Bu1ld" }],
  }),
});

const STEPS = ["About you", "Background", "Links", "Timezone"] as const;

function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingForm />
    </RequireAuth>
  );
}

const ONBOARDING_DRAFT_KEY = "build:onboarding-draft";

type OnboardingDraft = {
  step: number;
  fullName: string;
  bio: string;
  background: MemberBackground;
  interests: string[];
  githubUrl: string;
  linkedinUrl: string;
  timezone: string;
};

function loadDraft(): Partial<OnboardingDraft> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY) ?? "{}") as OnboardingDraft;
  } catch {
    return {};
  }
}

function saveDraft(draft: OnboardingDraft) {
  try {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function OnboardingForm() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const draft = loadDraft();
  const [step, setStep] = useState(draft.step ?? 0);
  const [fullName, setFullName] = useState(draft.fullName ?? "");
  const [bio, setBio] = useState(draft.bio ?? "");
  const [background, setBackground] = useState<MemberBackground>(draft.background ?? "engineer");
  const [interests, setInterests] = useState<string[]>(draft.interests ?? []);
  const [githubUrl, setGithubUrl] = useState(draft.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(draft.linkedinUrl ?? "");
  const [timezone, setTimezone] = useState(draft.timezone ?? "");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [desiredRoles, setDesiredRoles] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_completed) {
      void navigate(postAuthNavigateTarget(consumePostAuthRedirect()));
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!profile && !fullName && user) {
      const meta = user.user_metadata ?? {};
      const fromProvider =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        [meta.given_name, meta.family_name].filter(Boolean).join(" ") ||
        "";
      if (fromProvider) setFullName(fromProvider);
    }
    if (!timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile, user, fullName, timezone]);

  useEffect(() => {
    saveDraft({
      step,
      fullName,
      bio,
      background,
      interests,
      githubUrl,
      linkedinUrl,
      timezone,
    });
  }, [step, fullName, bio, background, interests, githubUrl, linkedinUrl, timezone]);

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
        availability_hours_per_week: availabilityHours ? Number(availabilityHours) : null,
        experience_level: experienceLevel || null,
        desired_roles: desiredRoles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      if (user.email) {
        const mail = welcomeEmail(fullName);
        void sendEmail({ to: user.email, ...mail });
      }
      await refreshProfile();
      try {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      toast.success("You're in. Welcome to The Bu1ld.");
      void navigate(postAuthNavigateTarget(consumePostAuthRedirect()));
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
      title="Set up your profile"
      subtitle="Four steps: name and bio, background and interests, GitHub/LinkedIn links, and timezone. Project leads see this when you apply; interests also rank your For You feed and digest."
    >
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((label, i) => (
          <div key={label}>
            <div className={`h-1 rounded-full ${i <= step ? "bg-accent-blue" : "bg-border/60"}`} />
            <p
              className={`mt-2 label-xs hidden sm:block ${i === step ? "text-bone" : "text-muted-foreground"}`}
            >
              {i + 1}. {label}
            </p>
            <p
              className={`mt-2 label-xs sm:hidden ${i === step ? "text-bone" : "text-muted-foreground"}`}
              aria-hidden
            >
              {i + 1}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 panel glass-subtle surface-card p-4">
        <p className="label-xs text-muted-foreground mb-2">Profile preview</p>
        <p className="font-display text-lg text-bone">{fullName.trim() || "Your name"}</p>
        {background ? (
          <p className="mt-1 label-xs text-accent-green capitalize">{background}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {bio.trim() ||
            "Bio preview — project leads read this verbatim in the application review queue."}
        </p>
        {interests.length > 0 ? (
          <p className="mt-2 label-xs text-muted-foreground">{interests.slice(0, 5).join(" · ")}</p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {step === 0 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {fullName.trim().length > 0 && fullName.trim().length < 2 ? (
                <p className="text-xs text-accent-red">Name should be at least 2 characters.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                placeholder="What are you working on now? What papers, systems, or products do you want to ship in the next six months?"
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
                      className={`rounded-sm border px-3 py-1.5 label-xs transition ${
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
                  These tags rank your For You feed, digest emails, and member directory matches:{" "}
                  {interests.slice(0, 4).join(", ")}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="availability">Hours / week (optional)</Label>
                <Input
                  id="availability"
                  type="number"
                  min={0}
                  max={80}
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Experience level</Label>
                <Select
                  value={experienceLevel || "unset"}
                  onValueChange={(v) => setExperienceLevel(v === "unset" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="early_career">Early career</SelectItem>
                    <SelectItem value="mid_career">Mid career</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desired-roles">Desired roles (comma-separated)</Label>
              <Input
                id="desired-roles"
                placeholder="Research contributor, Systems engineer"
                value={desiredRoles}
                onChange={(e) => setDesiredRoles(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="label-sm"
            >
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="ml-auto label-sm"
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="ml-auto label-sm">
              {submitting ? "Saving…" : "Complete profile"}
            </Button>
          )}
        </div>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-bone transition">
          Skip for now — go to your dashboard →
        </Link>
      </p>
    </AuthLayout>
  );
}
