import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { IdentityCard } from "@/components/member/IdentityCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { ProfileCompletenessMeter } from "@/components/member/ProfileCompletenessMeter";
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
import { removeAvatar, uploadAvatar } from "@/lib/avatar-upload";
import { buildAccountExport, downloadAccountExport } from "@/lib/account-export";
import { buildProfileShareUrl, ensureProfileSlug } from "@/lib/profile-share";
import { memberLink } from "@/lib/app-paths";
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
  head: () => ({
    meta: [{ title: "Profile — The Bu1ld" }],
  }),
});

function ProfilePage() {
  return (
    <RequireMember>
      <ProfileEditor />
    </RequireMember>
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
  const [twitterUrl, setTwitterUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [desiredRoles, setDesiredRoles] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [weeklyPaperGoal, setWeeklyPaperGoal] = useState(2);
  const [timezone, setTimezone] = useState("");
  const [directoryVisible, setDirectoryVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewFeed, setPreviewFeed] = useState<ForYouItem[]>([]);
  const [shareSlug, setShareSlug] = useState("");
  const [shareUrl, setShareUrl] = useState("");

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
    setTwitterUrl(profile.twitter_url ?? "");
    setWebsiteUrl(profile.website_url ?? "");
    setGoals(profile.goals ?? []);
    setAvailabilityHours(
      profile.availability_hours_per_week != null
        ? String(profile.availability_hours_per_week)
        : "",
    );
    setExperienceLevel(profile.experience_level ?? "");
    setDesiredRoles((profile.desired_roles ?? []).join(", "));
    setAvatarUrl(profile.avatar_url ?? "");
    setWeeklyPaperGoal(profile.weekly_paper_goal ?? 2);
    setTimezone(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDirectoryVisible(profile.directory_visible !== false);
    setShareSlug(profile.profile_slug ?? "");
    if (user) {
      setShareUrl(buildProfileShareUrl(user.id, profile.profile_slug));
    }
  }, [profile, user]);

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

  const addGoal = () => {
    const trimmed = goalInput.trim();
    if (!trimmed || goals.length >= 8) return;
    if (goals.includes(trimmed)) return;
    setGoals((prev) => [...prev, trimmed]);
    setGoalInput("");
  };

  const removeGoal = (goal: string) => {
    setGoals((prev) => prev.filter((g) => g !== goal));
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const { url, error } = await uploadAvatar(user.id, file);
    setUploadingAvatar(false);
    if (error) toast.error(error);
    else if (url) {
      setAvatarUrl(url);
      await refreshProfile();
      toast.success("Avatar updated.");
    }
    e.target.value = "";
  };

  const onRemoveAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    const { error } = await removeAvatar(user.id);
    setUploadingAvatar(false);
    if (error) toast.error(error);
    else {
      setAvatarUrl("");
      await refreshProfile();
      toast.success("Avatar removed.");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isSupabaseConfigured) {
      toast.error("Profile updates are temporarily unavailable. Please try again later.");
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
    if (twitterUrl.trim() && !isSafeUrl(twitterUrl)) {
      toast.error("Twitter/X URL must start with http:// or https://");
      return;
    }
    if (websiteUrl.trim() && !isSafeUrl(websiteUrl)) {
      toast.error("Website URL must start with http:// or https://");
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName,
        bio,
        background,
        interests,
        goals,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        twitter_url: twitterUrl,
        website_url: websiteUrl,
        timezone,
        availability_hours_per_week: availabilityHours ? Number(availabilityHours) : null,
        experience_level: experienceLevel || null,
        desired_roles: desiredRoles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      await upsertProfile(user.id, {
        directory_visible: directoryVisible,
        weekly_paper_goal: weeklyPaperGoal,
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
      <p className="text-sm text-muted-foreground mb-8 -mt-4 max-w-xl leading-relaxed">
        Your name, bio, interests, and links feed three places: the member directory, project
        application review (leads see your full profile), and For You / digest ranking. Each section
        below maps to a specific surface.
      </p>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ProfileCompletenessMeter percent={completeness.percent} steps={completeness.steps} />
        <IdentityCard
          profile={
            profile
              ? {
                  ...profile,
                  full_name: fullName || profile.full_name,
                  bio: bio || profile.bio,
                  interests,
                  goals,
                  avatar_url: avatarUrl || profile.avatar_url,
                  github_url: githubUrl || profile.github_url,
                  linkedin_url: linkedinUrl || profile.linkedin_url,
                  twitter_url: twitterUrl || profile.twitter_url,
                  website_url: websiteUrl || profile.website_url,
                }
              : null
          }
          displayName={fullName || profile?.full_name || "Member"}
          shareUrl={shareUrl || undefined}
        />
      </div>

      <div className="mb-8 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
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
                {...memberLink(profile.profile_slug || user.id)}
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

      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
        <div className="rounded-sm border border-border/50 bg-background/60 p-4 space-y-3">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Avatar
          </p>
          <p className="text-xs text-muted-foreground">
            A clear photo helps collaborators recognize you in project teams and the directory.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover border border-border/50"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-accent-blue/15 flex items-center justify-center font-display text-xl text-bone">
                {(fullName || "M")[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center rounded-sm border border-border/60 px-3 py-2 font-mono text-[9px] tracking-[0.15em] uppercase hover:border-bone/30 transition"
              >
                {uploadingAvatar ? "Uploading…" : "Upload photo"}
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploadingAvatar}
                onChange={(e) => void onAvatarChange(e)}
              />
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={() => void onRemoveAvatar()}
                  className="font-mono text-[9px] tracking-[0.15em] uppercase"
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
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
            placeholder="Two to four sentences: current role, active project, and what you want to ship at The Bu1ld in the next two quarters."
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
        <div className="space-y-2">
          <Label>Goals this quarter</Label>
          <p className="text-xs text-muted-foreground">
            What do you want to learn, ship, or contribute? Shown on your identity card.
          </p>
          <div className="flex gap-2">
            <Input
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Ship a JEPA baseline on project defect-injection data by September"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGoal();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addGoal}
              disabled={goals.length >= 8}
              className="shrink-0 font-mono text-[9px] uppercase"
            >
              Add
            </Button>
          </div>
          {goals.length ? (
            <ul className="flex flex-wrap gap-2 mt-2">
              {goals.map((goal) => (
                <li key={goal}>
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
                    className="rounded-sm border border-accent-green/30 bg-accent-green/5 px-3 py-1 font-mono text-[9px] tracking-[0.1em] uppercase text-bone hover:border-accent-red/40 transition"
                    title="Click to remove"
                  >
                    {goal} ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="availability">Hours / week</Label>
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
            placeholder="Research contributor, Reviewer"
            value={desiredRoles}
            onChange={(e) => setDesiredRoles(e.target.value)}
          />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter / X URL</Label>
            <Input
              id="twitter"
              placeholder="https://x.com/you"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://yoursite.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
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
        <div className="space-y-2">
          <Label htmlFor="weeklyGoal">Weekly paper goal</Label>
          <p className="text-xs text-muted-foreground">
            Powers your reading streak and &ldquo;Your week&rdquo; dashboard summary.
          </p>
          <Input
            id="weeklyGoal"
            type="number"
            min={1}
            max={20}
            value={weeklyPaperGoal}
            onChange={(e) => setWeeklyPaperGoal(Number(e.target.value) || 2)}
          />
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
            Share profile
          </p>
          <p className="text-xs text-muted-foreground">
            Copy your public /members/{shareSlug || user?.id || "…"} URL — project leads and
            collaborators can view your identity card without signing in.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!user) return;
                void ensureProfileSlug(user.id, fullName || "member").then(({ slug, error }) => {
                  if (error) {
                    toast.error(error);
                    return;
                  }
                  if (slug) {
                    setShareSlug(slug);
                    const url = buildProfileShareUrl(user.id, slug);
                    setShareUrl(url);
                    void navigator.clipboard.writeText(url);
                    toast.success("Profile link copied.");
                  }
                });
              }}
              className="font-mono text-[9px] tracking-[0.15em] uppercase"
            >
              Copy share link
            </Button>
          </div>
          {shareUrl ? (
            <p className="font-mono text-[10px] text-muted-foreground break-all">{shareUrl}</p>
          ) : null}
        </div>
        <div className="rounded-sm border border-border/50 bg-background/60 p-4 space-y-3">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Account
          </p>
          <p className="text-sm text-bone">{user?.email}</p>
          <p className="text-xs text-muted-foreground">
            Password and email changes are managed in{" "}
            <Link to="/account/security" className="text-accent-blue hover:text-bone">
              Account security
            </Link>
            . Use “Forgot password” on the login page if you’re locked out.
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
