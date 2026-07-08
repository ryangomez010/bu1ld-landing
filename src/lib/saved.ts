import { getSupabase } from "@/lib/supabase";
import type { SavedItem, SavedItemType } from "@/lib/types";

const key = "build:saved:all";

function readLocal(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as SavedItem[];
  } catch {
    return [];
  }
}

function writeLocal(items: SavedItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

export async function fetchSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) return data as SavedItem[];
  }
  return readLocal()
    .filter((s) => s.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
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
      writeLocal(
        readLocal().filter(
          (s) => !(s.user_id === userId && s.item_type === itemType && s.item_slug === itemSlug),
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
    writeLocal([item, ...readLocal()]);
  }
  return true;
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
