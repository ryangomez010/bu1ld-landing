import {
  readUserJson,
  writeUserJson,
  withLocalFallback,
  isLocalPersistenceEnabled,
  userStorageKey,
} from "@/lib/storage";
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
  const result = await loadSavedState(userId, itemType, itemSlug);
  if (result.error) throw new Error(result.error);
  return result.saved;
}

export async function toggleSaved(
  userId: string,
  itemType: SavedItemType,
  itemSlug: string,
  itemTitle: string,
): Promise<boolean> {
  const result = await toggleSavedWithReceipt(userId, itemType, itemSlug, itemTitle);
  if (result.error) throw new Error(result.error);
  return result.saved;
}

export type SavedToggleReceipt = {
  saved: boolean;
  changed: boolean;
  source: "synced" | "local" | "unavailable";
  error: string | null;
};

export function loadSavedState(userId: string, itemType: SavedItemType, itemSlug: string) {
  return changeSavedWithReceipt(userId, itemType, itemSlug, "", "read");
}

export function toggleSavedWithReceipt(
  userId: string,
  itemType: SavedItemType,
  itemSlug: string,
  itemTitle: string,
  desiredSaved?: boolean,
) {
  return changeSavedWithReceipt(userId, itemType, itemSlug, itemTitle, desiredSaved);
}

/** Checked reads and writes share one storage boundary; no mutation after a failed read. */
async function changeSavedWithReceipt(
  userId: string,
  itemType: SavedItemType,
  itemSlug: string,
  itemTitle: string,
  desiredSaved?: boolean | "read",
): Promise<SavedToggleReceipt> {
  let existing = false;
  try {
    const supabase = getSupabase();
    if (supabase) {
      const columns = "id,user_id,item_type,item_slug";
      const matches = (
        row: { id?: unknown; user_id?: unknown; item_type?: unknown; item_slug?: unknown } | null,
      ) =>
        typeof row?.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id) &&
        row.user_id === userId &&
        row.item_type === itemType &&
        row.item_slug === itemSlug;
      const before = await supabase
        .from("saved_items")
        .select(columns)
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_slug", itemSlug)
        .maybeSingle();
      if (before.error || (before.data !== null && !matches(before.data)))
        throw new Error("Read not confirmed");
      existing = before.data !== null;
      if (desiredSaved === "read")
        return { saved: existing, changed: false, source: "synced", error: null };
      const nextSaved = desiredSaved ?? !existing;
      if (nextSaved === existing)
        return { saved: existing, changed: false, source: "synced", error: null };
      if (!nextSaved) {
        const { data, error } = await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", userId)
          .eq("item_type", itemType)
          .eq("item_slug", itemSlug)
          .eq("id", before.data!.id)
          .select(columns)
          .single();
        if (error || !matches(data) || data.id !== before.data!.id)
          throw new Error("Delete not confirmed");
      } else {
        const { data, error } = await supabase
          .from("saved_items")
          .insert({
            user_id: userId,
            item_type: itemType,
            item_slug: itemSlug,
            item_title: itemTitle,
          })
          .select(columns)
          .single();
        if (error || !matches(data)) throw new Error("Save not confirmed");
      }
      return { saved: nextSaved, changed: true, source: "synced", error: null };
    }
    if (!isLocalPersistenceEnabled() || typeof window === "undefined")
      throw new Error("Storage unavailable");
    const readChecked = (): SavedItem[] => {
      const raw = localStorage.getItem(userStorageKey(STORAGE_BASE, userId));
      const rows: unknown = raw === null ? [] : JSON.parse(raw);
      if (
        !Array.isArray(rows) ||
        rows.some(
          (row) =>
            !row ||
            typeof row !== "object" ||
            row.user_id !== userId ||
            typeof row.id !== "string" ||
            typeof row.item_type !== "string" ||
            typeof row.item_slug !== "string" ||
            typeof row.item_title !== "string" ||
            typeof row.created_at !== "string",
        )
      )
        throw new Error("Local read not confirmed");
      return rows as SavedItem[];
    };
    const items = readChecked();
    existing = items.some((item) => item.item_type === itemType && item.item_slug === itemSlug);
    if (desiredSaved === "read")
      return { saved: existing, changed: false, source: "local", error: null };
    const nextSaved = desiredSaved ?? !existing;
    if (nextSaved === existing)
      return { saved: existing, changed: false, source: "local", error: null };
    const next = !nextSaved
      ? items.filter((item) => !(item.item_type === itemType && item.item_slug === itemSlug))
      : [
          {
            id: `local-s-${Date.now()}`,
            user_id: userId,
            item_type: itemType,
            item_slug: itemSlug,
            item_title: itemTitle,
            created_at: new Date().toISOString(),
          },
          ...items,
        ];
    writeLocal(userId, next);
    const stored = readChecked().some(
      (item) => item.item_type === itemType && item.item_slug === itemSlug,
    );
    if (stored !== nextSaved) throw new Error("Storage write not confirmed");
    return { saved: stored, changed: true, source: "local", error: null };
  } catch {
    return {
      saved: existing,
      changed: false,
      source: "unavailable",
      error: "Your saved list could not be confirmed. Please try again.",
    };
  }
}

/** Remove multiple saved items at once (filtered list or selection). */
export async function bulkUnsaveSavedItems(
  userId: string,
  items: Pick<SavedItem, "item_type" | "item_slug">[],
): Promise<{ error: string | null }> {
  if (items.length === 0) return { error: null };
  for (const item of items) {
    const result = await toggleSavedWithReceipt(userId, item.item_type, item.item_slug, "", false);
    if (result.error) return { error: result.error };
  }
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
