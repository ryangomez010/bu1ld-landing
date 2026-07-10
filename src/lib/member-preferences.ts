import { readUserJson, writeUserJson } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import type { ContentDensity, EmailDigestFrequency, MemberPreferences } from "@/lib/types";

const STORAGE = "build:member-prefs";

export const MEMBER_PREFS_CHANGED = "build:member-prefs-changed";

export function notifyMemberPreferencesChanged(prefs: MemberPreferences) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MEMBER_PREFS_CHANGED, { detail: prefs }));
}

export const CONTENT_DENSITY_LABELS: Record<
  ContentDensity,
  { label: string; description: string }
> = {
  compact: {
    label: "Compact",
    description: "More items per screen — ideal for power users and smaller displays.",
  },
  comfortable: {
    label: "Comfortable",
    description: "Balanced spacing and typography — the default BUILD experience.",
  },
  spacious: {
    label: "Spacious",
    description: "Extra breathing room between sections for focused reading.",
  },
};

export const DIGEST_FREQUENCY_LABELS: Record<
  EmailDigestFrequency,
  { label: string; description: string }
> = {
  daily: {
    label: "Daily",
    description: "A short morning summary of papers, events, and project activity.",
  },
  weekly: {
    label: "Weekly",
    description: "One digest every Monday with highlights from your interests.",
  },
  never: {
    label: "Never",
    description: "In-app notifications only — no digest emails.",
  },
};

function defaults(userId: string): MemberPreferences {
  return {
    user_id: userId,
    content_density: "comfortable",
    email_digest_frequency: "weekly",
    updated_at: new Date().toISOString(),
  };
}

function readLocal(userId: string): MemberPreferences {
  const stored = readUserJson<Partial<MemberPreferences>>(STORAGE, userId, {});
  return { ...defaults(userId), ...stored, user_id: userId };
}

function writeLocal(userId: string, prefs: MemberPreferences) {
  writeUserJson(STORAGE, userId, prefs);
}

export async function fetchMemberPreferences(userId: string): Promise<MemberPreferences> {
  const supabase = getSupabase();
  if (!supabase) return readLocal(userId);

  const { data, error } = await supabase
    .from("member_preferences")
    .select("user_id, content_density, email_digest_frequency, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return readLocal(userId);

  return {
    user_id: data.user_id,
    content_density: data.content_density as ContentDensity,
    email_digest_frequency: data.email_digest_frequency as EmailDigestFrequency,
    updated_at: data.updated_at,
  };
}

export async function updateMemberPreferences(
  userId: string,
  patch: Partial<Pick<MemberPreferences, "content_density" | "email_digest_frequency">>,
): Promise<{ error: string | null }> {
  const current = await fetchMemberPreferences(userId);
  const next: MemberPreferences = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeLocal(userId, next);
  notifyMemberPreferencesChanged(next);

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase.from("member_preferences").upsert(
    {
      user_id: userId,
      content_density: next.content_density,
      email_digest_frequency: next.email_digest_frequency,
      updated_at: next.updated_at,
    },
    { onConflict: "user_id" },
  );
  return { error: error?.message ?? null };
}

/** CSS class applied to member canvas based on density preference. */
export function densityClass(density: ContentDensity): string {
  if (density === "compact") return "density-compact";
  if (density === "spacious") return "density-spacious";
  return "density-comfortable";
}
