import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

const NOTES_KEY = (userId: string, slug: string) => `build:paper-notes:${userId}:${slug}`;
const PROGRESS_KEY = (userId: string, slug: string) => `build:paper-progress:${userId}:${slug}`;

export function getPaperNotesLocal(userId: string, paperSlug: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NOTES_KEY(userId, paperSlug)) ?? "";
}

export function setPaperNotesLocal(userId: string, paperSlug: string, notes: string): void {
  if (typeof window === "undefined") return;
  const safe = clampText(notes, 4000);
  if (!safe.trim()) localStorage.removeItem(NOTES_KEY(userId, paperSlug));
  else localStorage.setItem(NOTES_KEY(userId, paperSlug), safe);
}

export async function fetchPaperNotes(userId: string, paperSlug: string): Promise<string> {
  const local = getPaperNotesLocal(userId, paperSlug);
  const supabase = getSupabase();
  if (!supabase) return local;

  const { data } = await supabase
    .from("paper_reads")
    .select("notes")
    .eq("user_id", userId)
    .eq("paper_slug", paperSlug)
    .maybeSingle();

  const remote = data?.notes ? String(data.notes) : "";
  return remote || local;
}

export async function savePaperNotes(
  userId: string,
  paperSlug: string,
  notes: string,
): Promise<void> {
  const safe = clampText(notes, 4000);
  setPaperNotesLocal(userId, paperSlug, safe);

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("paper_reads").upsert(
    {
      user_id: userId,
      paper_slug: paperSlug,
      notes: safe.trim() || null,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,paper_slug" },
  );
}

export function getPaperScrollProgressLocal(userId: string, paperSlug: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(PROGRESS_KEY(userId, paperSlug));
  return raw ? Math.min(100, Math.max(0, Number(raw))) : 0;
}

export function setPaperScrollProgressLocal(
  userId: string,
  paperSlug: string,
  percent: number,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY(userId, paperSlug), String(Math.round(percent)));
}

export async function fetchPaperScrollProgress(userId: string, paperSlug: string): Promise<number> {
  const local = getPaperScrollProgressLocal(userId, paperSlug);
  const supabase = getSupabase();
  if (!supabase) return local;

  const { data } = await supabase
    .from("paper_reads")
    .select("scroll_percent")
    .eq("user_id", userId)
    .eq("paper_slug", paperSlug)
    .maybeSingle();

  if (data?.scroll_percent != null) {
    return Math.max(local, Number(data.scroll_percent));
  }
  return local;
}

export async function savePaperScrollProgress(
  userId: string,
  paperSlug: string,
  percent: number,
): Promise<void> {
  const rounded = Math.min(100, Math.max(0, Math.round(percent)));
  setPaperScrollProgressLocal(userId, paperSlug, rounded);

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("paper_reads").upsert(
    {
      user_id: userId,
      paper_slug: paperSlug,
      scroll_percent: rounded,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,paper_slug" },
  );
}

export function getAllPaperScrollProgressLocal(userId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(`build:paper-progress:${userId}:`)) continue;
    const slug = k.slice(`build:paper-progress:${userId}:`.length);
    result[slug] = getPaperScrollProgressLocal(userId, slug);
  }
  return result;
}

export async function getAllPaperNotesForExport(userId: string): Promise<Record<string, string>> {
  const supabase = getSupabase();
  const result: Record<string, string> = {};

  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(`build:paper-notes:${userId}:`)) continue;
      const slug = k.slice(`build:paper-notes:${userId}:`.length);
      const notes = getPaperNotesLocal(userId, slug);
      if (notes.trim()) result[slug] = notes;
    }
  }

  if (supabase) {
    const { data } = await supabase
      .from("paper_reads")
      .select("paper_slug, notes")
      .eq("user_id", userId);
    data?.forEach((row) => {
      if (row.notes) result[String(row.paper_slug)] = String(row.notes);
    });
  }

  return result;
}

/** Push local paper notes and scroll progress to Supabase. */
export async function syncPaperEngagementToRemote(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const localProgress = getAllPaperScrollProgressLocal(userId);
  const slugs = new Set(Object.keys(localProgress));

  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(`build:paper-notes:${userId}:`)) continue;
      slugs.add(k.slice(`build:paper-notes:${userId}:`.length));
    }
  }

  if (!slugs.size) return;

  const now = new Date().toISOString();
  const rows = [...slugs].map((paper_slug) => ({
    user_id: userId,
    paper_slug,
    scroll_percent: localProgress[paper_slug] ?? 0,
    notes: getPaperNotesLocal(userId, paper_slug).trim() || null,
    read_at: now,
  }));

  await supabase.from("paper_reads").upsert(rows, { onConflict: "user_id,paper_slug" });
}
