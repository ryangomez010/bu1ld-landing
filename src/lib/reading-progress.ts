import { getSupabase } from "@/lib/supabase";

const storageKey = (userId: string, guideSlug: string) => `build:read:${userId}:${guideSlug}`;

export function getLocalProgress(userId: string, guideSlug: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(storageKey(userId, guideSlug));
  return raw ? Math.min(100, Math.max(0, Number(raw))) : 0;
}

export function setLocalProgress(userId: string, guideSlug: string, percent: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId, guideSlug), String(Math.round(percent)));
}

export async function getReadingProgress(userId: string, guideSlug: string): Promise<number> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("reading_progress")
      .select("progress_percent")
      .eq("user_id", userId)
      .eq("guide_slug", guideSlug)
      .maybeSingle();
    if (data) return data.progress_percent;
  }
  return getLocalProgress(userId, guideSlug);
}

export async function saveReadingProgress(
  userId: string,
  guideSlug: string,
  percent: number,
): Promise<void> {
  const rounded = Math.min(100, Math.max(0, Math.round(percent)));
  setLocalProgress(userId, guideSlug, rounded);

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("reading_progress").upsert({
    user_id: userId,
    guide_slug: guideSlug,
    progress_percent: rounded,
    updated_at: new Date().toISOString(),
  });
}

export async function getAllGuideProgress(userId: string): Promise<Record<string, number>> {
  const supabase = getSupabase();
  const result: Record<string, number> = {};

  if (supabase) {
    const { data } = await supabase
      .from("reading_progress")
      .select("guide_slug, progress_percent")
      .eq("user_id", userId);
    data?.forEach((row) => {
      result[row.guide_slug] = row.progress_percent;
    });
  }

  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`build:read:${userId}:`)) continue;
      const slug = key.slice(`build:read:${userId}:`.length);
      if (result[slug] == null) result[slug] = getLocalProgress(userId, slug);
    }
  }

  return result;
}
