import { createNotification } from "@/lib/notifications";
import { clampText, LIMITS } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";
import type { InstitutionalRole, OnboardingData, Profile } from "@/lib/types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: roleRows } = await supabase
    .from("member_roles")
    .select("role")
    .eq("user_id", userId);
  return {
    ...data,
    role: (data as Profile).role ?? "member",
    institutional_roles: (roleRows ?? []).map((row) => row.role as InstitutionalRole),
  } as Profile;
}

export async function upsertProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  // Never allow client-side role changes — RLS trigger also enforces this.
  const { role: _role, id: _id, created_at: _ca, updated_at: _ua, ...raw } = patch;

  const safe: Partial<Profile> = { ...raw };
  if (safe.full_name != null) safe.full_name = clampText(safe.full_name, LIMITS.profileName);
  if (safe.bio != null) safe.bio = clampText(safe.bio, LIMITS.profileBio);
  if (safe.timezone != null) safe.timezone = clampText(safe.timezone, 80);
  if (safe.github_url != null) {
    safe.github_url = isSafeUrl(safe.github_url)
      ? clampText(safe.github_url, LIMITS.profileUrl)
      : null;
  }
  if (safe.linkedin_url != null) {
    safe.linkedin_url = isSafeUrl(safe.linkedin_url)
      ? clampText(safe.linkedin_url, LIMITS.profileUrl)
      : null;
  }
  if (safe.twitter_url != null) {
    safe.twitter_url = isSafeUrl(safe.twitter_url)
      ? clampText(safe.twitter_url, LIMITS.profileUrl)
      : null;
  }
  if (safe.website_url != null) {
    safe.website_url = isSafeUrl(safe.website_url)
      ? clampText(safe.website_url, LIMITS.profileUrl)
      : null;
  }
  if (safe.avatar_url != null) {
    safe.avatar_url = isSafeUrl(safe.avatar_url)
      ? clampText(safe.avatar_url, LIMITS.profileUrl)
      : null;
  }
  if (safe.interests != null) {
    safe.interests = safe.interests
      .map((i) => clampText(i, 60))
      .filter(Boolean)
      .slice(0, 20);
  }
  if (safe.goals != null) {
    safe.goals = safe.goals
      .map((g) => clampText(g, 120))
      .filter(Boolean)
      .slice(0, 8);
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...safe, updated_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function completeOnboarding(userId: string, data: OnboardingData): Promise<Profile> {
  const profile = await upsertProfile(userId, {
    ...data,
    onboarding_completed: true,
  });

  await createNotification(userId, {
    title: "Welcome to The Bu1ld",
    body: "Your profile is live in the member directory. Browse open projects, start a reading path, or save a paper review to revisit later.",
    href: "/dashboard",
  });

  return profile;
}

export async function updateProfile(userId: string, data: OnboardingData): Promise<Profile> {
  return upsertProfile(userId, {
    ...data,
    onboarding_completed: true,
  });
}

export type CompletenessStep = {
  label: string;
  hint: string;
  done: boolean;
  href?: string;
};

export function profileCompleteness(profile: Profile | null): {
  percent: number;
  missing: string[];
  steps: CompletenessStep[];
} {
  if (!profile) {
    return {
      percent: 0,
      missing: ["Create your profile"],
      steps: [
        {
          label: "Create your profile",
          hint: "Add your name and background so members know who you are.",
          done: false,
          href: "/onboarding",
        },
      ],
    };
  }
  const checks: CompletenessStep[] = [
    {
      label: "Name",
      hint: "Shown on your directory card and attached to every project application.",
      done: !!profile.full_name?.trim(),
      href: "/profile",
    },
    {
      label: "Bio",
      hint: "Project leads read this in the application review queue — two to three sentences is enough.",
      done: !!profile.bio?.trim(),
      href: "/profile",
    },
    {
      label: "Avatar",
      hint: "A photo makes your profile recognizable in the directory.",
      done: !!profile.avatar_url?.trim(),
      href: "/profile",
    },
    {
      label: "Background",
      hint: "Researcher, engineer, founder — sets context for matches.",
      done: !!profile.background,
      href: "/profile",
    },
    {
      label: "Interests",
      hint: "Ranked against project tags, paper topics, and event subjects in your For You feed and digest.",
      done: (profile.interests?.length ?? 0) > 0,
      href: "/profile",
    },
    {
      label: "Goals",
      hint: "Displayed on your public profile — e.g. ship a world-model prototype, pass the research fellowship bar.",
      done: (profile.goals?.length ?? 0) > 0,
      href: "/profile",
    },
    {
      label: "Timezone",
      hint: "Helps coordinate across distributed teams and events.",
      done: !!profile.timezone?.trim(),
      href: "/profile",
    },
    {
      label: "Social link",
      hint: "GitHub, LinkedIn, or a personal site for credibility.",
      done: !!(
        profile.github_url?.trim() ||
        profile.linkedin_url?.trim() ||
        profile.twitter_url?.trim() ||
        profile.website_url?.trim()
      ),
      href: "/profile",
    },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
    steps: checks,
  };
}
