import { getSupabase } from "@/lib/supabase";
import { eventState } from "@/lib/event-state";
import type { MlEvent } from "@/lib/types";

export type RegistrationStatus = "legacy" | "confirmed" | "waitlisted" | "cancelled";
const statuses: RegistrationStatus[] = ["legacy", "confirmed", "waitlisted", "cancelled"];
const unavailable = "Registration could not be confirmed. Refresh your status before trying again.";

export async function fetchMyRegistration(userId: string, eventId: string) {
  const db = getSupabase();
  if (!db) throw new Error("Event registration is temporarily unavailable.");
  const { data, error } = await db
    .from("event_rsvps")
    .select("status")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .abortSignal(AbortSignal.timeout(8000))
    .maybeSingle();
  if (error) throw new Error(unavailable);
  if (!data) return null;
  if (!statuses.includes(data.status)) throw new Error(unavailable);
  return data.status;
}

/** Caller retains requestId across an uncertain retry; never toggles on repeated clicks. */
export async function setEventRegistration(
  eventId: string,
  action: "register" | "cancel",
  requestId: string,
) {
  const db = getSupabase();
  if (!db) throw new Error("Event registration is temporarily unavailable.");
  const { data, error } = await db
    .rpc("set_event_registration", {
      p_event_id: eventId,
      p_action: action,
      p_request_id: requestId,
    })
    .abortSignal(AbortSignal.timeout(12000));
  if (error) {
    const safe = [
      "This event is full.",
      "Registration is not open.",
      "Sign in to register.",
      "Event unavailable.",
    ];
    throw new Error(safe.includes(error.message) ? error.message : unavailable);
  }
  if (!data || !statuses.includes(data)) throw new Error(unavailable);
  return data;
}

export async function fetchMyRsvpEventIds(userId: string): Promise<Set<string>> {
  const db = getSupabase();
  if (!db) throw new Error("Event registration is temporarily unavailable.");
  const { data, error } = await db
    .from("event_rsvps")
    .select("event_id")
    .eq("user_id", userId)
    .in("status", ["confirmed", "waitlisted", "legacy"])
    .abortSignal(AbortSignal.timeout(8000));
  if (error || !data) throw new Error(unavailable);
  return new Set(data.map((row) => String(row.event_id)));
}

export async function fetchMyUpcomingRsvps(userId: string, events: MlEvent[]): Promise<MlEvent[]> {
  const ids = await fetchMyRsvpEventIds(userId);
  return events
    .filter((event) => ids.has(event.id) && ["upcoming", "ongoing"].includes(eventState(event)))
    .slice(0, 5);
}
