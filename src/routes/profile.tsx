import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { TagList } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { buildAccountExport, downloadAccountExport } from "@/lib/account-export";
import { useAuth } from "@/lib/auth";
import { buildForYouFeed } from "@/lib/personalization";
import type { ForYouItem } from "@/lib/personalization";
import { syncPaperEngagementToRemote } from "@/lib/paper-notes";
import { syncPaperReadsToRemote } from "@/lib/paper-read";
import { profileCompleteness, updateProfile, upsertProfile } from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";
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
  const [directoryVisible, setDirectoryVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewFeed, setPreviewFeed] = useState<ForYouItem[]>([]);

  useEffect(() => {
    if (!interests.length) {
      setPreviewFeed([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void buildForYouFeed(interests).then((feed) => setPreviewFeed(feed.slice(0, 3)));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [interests]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setBackground(profile.background ?? "engineer");
    setInterests(profile.interests ?? []);
    setGithubUrl(profile.github_url ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setTimezone(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDirectoryVisible(profile.directory_visible !== false);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void syncPaperReadsToRemote(user.id);
    void syncPaperEngagementToRemote(user.id);
  }, [user]);

  const completeness = profileCompleteness(profile);

  if (user && !profile) {
    return (
      <MemberLayout title="Profile" eyebrow="member settings">
        <ListSkeleton rows={4} />
      </MemberLayout>
    );
  }

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
    if (githubUrl.trim() && !isSafeUrl(githubUrl)) {
      toast.error("GitHub URL must start with http:// or https://");
      return;
    }
    if (linkedinUrl.trim() && !isSafeUrl(linkedinUrl)) {
      toast.error("LinkedIn URL must start with http:// or https://");
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
      await upsertProfile(user.id, { directory_visible: directoryVisible });
      await refreshProfile();
      toast.success("Profile updated.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const onExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = await buildAccountExport(user.id);
      downloadAccountExport(data);
      toast.success("Account data downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <MemberLayout title="Profile" eyebrow="member settings">
      <div className="mb-8 -mt-4 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
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
            Directory
          </p>
          {user && profile?.onboarding_completed ? (
            profile.directory_visible !== false ? (
              <Link
                to={`/members/${user.id}`}
                className="mt-2 inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
              >
                View public profile →
              </Link>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Hidden from directory</p>
            )
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Complete onboarding to appear</p>
          )}
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

      <section className="mb-8 max-w-xl rounded-sm border border-border/60 bg-background/70 p-5">
        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
          Public member card preview
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-bone">{fullName || "Your name"}</h3>
          {profile?.role ? <RoleBadge role={profile.role} /> : null}
          {background ? (
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground capitalize border border-border/60 px-2 py-1 rounded-sm">
              {background}
            </span>
          ) : null}
        </div>
        {bio ? (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{bio}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground italic">
            Add a bio to stand out in the directory.
          </p>
        )}
        {interests.length ? <TagList tags={interests.slice(0, 6)} className="mt-4" /> : null}
        {user ? (
          <Link
            to="/members/$id"
            params={{ id: user.id }}
            className="mt-4 inline-block font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
          >
            View public profile →
          </Link>
        ) : null}
      </section>

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
          {previewFeed.length > 0 ? (
            <div className="mt-4 rounded-sm border border-accent-green/20 bg-accent-green/5 p-4">
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-green mb-2">
                For you preview
              </p>
              <ul className="space-y-2 text-sm">
                {previewFeed.map((item) => (
                  <li key={item.href}>
                    <Link to={item.href} className="text-bone hover:text-accent-blue transition">
                      {item.title}
                    </Link>
                    <span className="ml-2 font-mono text-[8px] uppercase text-muted-foreground">
                      {item.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : interests.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              No matches for these interests yet — try broader tags.
            </p>
          ) : null}
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
          <Input
            id="timezone"
            list="tz-list"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/Los_Angeles"
          />
          <datalist id="tz-list">
            {[
              "America/Los_Angeles",
              "America/New_York",
              "America/Chicago",
              "Europe/London",
              "Europe/Berlin",
              "Asia/Kolkata",
              "Asia/Singapore",
              "Australia/Sydney",
              "UTC",
            ].map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </div>
        <div className="flex items-start gap-3 rounded-sm border border-border/50 bg-background/60 p-4">
          <Checkbox
            id="directoryVisible"
            checked={directoryVisible}
            onCheckedChange={(v) => setDirectoryVisible(v === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="directoryVisible" className="text-bone cursor-pointer">
              Show me in the member directory
            </Label>
            <p className="text-xs text-muted-foreground">
              When off, other members cannot find your profile in search or the directory. You can
              still use the portal normally.
            </p>
          </div>
        </div>
        <div className="rounded-sm border border-border/50 bg-background/60 p-4 space-y-3">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Account
          </p>
          <p className="text-sm text-bone">{user?.email}</p>
          <p className="text-xs text-muted-foreground">
            Password and email changes are managed through your auth provider (Supabase Auth). Use
            “Forgot password” on the login page to reset credentials.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={() => void onExport()}
            className="font-mono text-[9px] tracking-[0.15em] uppercase"
          >
            {exporting ? "Preparing…" : "Download my data"}
          </Button>
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
