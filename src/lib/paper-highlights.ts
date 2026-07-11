import { clampText, sanitizeText } from "@/lib/security";
import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

export type PaperHighlight = {
  id: string;
  paper_slug: string;
  highlighted_text: string;
  created_at: string;
};

const STORAGE = "build:paper-highlights";

function readLocal(userId: string, paperSlug: string): PaperHighlight[] {
  const all = readUserJson<Record<string, PaperHighlight[]>>(STORAGE, userId, {});
  return all[paperSlug] ?? [];
}

function writeLocal(userId: string, paperSlug: string, items: PaperHighlight[]) {
  const all = readUserJson<Record<string, PaperHighlight[]>>(STORAGE, userId, {});
  all[paperSlug] = items;
  writeUserJson(STORAGE, userId, all);
}

export async function fetchPaperHighlights(
  userId: string,
  paperSlug: string,
): Promise<PaperHighlight[]> {
  const supabase = getSupabase();
  if (!supabase) return withLocalFallback([], () => readLocal(userId, paperSlug));

  const { data, error } = await supabase
    .from("paper_highlights")
    .select("id, paper_slug, highlighted_text, created_at")
    .eq("user_id", userId)
    .eq("paper_slug", paperSlug)
    .order("created_at", { ascending: false });

  if (error) return withLocalFallback([], () => readLocal(userId, paperSlug));
  return (data ?? []) as PaperHighlight[];
}

export async function addPaperHighlight(
  userId: string,
  paperSlug: string,
  text: string,
): Promise<{ highlight: PaperHighlight | null; error: string | null }> {
  const safe = sanitizeText(text, 500);
  if (!safe) return { highlight: null, error: "Highlight text is required." };

  const now = new Date().toISOString();
  const local: PaperHighlight = {
    id: `local-hl-${Date.now()}`,
    paper_slug: paperSlug,
    highlighted_text: safe,
    created_at: now,
  };

  const supabase = getSupabase();
  if (!supabase) {
    persistLocally(() => writeLocal(userId, paperSlug, [local, ...readLocal(userId, paperSlug)]));
    return { highlight: local, error: null };
  }

  const { data, error } = await supabase
    .from("paper_highlights")
    .insert({ user_id: userId, paper_slug: paperSlug, highlighted_text: safe })
    .select("id, paper_slug, highlighted_text, created_at")
    .single();

  if (error) return { highlight: null, error: error.message };
  return { highlight: data as PaperHighlight, error: null };
}

export async function deletePaperHighlight(
  userId: string,
  paperSlug: string,
  highlightId: string,
): Promise<{ error: string | null }> {
  persistLocally(() =>
    writeLocal(
      userId,
      paperSlug,
      readLocal(userId, paperSlug).filter((h) => h.id !== highlightId),
    ),
  );

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("paper_highlights")
    .delete()
    .eq("id", highlightId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export function getSelectedHighlightText(): string {
  if (typeof window === "undefined") return "";
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return "";
  return clampText(sel.toString(), 500);
}

export async function fetchAllPaperHighlights(
  userId: string,
  limit = 80,
): Promise<PaperHighlight[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return withLocalFallback([], () => {
      const all = readUserJson<Record<string, PaperHighlight[]>>(STORAGE, userId, {});
      return Object.values(all)
        .flat()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    });
  }

  const { data, error } = await supabase
    .from("paper_highlights")
    .select("id, paper_slug, highlighted_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return withLocalFallback([], () => {
      const all = readUserJson<Record<string, PaperHighlight[]>>(STORAGE, userId, {});
      return Object.values(all)
        .flat()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    });
  }
  return data as PaperHighlight[];
}
