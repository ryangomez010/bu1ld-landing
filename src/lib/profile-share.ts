import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function buildProfileShareUrl(userId: string, profileSlug?: string | null): string {
  if (typeof window === "undefined") return `/members/${userId}`;
  const base = window.location.origin;
  if (profileSlug) return `${base}/members/${profileSlug}`;
  return `${base}/members/${userId}`;
}

export async function ensureProfileSlug(
  userId: string,
  fullName: string,
): Promise<{ slug: string | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { slug: null, error: "Profile links are temporarily unavailable." };

  const { data: existing } = await supabase
    .from("profiles")
    .select("profile_slug")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.profile_slug) {
    return { slug: String(existing.profile_slug), error: null };
  }

  const base = slugifyName(fullName) || `member-${userId.slice(0, 8)}`;
  let candidate = base;
  let attempt = 0;

  while (attempt < 5) {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("profile_slug", candidate)
      .neq("id", userId)
      .maybeSingle();

    if (!taken) {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_slug: candidate, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (!error) return { slug: candidate, error: null };
      return { slug: null, error: error.message };
    }
    attempt++;
    candidate = `${base}-${attempt}`;
  }

  return { slug: null, error: "Could not generate a unique profile link." };
}

export async function updateProfileSlug(
  userId: string,
  slug: string,
): Promise<{ error: string | null }> {
  const safe = clampText(
    slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, ""),
    40,
  );
  if (safe.length < 3)
    return { error: "Slug must be at least 3 characters (letters, numbers, hyphens)." };

  const supabase = getSupabase();
  if (!supabase) return { error: "Profile links are temporarily unavailable." };

  const { error } = await supabase
    .from("profiles")
    .update({ profile_slug: safe, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

export async function resolveMemberId(idOrSlug: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return idOrSlug;

  const byId = await supabase.from("profiles").select("id").eq("id", idOrSlug).maybeSingle();
  if (byId.data?.id) return String(byId.data.id);

  const bySlug = await supabase
    .from("profiles")
    .select("id")
    .eq("profile_slug", idOrSlug)
    .maybeSingle();
  if (bySlug.data?.id) return String(bySlug.data.id);

  return null;
}
