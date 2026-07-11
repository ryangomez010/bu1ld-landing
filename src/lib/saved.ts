import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import type { SavedItem, SavedItemType } from "@/lib/types";

const PREFS_BASE = "build:saved-prefs";

export type SavedPagePrefs = {
  filter: SavedItemType | "all";
  sort: "newest" | "oldest" | "type";
};

const DEFAULT_PREFS: SavedPagePrefs = { filter: "all", sort: "newest" };

export function loadSavedPagePrefs(userId: string): SavedPagePrefs {
  return readUserJson(PREFS_BASE, userId, DEFAULT_PREFS);
}

export function saveSavedPagePrefs(userId: string, prefs: SavedPagePrefs): void {
  writeUserJson(PREFS_BASE, userId, prefs);
}

const STORAGE_BASE = "build:saved";

function readLocal(userId: string): SavedItem[] {
  return readUserJson<SavedItem[]>(STORAGE_BASE, userId, []);
}

function writeLocal(userId: string, items: SavedItem[]) {
  writeUserJson(STORAGE_BASE, userId, items);
}

export async function fetchSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) return data as SavedItem[];
  }
  return withLocalFallback([], () =>
    readLocal(userId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

export async function isSaved(
  userId: string,
  itemType: SavedItemType,
  itemSlug: string,
): Promise<boolean> {
  const items = await fetchSavedItems(userId);
  return items.some((s) => s.item_type === itemType && s.item_slug === itemSlug);
}

export async function toggleSaved(
  userId: string,
  itemType: SavedItemType,
  itemSlug: string,
  itemTitle: string,
): Promise<boolean> {
  const supabase = getSupabase();
  const existing = await isSaved(userId, itemType, itemSlug);

  if (existing) {
    if (supabase) {
      await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_slug", itemSlug);
    } else {
      persistLocally(() =>
        writeLocal(
          userId,
          readLocal(userId).filter((s) => !(s.item_type === itemType && s.item_slug === itemSlug)),
        ),
      );
    }
    return false;
  }

  const item: SavedItem = {
    id: `local-s-${Date.now()}`,
    user_id: userId,
    item_type: itemType,
    item_slug: itemSlug,
    item_title: itemTitle,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    await supabase.from("saved_items").insert({
      user_id: userId,
      item_type: itemType,
      item_slug: itemSlug,
      item_title: itemTitle,
    });
  } else {
    persistLocally(() => writeLocal(userId, [item, ...readLocal(userId)]));
  }
  return true;
}

/** Remove multiple saved items at once (filtered list or selection). */
export async function bulkUnsaveSavedItems(
  userId: string,
  items: Pick<SavedItem, "item_type" | "item_slug">[],
): Promise<{ error: string | null }> {
  if (items.length === 0) return { error: null };
  const supabase = getSupabase();

  if (supabase) {
    for (const item of items) {
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", userId)
        .eq("item_type", item.item_type)
        .eq("item_slug", item.item_slug);
      if (error) return { error: error.message };
    }
    return { error: null };
  }

  persistLocally(() => {
    const remove = new Set(items.map((i) => `${i.item_type}:${i.item_slug}`));
    writeLocal(
      userId,
      readLocal(userId).filter((s) => !remove.has(`${s.item_type}:${s.item_slug}`)),
    );
  });
  return { error: null };
}

export function savedItemHref(type: SavedItemType, slug: string): string {
  const map: Record<SavedItemType, string> = {
    event: `/events/${slug}`,
    paper: `/papers/${slug}`,
    project: `/projects/${slug}`,
    job: `/jobs/${slug}`,
    guide: `/guides/${slug}`,
    newsletter: `/newsletter/${slug}`,
  };
  return map[type];
}

/** Migrate legacy global saved key to per-user storage. */
export function migrateLegacySaved(userId: string): void {
  if (typeof window === "undefined") return;
  const legacyKey = "build:saved:all";
  const legacy = localStorage.getItem(legacyKey);
  if (!legacy) return;
  try {
    const items = JSON.parse(legacy) as SavedItem[];
    const mine = items.filter((s) => s.user_id === userId);
    if (mine.length) {
      writeLocal(userId, [...mine, ...readLocal(userId)]);
    }
    localStorage.removeItem(legacyKey);
  } catch {
    localStorage.removeItem(legacyKey);
  }
}
