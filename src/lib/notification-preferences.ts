import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

export type NotificationPrefKey =
  | "application"
  | "project_update"
  | "mention"
  | "announcement"
  | "event"
  | "digest";

export type NotificationPreference = {
  pref_key: NotificationPrefKey;
  email_enabled: boolean;
  in_app_enabled: boolean;
};

export const NOTIFICATION_PREF_LABELS: Record<
  NotificationPrefKey,
  { label: string; description: string }
> = {
  application: {
    label: "Applications",
    description:
      "Accepted, declined, or withdrawn — emailed and shown in your notifications inbox.",
  },
  project_update: {
    label: "Project updates",
    description:
      "New posts from projects you follow or are accepted onto — shown in-app and optionally by email.",
  },
  mention: {
    label: "Mentions",
    description: "When a project lead @mentions you in an update",
  },
  announcement: {
    label: "Announcements",
    description: "Pinned announcements and onboarding messages from The Bu1ld team.",
  },
  event: {
    label: "Events",
    description:
      "RSVP reminders and submission-deadline alerts for events you saved or registered for.",
  },
  digest: {
    label: "Weekly digest",
    description: "Weekly summary email of paper reviews, project activity, and upcoming deadlines.",
  },
};

const PREF_KEYS = Object.keys(NOTIFICATION_PREF_LABELS) as NotificationPrefKey[];
const STORAGE = "build:notification-prefs";

function defaults(): NotificationPreference[] {
  return PREF_KEYS.map((pref_key) => ({
    pref_key,
    email_enabled: pref_key !== "digest",
    in_app_enabled: true,
  }));
}

function readLocal(userId: string): NotificationPreference[] {
  const stored = readUserJson<NotificationPreference[]>(STORAGE, userId, []);
  if (!stored.length) return defaults();
  const map = new Map(stored.map((p) => [p.pref_key, p]));
  return PREF_KEYS.map((key) => map.get(key) ?? defaults().find((d) => d.pref_key === key)!);
}

function writeLocal(userId: string, prefs: NotificationPreference[]) {
  writeUserJson(STORAGE, userId, prefs);
}

export async function fetchNotificationPreferences(
  userId: string,
): Promise<NotificationPreference[]> {
  const supabase = getSupabase();
  if (!supabase) return withLocalFallback(defaults(), () => readLocal(userId));

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("pref_key, email_enabled, in_app_enabled")
    .eq("user_id", userId);

  if (error || !data?.length) return withLocalFallback(defaults(), () => readLocal(userId));

  const map = new Map(
    data.map((row) => [
      row.pref_key as NotificationPrefKey,
      {
        pref_key: row.pref_key as NotificationPrefKey,
        email_enabled: Boolean(row.email_enabled),
        in_app_enabled: Boolean(row.in_app_enabled),
      },
    ]),
  );
  return PREF_KEYS.map((key) => map.get(key) ?? defaults().find((d) => d.pref_key === key)!);
}

export async function updateNotificationPreference(
  userId: string,
  prefKey: NotificationPrefKey,
  patch: Partial<Pick<NotificationPreference, "email_enabled" | "in_app_enabled">>,
): Promise<{ error: string | null }> {
  const current = await fetchNotificationPreferences(userId);
  const next = current.map((p) => (p.pref_key === prefKey ? { ...p, ...patch } : p));
  persistLocally(() => writeLocal(userId, next));

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const updated = next.find((p) => p.pref_key === prefKey)!;
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      pref_key: prefKey,
      email_enabled: updated.email_enabled,
      in_app_enabled: updated.in_app_enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,pref_key" },
  );
  return { error: error?.message ?? null };
}

/** Check if in-app notification should be delivered for a category. */
export async function shouldNotifyInApp(
  userId: string,
  prefKey: NotificationPrefKey,
): Promise<boolean> {
  const prefs = await fetchNotificationPreferences(userId);
  return prefs.find((p) => p.pref_key === prefKey)?.in_app_enabled ?? true;
}
