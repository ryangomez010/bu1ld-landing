import { SEED_ANNOUNCEMENTS } from "@/data/seed/announcements";
import { fetchMemberIds } from "@/lib/admin";
import { createNotification } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";
import type { Announcement } from "@/data/seed/announcements";

const key = "build:announcements";

function readLocal(): Announcement[] {
  if (typeof window === "undefined") return SEED_ANNOUNCEMENTS;
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "[]") as Announcement[];
    return stored.length ? stored : SEED_ANNOUNCEMENTS;
  } catch {
    return SEED_ANNOUNCEMENTS;
  }
}

function writeLocal(items: Announcement[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

function normalize(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    href: row.href != null ? String(row.href) : null,
    pinned: Boolean(row.pinned ?? false),
    published: Boolean(row.published ?? true),
    created_at: String(row.created_at),
  };
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("published", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);
    if (data?.length) return data.map((r) => normalize(r as Record<string, unknown>));
  }
  return readLocal()
    .filter((a) => a.published)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
}

export async function fetchAllAnnouncementsAdmin(): Promise<Announcement[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) return data.map((r) => normalize(r as Record<string, unknown>));
  }
  return readLocal();
}

async function fanOutAnnouncement(payload: {
  title: string;
  body: string;
  href?: string;
}) {
  const ids = await fetchMemberIds();
  await Promise.all(
    ids.slice(0, 100).map((id) =>
      createNotification(id, {
        title: payload.title,
        body: payload.body.slice(0, 180),
        href: payload.href ?? "/dashboard",
      }),
    ),
  );
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  href?: string;
  pinned?: boolean;
  notify?: boolean;
}): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("announcements").insert({
      title: payload.title,
      body: payload.body,
      href: payload.href ?? null,
      pinned: payload.pinned ?? false,
      published: true,
    });
    if (error) return { error: error.message };
  } else {
    const item: Announcement = {
      id: `local-a-${Date.now()}`,
      title: payload.title,
      body: payload.body,
      href: payload.href ?? null,
      pinned: payload.pinned ?? false,
      published: true,
      created_at: new Date().toISOString(),
    };
    writeLocal([item, ...readLocal()]);
  }

  if (payload.notify !== false) {
    await fanOutAnnouncement(payload);
  }
  return { error: null };
}

export async function setAnnouncementPublished(
  id: string,
  published: boolean,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("announcements").update({ published }).eq("id", id);
    return { error: error?.message ?? null };
  }
  writeLocal(readLocal().map((a) => (a.id === id ? { ...a, published } : a)));
  return { error: null };
}

export async function deleteAnnouncement(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    return { error: error?.message ?? null };
  }
  writeLocal(readLocal().filter((a) => a.id !== id));
  return { error: null };
}

export async function getPinnedAnnouncement(): Promise<Announcement | null> {
  const items = await fetchAnnouncements();
  return items.find((a) => a.pinned) ?? items[0] ?? null;
}
