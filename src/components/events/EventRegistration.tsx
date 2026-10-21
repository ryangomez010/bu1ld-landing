import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { eventRegistrationState, eventState, publicHttpUrl } from "@/lib/event-state";
import {
  fetchMyRegistration,
  setEventRegistration,
  type RegistrationStatus,
} from "@/lib/event-rsvp";
import type { MlEvent } from "@/lib/types";

export function EventRegistration({ event }: { event: MlEvent }) {
  const { user } = useAuth();
  return (
    <RegistrationAccount
      key={`${event.id}:${user?.id ?? "anonymous"}`}
      event={event}
      userId={user?.id}
    />
  );
}

function RegistrationAccount({ event, userId }: { event: MlEvent; userId?: string }) {
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const pending = useRef<{ action: "register" | "cancel"; id: string } | null>(null);
  const locked = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchMyRegistration(userId, event.id)
      .then((value) => {
        if (active) {
          setStatus(value);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Status unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, event.id, event.updated_at, refresh]);
  const mutate = async (action: "register" | "cancel") => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    if (pending.current?.action !== action) pending.current = { action, id: crypto.randomUUID() };
    try {
      const value = await setEventRegistration(event.id, action, pending.current.id);
      if (live.current) {
        setStatus(value);
        pending.current = null;
      }
    } catch (reason) {
      if (live.current) setError(reason instanceof Error ? reason.message : "Status unavailable.");
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  };
  const state = eventRegistrationState(event);
  const open = state === "open" || state === "waitlist";
  const destination = publicHttpUrl(event.registration_url);
  const terminal = ["cancelled", "postponed", "completed"].includes(eventState(event));
  const held = status === "confirmed" || status === "waitlisted" || status === "legacy";
  return (
    <div className="mt-6 space-y-4 rounded-sm border border-border p-5">
      <p>
        Registration: <strong>{state}</strong>
      </p>
      {event.registration_deadline ? (
        <p className="text-sm">
          Deadline: {event.registration_deadline} · {event.timezone ?? "timezone unconfirmed"}
        </p>
      ) : null}
      {event.registration_mode === "external" && open && destination ? (
        <>
          <a
            href={destination}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-accent-blue underline"
          >
            Register with the organizer ↗
          </a>
          <p className="text-sm text-muted-foreground">
            You are leaving BU1LD. Only the organizer can confirm your registration; opening this
            link does not reserve a place.
          </p>
        </>
      ) : null}
      {event.registration_mode === "internal" || userId ? (
        <>
          {!userId ? (
            open ? (
              <Link
                to="/login"
                search={{ redirect: `/events/${event.slug}` }}
                className="inline-flex min-h-11 items-center text-accent-blue underline"
              >
                Sign in to register
              </Link>
            ) : null
          ) : (
            <>
              {loading ? (
                <p role="status">Checking your registration…</p>
              ) : error && !status ? (
                <p role="status">Your registration status is unavailable.</p>
              ) : (
                <p role="status">
                  {event.registration_mode !== "internal" && held
                    ? "Your earlier BU1LD registration is retained. Registration is now managed differently; check with the organizer. You can cancel the BU1LD record below."
                    : terminal && held
                      ? "Your earlier registration is retained; this event is " +
                        eventState(event) +
                        "."
                      : status === "confirmed"
                        ? "Your place is confirmed and saved to your account."
                        : status === "waitlisted"
                          ? "You are on the waitlist. A place is not yet confirmed. Refresh here to check for promotion."
                          : status === "legacy"
                            ? "An earlier RSVP is on file. The organizer must verify its status."
                            : status === "cancelled"
                              ? "Your registration is cancelled."
                              : "You have no registration on file."}
                </p>
              )}
              {error ? (
                <p role="alert" className="text-accent-red">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {!held && open && !loading && event.registration_mode === "internal" ? (
                  <button
                    disabled={busy || (!!error && !pending.current)}
                    onClick={() => void mutate("register")}
                    className="min-h-11 rounded-sm border border-border px-4 disabled:opacity-50"
                  >
                    {busy ? "Saving…" : state === "waitlist" ? "Join waitlist" : "Register"}
                  </button>
                ) : null}
                {held ? (
                  <button
                    disabled={busy || loading}
                    onClick={() => void mutate("cancel")}
                    className="min-h-11 rounded-sm border border-border px-4 disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Cancel my registration"}
                  </button>
                ) : null}
                <button
                  disabled={busy || loading}
                  onClick={() => setRefresh((value) => value + 1)}
                  className="min-h-11 px-2 underline disabled:opacity-50"
                >
                  Refresh my status
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account records the result. No confirmation email is promised. When capacity is
                reached, registration joins the waitlist only if the organizer enabled it.
              </p>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Registration details have not been verified. No place can be reserved here.
        </p>
      )}
    </div>
  );
}
