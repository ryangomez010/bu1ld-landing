import { createNotification } from "@/lib/notifications";
import { clampText, LIMITS, sanitizeAppPath } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";
import type { OnboardingData, Profile } from "@/lib/types";

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
  return { ...data, role: (data as Profile).role ?? "member" };
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
  if (safe.interests != null) {
    safe.interests = safe.interests
      .map((i) => clampText(i, 60))
      .filter(Boolean)
      .slice(0, 20);
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
    body: "Your profile is live. Browse open projects, explore guides, and save content you want to revisit.",
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

export function profileCompleteness(profile: Profile | null): {
  percent: number;
  missing: string[];
} {
  if (!profile) return { percent: 0, missing: ["Create your profile"] };
  const checks: { label: string; ok: boolean }[] = [
    { label: "Name", ok: !!profile.full_name?.trim() },
    { label: "Bio", ok: !!profile.bio?.trim() },
    { label: "Background", ok: !!profile.background },
    { label: "Interests", ok: (profile.interests?.length ?? 0) > 0 },
    { label: "Timezone", ok: !!profile.timezone?.trim() },
    { label: "LinkedIn", ok: !!profile.linkedin_url?.trim() },
    { label: "GitHub", ok: !!profile.github_url?.trim() },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}
