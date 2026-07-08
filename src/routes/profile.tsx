import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { RoleBadge } from "@/components/member/RoleBadge";
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
import { profileCompleteness, updateProfile } from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { MemberBackground } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileEditor />
    </RequireAuth>
  );
}

function ProfileEditor() {
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
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setBackground(profile.background ?? "engineer");
    setInterests(profile.interests ?? []);
    setGithubUrl(profile.github_url ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setTimezone(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [profile]);

  const completeness = profileCompleteness(profile);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isSupabaseConfigured) {
      toast.error("Connect Supabase to save profile changes.");
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName,
        bio,
        background,
        interests,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        timezone,
      });
      await refreshProfile();
      toast.success("Profile updated.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberLayout title="Profile" eyebrow="member settings">
      <div className="mb-8 -mt-4 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Completeness
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{completeness.percent}%</p>
          <div className="mt-3 h-1 rounded-full bg-border/60 overflow-hidden">
            <div
              className="h-full bg-accent-green transition-all"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
        </div>
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Role
          </p>
          <div className="mt-3">
            {profile?.role ? (
              <RoleBadge role={profile.role} />
            ) : (
              <span className="text-bone">Member</span>
            )}
          </div>
        </div>
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Missing
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {completeness.missing.length ? completeness.missing.join(" · ") : "All set"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
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
            rows={4}
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
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {submitting ? "Saving…" : "Save profile"}
          </Button>
          {profile?.role === "member" ? (
            <Link
              to="/lead/apply"
              className="inline-flex items-center font-mono text-[10px] tracking-[0.2em] uppercase text-accent-green hover:text-bone px-3"
            >
              Request lead status →
            </Link>
          ) : null}
        </div>
      </form>
    </MemberLayout>
  );
}
