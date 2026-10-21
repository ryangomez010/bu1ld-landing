import { getSupabase } from "@/lib/supabase";
import { createReadingProgressStore, type ProgressSave } from "@/lib/reading-progress-store";

const store = createReadingProgressStore({
  storage: () => (typeof window === "undefined" ? null : window.localStorage),
  remote: () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    return {
      async load(userId, slug) {
        let query = supabase
          .from("reading_progress")
          .select("guide_slug, progress_percent")
          .eq("user_id", userId);
        if (slug) query = query.eq("guide_slug", slug);
        const { data, error } = await query.abortSignal(AbortSignal.timeout(10000));
        if (error) throw error;
        return Object.fromEntries(
          (data ?? []).map((row) => [row.guide_slug, row.progress_percent]),
        );
      },
      async save(userId, slug, percent) {
        const { error } = await supabase
          .from("reading_progress")
          .upsert(
            {
              user_id: userId,
              guide_slug: slug,
              progress_percent: percent,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,guide_slug" },
          )
          .abortSignal(AbortSignal.timeout(10000));
        if (error) throw error;
      },
    };
  },
});

export const getLocalProgress = store.getLocal;
export const setLocalProgress = store.setLocal;
export const loadGuideProgress = store.load;
export const persistReadingProgress = store.save;

export async function getReadingProgress(userId: string, guideSlug: string): Promise<number> {
  return (await store.load(userId, guideSlug)).values[guideSlug] ?? 0;
}

/** Compatibility for existing callers: a total persistence failure is never reported as success. */
export async function saveReadingProgress(
  userId: string,
  guideSlug: string,
  percent: number,
): Promise<ProgressSave> {
  const result = await store.save(userId, guideSlug, percent);
  if (result.source === "unavailable") throw new Error("Reading progress could not be saved.");
  return result;
}

export async function getAllGuideProgress(userId: string): Promise<Record<string, number>> {
  return (await store.load(userId)).values;
}
