import { getSupabase } from "@/lib/supabase";
import type { MemberBackground, Profile } from "@/lib/types";

export type DirectoryMember = Pick<
  Profile,
  | "id"
  | "full_name"
  | "bio"
  | "background"
  | "interests"
  | "goals"
  | "github_url"
  | "linkedin_url"
  | "twitter_url"
  | "website_url"
  | "avatar_url"
  | "profile_slug"
  | "role"
  | "created_at"
>;

const DIRECTORY_SELECT =
  "id, full_name, bio, background, interests, goals, github_url, linkedin_url, twitter_url, website_url, avatar_url, profile_slug, role, created_at";

function normalize(row: Record<string, unknown>): DirectoryMember {
  return {
    id: String(row.id),
    full_name: row.full_name != null ? String(row.full_name) : null,
    bio: row.bio != null ? String(row.bio) : null,
    background: (row.background as MemberBackground) ?? null,
    interests: (row.interests as string[]) ?? [],
    goals: (row.goals as string[]) ?? [],
    github_url: row.github_url != null ? String(row.github_url) : null,
    linkedin_url: row.linkedin_url != null ? String(row.linkedin_url) : null,
    twitter_url: row.twitter_url != null ? String(row.twitter_url) : null,
    website_url: row.website_url != null ? String(row.website_url) : null,
    avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
    profile_slug: row.profile_slug != null ? String(row.profile_slug) : null,
    role: (row.role as Profile["role"]) ?? "member",
    created_at: String(row.created_at),
  };
}

export async function fetchMemberDirectory(): Promise<DirectoryMember[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(DIRECTORY_SELECT)
    .eq("onboarding_completed", true)
    .eq("directory_visible", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((r) => normalize(r as Record<string, unknown>));
}

/** Shared interest tags between two members (exact match, case-insensitive). */
export function sharedInterests(a: string[], b: string[]): string[] {
  if (!a.length || !b.length) return [];
  const normalizedB = new Set(b.map((i) => i.trim().toLowerCase()).filter(Boolean));
  return a.filter((tag) => {
    const t = tag.trim().toLowerCase();
    return t.length > 0 && normalizedB.has(t);
  });
}

export function memberSimilarityScore(memberInterests: string[], myInterests: string[]): number {
  return sharedInterests(myInterests, memberInterests).length;
}

/** Members with overlapping interests, sorted by overlap count. */
export function findSimilarMembers(
  members: DirectoryMember[],
  myInterests: string[],
  opts?: { excludeId?: string; limit?: number },
): Array<{ member: DirectoryMember; overlap: string[]; score: number }> {
  if (!myInterests.length) return [];
  const limit = opts?.limit ?? 6;

  return members
    .filter((m) => m.id !== opts?.excludeId)
    .map((m) => {
      const overlap = sharedInterests(myInterests, m.interests ?? []);
      return { member: m, overlap, score: overlap.length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function fetchDirectoryMember(id: string): Promise<DirectoryMember | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select(DIRECTORY_SELECT)
    .eq("id", id)
    .eq("onboarding_completed", true)
    .eq("directory_visible", true)
    .maybeSingle();

  if (!data) return null;
  return normalize(data as Record<string, unknown>);
}
