import { LIMITS, sanitizeText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import type { SavedItemType } from "@/lib/types";

export type SavedCollection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
};

export type SavedCollectionItem = {
  id: string;
  collection_id: string;
  item_type: SavedItemType;
  item_slug: string;
  item_title: string;
  created_at: string;
};

export async function fetchCollections(userId: string): Promise<SavedCollection[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_collections")
    .select("*, saved_collection_items(count)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<SavedCollection & { saved_collection_items: { count: number }[] }>).map(
    (row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_count: row.saved_collection_items?.[0]?.count ?? 0,
    }),
  );
}

export async function createCollection(
  userId: string,
  name: string,
  description?: string,
): Promise<{ collection: SavedCollection | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { collection: null, error: "Supabase is not configured." };

  const safeName = sanitizeText(name, LIMITS.collectionName);
  if (!safeName) return { collection: null, error: "Collection name is required." };

  const { data, error } = await supabase
    .from("saved_collections")
    .insert({
      user_id: userId,
      name: safeName,
      description: description ? sanitizeText(description, LIMITS.collectionDescription) : null,
    })
    .select("*")
    .single();

  if (error) return { collection: null, error: error.message };
  return { collection: { ...(data as SavedCollection), item_count: 0 }, error: null };
}

export async function deleteCollection(
  userId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase
    .from("saved_collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

export async function fetchCollectionItems(collectionId: string): Promise<SavedCollectionItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_collection_items")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as SavedCollectionItem[];
}

export async function addToCollection(
  collectionId: string,
  item: { item_type: SavedItemType; item_slug: string; item_title: string },
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.from("saved_collection_items").upsert(
    {
      collection_id: collectionId,
      item_type: item.item_type,
      item_slug: item.item_slug,
      item_title: sanitizeText(item.item_title, 300),
    },
    { onConflict: "collection_id,item_type,item_slug" },
  );

  if (!error) {
    await supabase
      .from("saved_collections")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", collectionId);
  }

  return { error: error?.message ?? null };
}

export async function removeFromCollection(itemId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.from("saved_collection_items").delete().eq("id", itemId);
  return { error: error?.message ?? null };
}
