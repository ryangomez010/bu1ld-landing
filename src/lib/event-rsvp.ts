import { getSupabase } from "@/lib/supabase";
import type { MlEvent } from "@/lib/types";

export type EventRsvp = {
  user_id: string;
  event_id: string;
  created_at: string;
};

export async function fetchMyRsvpEventIds(userId: string): Promise<Set<string>> {
  const supabase = getSupabase();
  if (!supabase) return new Set();

  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("user_id", userId);

  if (error || !data) return new Set();
  return new Set(data.map((r) => String(r.event_id)));
}

export async function fetchRsvpCount(eventId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("event_rsvps")
    .select("event_id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) return 0;
  return count ?? 0;
}

export async function isRsvped(userId: string, eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  return !!data;
}

export async function toggleEventRsvp(
  userId: string,
  event: MlEvent,
): Promise<{ rsvped: boolean; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { rsvped: false, error: "Event registration is temporarily unavailable." };

  const existing = await isRsvped(userId, event.id);
  if (existing) {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", event.id);
    return { rsvped: false, error: error?.message ?? null };
  }

  const { error } = await supabase.from("event_rsvps").insert({
    user_id: userId,
    event_id: event.id,
  });
  return { rsvped: true, error: error?.message ?? null };
}

export async function fetchMyUpcomingRsvps(userId: string, events: MlEvent[]): Promise<MlEvent[]> {
  const ids = await fetchMyRsvpEventIds(userId);
  if (!ids.size) return [];
  const now = new Date();
  return events
    .filter((e) => ids.has(e.id))
    .filter((e) => !e.end_date || new Date(e.end_date) >= now)
    .slice(0, 5);
}
