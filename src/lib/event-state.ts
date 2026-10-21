import type { MlEvent } from "@/lib/types";

export type EventState =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "postponed"
  | "unconfirmed";
export type EventOperations = {
  starts_at?: string | null;
  ends_at?: string | null;
  archived?: boolean;
  registration_opens_at?: string | null;
  operational_state?: "scheduled" | "cancelled" | "postponed";
  timezone?: string | null;
  registration_state?: "open" | "closed" | "waitlist";
  registration_deadline?: string | null;
  verified_at?: string | null;
};

/** Date-only entries are calendar days, never invented local meeting times. */
export function eventDate(value: string | null | undefined, endOfDay = false): number | null {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (
    !dateOnly &&
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      value,
    )
  )
    return null;
  const day = Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value.slice(0, 10))
    return null;
  const timestamp = Date.parse(dateOnly ? `${value}T00:00:00Z` : value);
  if (!Number.isFinite(timestamp)) return null;
  if (dateOnly && new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp + (dateOnly && endOfDay ? 86_400_000 : 0);
}

export function eventState(
  event: Pick<MlEvent, "start_date" | "end_date"> & EventOperations,
  now = Date.now(),
): EventState {
  if (event.operational_state === "cancelled" || event.operational_state === "postponed")
    return event.operational_state;
  const start = eventDate(event.starts_at ?? event.start_date);
  const end = eventDate(event.ends_at ?? event.end_date, true);
  if (start == null || (end != null && end <= start)) return "unconfirmed";
  if (end != null && now >= end) return "completed";
  if (now < start) return "upcoming";
  // A missing end cannot become an indefinitely live event.
  return end == null ? "unconfirmed" : "ongoing";
}

export function eventRegistrationState(
  event: Pick<MlEvent, "start_date" | "end_date"> & EventOperations,
  now = Date.now(),
) {
  const state = eventState(event, now);
  if (event.archived || ["completed", "cancelled", "postponed"].includes(state)) return "closed";
  if (!event.verified_at || !event.registration_state) return "unconfirmed";
  if (state === "unconfirmed") return "unconfirmed";
  const opens = eventDate(event.registration_opens_at);
  if (event.registration_opens_at && opens == null) return "unconfirmed";
  if (opens != null && now < opens) return "closed";
  const deadline = eventDate(event.registration_deadline, true);
  // Date-only registration cutoffs need an organizer timezone; do not infer midnight UTC.
  if (event.registration_deadline && /^\d{4}-\d{2}-\d{2}$/.test(event.registration_deadline))
    return "unconfirmed";
  if (event.registration_deadline && deadline == null) return "unconfirmed";
  if (deadline != null && now >= deadline) return "closed";
  return event.registration_state;
}

export function publicHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
