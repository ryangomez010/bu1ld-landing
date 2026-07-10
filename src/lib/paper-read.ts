import { readUserJson, writeUserJson } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

const STORAGE_BASE = "build:papers-read";

function readLocal(userId: string): string[] {
  return readUserJson<string[]>(STORAGE_BASE, userId, []);
}

function writeLocal(userId: string, slugs: string[]) {
  writeUserJson(STORAGE_BASE, userId, slugs);
}

async function fetchRemoteSlugs(userId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("paper_reads")
    .select("paper_slug")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map((r) => String(r.paper_slug));
}

async function mergeSlugs(userId: string): Promise<Set<string>> {
  const local = readLocal(userId);
  const remote = await fetchRemoteSlugs(userId);
  return new Set([...local, ...remote]);
}

export async function getReadPaperSlugs(userId: string): Promise<Set<string>> {
  return mergeSlugs(userId);
}

export async function isPaperRead(userId: string, slug: string): Promise<boolean> {
  const slugs = await mergeSlugs(userId);
  return slugs.has(slug);
}

export async function markPaperRead(userId: string, slug: string): Promise<void> {
  const slugs = readLocal(userId);
  if (!slugs.includes(slug)) writeLocal(userId, [slug, ...slugs]);

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from("paper_reads")
    .upsert(
      { user_id: userId, paper_slug: slug, read_at: new Date().toISOString() },
      { onConflict: "user_id,paper_slug" },
    );
}

export async function unmarkPaperRead(userId: string, slug: string): Promise<void> {
  writeLocal(
    userId,
    readLocal(userId).filter((s) => s !== slug),
  );

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("paper_reads").delete().eq("user_id", userId).eq("paper_slug", slug);
}

/** One-time merge: push local read slugs to Supabase when remote is empty. */
export async function syncPaperReadsToRemote(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const local = readLocal(userId);
  if (!local.length) return;

  const remote = await fetchRemoteSlugs(userId);
  if (remote.length) return;

  const now = new Date().toISOString();
  await supabase.from("paper_reads").upsert(
    local.map((paper_slug) => ({ user_id: userId, paper_slug, read_at: now })),
    { onConflict: "user_id,paper_slug" },
  );
}
