import { SEED_ANNOUNCEMENTS } from "@/data/seed/announcements";
import { fetchMemberIds } from "@/lib/admin";
import { notifyUsers } from "@/lib/notifications";
import { clampText, LIMITS, sanitizeAppPath } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { withSeedFallback, isDemoMode } from "@/lib/supabase-fallback";
import { isLocalPersistenceEnabled } from "@/lib/storage";
import { isSafeUrl } from "@/lib/urls";
import type { Announcement } from "@/data/seed/announcements";

const key = "build:announcements";

function readLocal(): Announcement[] {
  if (!isLocalPersistenceEnabled()) return [];
  if (typeof window === "undefined") return isDemoMode() ? SEED_ANNOUNCEMENTS : [];
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "[]") as Announcement[];
    return stored.length ? stored : isDemoMode() ? SEED_ANNOUNCEMENTS : [];
  } catch {
    return isDemoMode() ? SEED_ANNOUNCEMENTS : [];
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

function seedAnnouncements(): Announcement[] {
  if (!isDemoMode()) return [];
  return SEED_ANNOUNCEMENTS.filter((a) => a.published).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export async function fetchAnnouncements(limit = 10): Promise<Announcement[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("published", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(100, limit)));
    if (!error) {
      return withSeedFallback(
        (data ?? []).map((r) => normalize(r as Record<string, unknown>)),
        seedAnnouncements(),
      );
    }
    return seedAnnouncements();
  }
  return readLocal()
    .filter((a) => a.published)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, Math.max(1, Math.min(100, limit)));
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

async function fanOutAnnouncement(payload: { title: string; body: string; href?: string }) {
  const ids = await fetchMemberIds();
  const href = sanitizeAppPath(payload.href) ?? "/dashboard";
  await notifyUsers(ids, {
    title: payload.title,
    body: payload.body.slice(0, LIMITS.notificationBody),
    href,
  });
}

function normalizeAnnouncementHref(href?: string): string | null {
  if (!href?.trim()) return null;
  const appPath = sanitizeAppPath(href);
  if (appPath) return appPath;
  return isSafeUrl(href) ? clampText(href, LIMITS.profileUrl) : null;
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  href?: string;
  pinned?: boolean;
  notify?: boolean;
}): Promise<{ error: string | null }> {
  const title = clampText(payload.title, LIMITS.announcementTitle);
  const body = clampText(payload.body, LIMITS.announcementBody);
  const href = normalizeAnnouncementHref(payload.href);
  if (!title || !body) return { error: "Title and body are required." };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("announcements").insert({
      title,
      body,
      href,
      pinned: payload.pinned ?? false,
      published: true,
    });
    if (error) return { error: error.message };
  } else {
    const item: Announcement = {
      id: `local-a-${Date.now()}`,
      title,
      body,
      href,
      pinned: payload.pinned ?? false,
      published: true,
      created_at: new Date().toISOString(),
    };
    writeLocal([item, ...readLocal()]);
  }

  if (payload.notify !== false) {
    await fanOutAnnouncement({ title, body, href: href ?? undefined });
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
