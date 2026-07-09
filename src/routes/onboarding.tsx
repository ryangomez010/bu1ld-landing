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
import type { MemberBackground } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

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

  return (
    <AuthLayout
      title="Create your profile"
      subtitle="Tell us who you are and what you're building toward. This helps us match you to projects and community."
    >
      <form onSubmit={onSubmit} className="space-y-5">
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
        <div className="space-y-2">
          <Label>Background</Label>
          <Select value={background} onValueChange={(v) => setBackground(v as MemberBackground)}>
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
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </div>
        <Button
          type="submit"
          className="w-full font-mono text-[11px] tracking-[0.2em] uppercase"
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Complete profile"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-bone transition">
          Skip for now →
        </Link>
        <span className="mt-2 block text-bone/40">
          Your hub will nudge you until profile completeness hits 100%. Finish anytime in Profile.
        </span>
      </p>
    </AuthLayout>
  );
}
