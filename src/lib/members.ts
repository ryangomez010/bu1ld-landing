import { getSupabase } from "@/lib/supabase";
import type { MemberBackground, Profile } from "@/lib/types";

export type DirectoryMember = Pick<
  Profile,
  | "id"
  | "full_name"
  | "bio"
  | "background"
  | "interests"
  | "github_url"
  | "linkedin_url"
  | "role"
  | "created_at"
>;

function normalize(row: Record<string, unknown>): DirectoryMember {
  return {
    id: String(row.id),
    full_name: row.full_name != null ? String(row.full_name) : null,
    bio: row.bio != null ? String(row.bio) : null,
    background: (row.background as MemberBackground) ?? null,
    interests: (row.interests as string[]) ?? [],
    github_url: row.github_url != null ? String(row.github_url) : null,
    linkedin_url: row.linkedin_url != null ? String(row.linkedin_url) : null,
    role: (row.role as Profile["role"]) ?? "member",
    created_at: String(row.created_at),
  };
}

export async function fetchMemberDirectory(): Promise<DirectoryMember[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, bio, background, interests, github_url, linkedin_url, role, created_at")
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((r) => normalize(r as Record<string, unknown>));
}

/** Shared interest tags between two members (case-insensitive). */
export function sharedInterests(a: string[], b: string[]): string[] {
  if (!a.length || !b.length) return [];
  const normalized = b.map((i) => i.toLowerCase());
  return a.filter((tag) => {
    const t = tag.toLowerCase();
    return normalized.some((i) => t === i || t.includes(i) || i.includes(t));
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
    .select("id, full_name, bio, background, interests, github_url, linkedin_url, role, created_at")
    .eq("id", id)
    .eq("onboarding_completed", true)
    .maybeSingle();

  if (!data) return null;
  return normalize(data as Record<string, unknown>);
}
