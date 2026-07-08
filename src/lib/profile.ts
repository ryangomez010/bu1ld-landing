import { createNotification } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";
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

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() })
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
    { label: "LinkedIn", ok: !!profile.linkedin_url?.trim() },
    { label: "GitHub", ok: !!profile.github_url?.trim() },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}
