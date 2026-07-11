import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";
import { shouldUseNotifyUsersRpc } from "@/lib/auth-guards";
import { clampText, LIMITS, sanitizeAppPath } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";

const STORAGE_BASE = "build:notifications";

function readLocal(userId: string): Notification[] {
  return readUserJson<Notification[]>(STORAGE_BASE, userId, []);
}

function writeLocal(userId: string, items: Notification[]) {
  writeUserJson(STORAGE_BASE, userId, items);
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      return data.map((n) => ({
        ...n,
        href: sanitizeAppPath(n.href as string | null) ?? null,
      })) as Notification[];
    }
  }
  return withLocalFallback([], () =>
    readLocal(userId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
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
  persistLocally(() =>
    writeLocal(
      userId,
      readLocal(userId).map((n) => (n.id === id ? { ...n, read: true } : n)),
    ),
  );
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    return;
  }
  persistLocally(() =>
    writeLocal(
      userId,
      readLocal(userId).map((n) => ({ ...n, read: true })),
    ),
  );
}

export async function deleteNotification(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
    return;
  }
  persistLocally(() =>
    writeLocal(
      userId,
      readLocal(userId).filter((n) => n.id !== id),
    ),
  );
}

export type CreateNotificationOptions = {
  /** Required when notifying project subscribers or mentions from a project update. */
  projectId?: string;
};

export async function createNotification(
  userId: string,
  payload: { title: string; body: string; href?: string },
  opts?: CreateNotificationOptions,
): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getSupabase();
  const title = clampText(payload.title, LIMITS.notificationTitle);
  const body = clampText(payload.body, LIMITS.notificationBody);
  const href = sanitizeAppPath(payload.href) ?? null;
  if (!title || !body) return;

  if (supabase) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    if (!shouldUseNotifyUsersRpc(sessionUser?.id, userId)) {
      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        title,
        body,
        href,
        read: false,
      });
      if (error) console.error("[notifications]", error.message);
      return;
    }

    const { error } = await supabase.rpc("notify_users", {
      target_user_ids: [userId],
      p_title: title,
      p_body: body,
      p_href: href,
      p_project_id: opts?.projectId ?? null,
    });
    if (error) console.error("[notifications:rpc]", error.message);
    return;
  }

  const notification: Notification = {
    id: `local-n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    title,
    body,
    href,
    read: false,
    created_at: now,
  };
  persistLocally(() => writeLocal(userId, [notification, ...readLocal(userId)]));
}

/** Fan-out notifications to many users (admin announcements, etc.). */
export async function notifyUsers(
  userIds: string[],
  payload: { title: string; body: string; href?: string },
  opts?: CreateNotificationOptions,
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;

  const title = clampText(payload.title, LIMITS.notificationTitle);
  const body = clampText(payload.body, LIMITS.notificationBody);
  const href = sanitizeAppPath(payload.href) ?? null;
  if (!title || !body) return;

  const supabase = getSupabase();
  if (supabase) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    const selfOnly = unique.length === 1 && unique[0] === sessionUser?.id;

    if (selfOnly && sessionUser) {
      await createNotification(sessionUser.id, payload, opts);
      return;
    }

    const { error } = await supabase.rpc("notify_users", {
      target_user_ids: unique,
      p_title: title,
      p_body: body,
      p_href: href,
      p_project_id: opts?.projectId ?? null,
    });
    if (error) console.error("[notifications:rpc-bulk]", error.message);
    return;
  }

  await Promise.all(unique.map((id) => createNotification(id, payload, opts)));
}

/** Subscribe to realtime notification inserts/updates for the current user. */
export function subscribeNotifications(
  userId: string,
  onChange: () => void,
): (() => void) | undefined {
  const supabase = getSupabase();
  if (!supabase) return undefined;

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Infer notification category for filtering. */
export type NotificationCategory = "application" | "announcement" | "lead" | "other";

export function notificationCategory(n: Notification): NotificationCategory {
  const hay = `${n.title} ${n.body}`.toLowerCase();
  if (hay.includes("application") || hay.includes("waitlist") || hay.includes("not selected")) {
    return "application";
  }
  if (hay.includes("lead") || hay.includes("project lead")) return "lead";
  if (hay.includes("announcement") || hay.includes("welcome") || n.href?.includes("/dashboard")) {
    return "announcement";
  }
  return "other";
}

/** Group notifications by calendar day label. */
export function groupNotificationsByDay(
  items: Notification[],
): { label: string; items: Notification[] }[] {
  const groups = new Map<string, Notification[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const n of items) {
    const d = new Date(n.created_at);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const list = groups.get(label) ?? [];
    list.push(n);
    groups.set(label, list);
  }
  return Array.from(groups.entries()).map(([label, groupItems]) => ({ label, items: groupItems }));
}

/** Migrate legacy global notification key to per-user storage. */
export function migrateLegacyNotifications(userId: string): void {
  if (typeof window === "undefined") return;
  const legacyKey = "build:notifications:all";
  const legacy = localStorage.getItem(legacyKey);
  if (!legacy) return;
  try {
    const items = JSON.parse(legacy) as Notification[];
    const mine = items.filter((n) => n.user_id === userId);
    if (mine.length) {
      const existing = readLocal(userId);
      writeLocal(userId, [...mine, ...existing]);
    }
    localStorage.removeItem(legacyKey);
  } catch {
    localStorage.removeItem(legacyKey);
  }
}
