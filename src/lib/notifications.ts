import { getSupabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";

const allKey = "build:notifications:all";

function readLocal(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(allKey) ?? "[]") as Notification[];
  } catch {
    return [];
  }
}

function writeLocal(items: Notification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(allKey, JSON.stringify(items));
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data?.length) return data as Notification[];
  }
  return readLocal()
    .filter((n) => n.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function unreadCount(userId: string): Promise<number> {
  const items = await fetchNotifications(userId);
  return items.filter((n) => !n.read).length;
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", userId);
    return;
  }
  const items = readLocal().map((n) => (n.id === id ? { ...n, read: true } : n));
  writeLocal(items);
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    return;
  }
  writeLocal(readLocal().map((n) => (n.user_id === userId ? { ...n, read: true } : n)));
}

export async function deleteNotification(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
    return;
  }
  writeLocal(readLocal().filter((n) => !(n.id === id && n.user_id === userId)));
}

export async function createNotification(
  userId: string,
  payload: { title: string; body: string; href?: string },
): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      href: payload.href ?? null,
      read: false,
    });
    return;
  }

  const notification: Notification = {
    id: `local-n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    title: payload.title,
    body: payload.body,
    href: payload.href ?? null,
    read: false,
    created_at: now,
  };
  writeLocal([notification, ...readLocal()]);
}
