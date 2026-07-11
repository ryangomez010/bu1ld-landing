import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { eventLink } from "@/lib/app-paths";
import { fetchEvents } from "@/lib/content";
import { fetchMyRsvpEventIds, toggleEventRsvp } from "@/lib/event-rsvp";
import { daysUntil, formatDate, nearestDeadline } from "@/lib/date";
import type { MlEvent } from "@/lib/types";

export const Route = createFileRoute("/events/")({
  component: EventsPage,
});

function EventsPage() {
  return (
    <RequireMember>
      <EventsContent />
    </RequireMember>
  );
}

function EventsContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<MlEvent[]>([]);
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "going">("upcoming");
  const [rsvpBusy, setRsvpBusy] = useState<string | null>(null);

  const onToggleRsvp = async (event: MlEvent) => {
    if (!user) return;
    setRsvpBusy(event.id);
    const { rsvped, error } = await toggleEventRsvp(user.id, event);
    setRsvpBusy(null);
    if (error) {
      toast.error(error);
      return;
    }
    setRsvpIds((prev) => {
      const next = new Set(prev);
      if (rsvped) next.add(event.id);
      else next.delete(event.id);
      return next;
    });
    toast.success(rsvped ? "RSVP added." : "RSVP removed.");
  };

  useEffect(() => {
    void fetchEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchMyRsvpEventIds(user.id).then(setRsvpIds);
  }, [user]);

  const categorized = useMemo(() => {
    const upcoming: MlEvent[] = [];
    const past: MlEvent[] = [];
    for (const e of events) {
      const next = nearestDeadline(e.deadlines);
      const endDays = e.end_date ? daysUntil(e.end_date) : null;
      const startDays = e.start_date ? daysUntil(e.start_date) : null;
      const stillLive =
        (next && next.days >= 0) ||
        (endDays != null && endDays >= 0) ||
        (startDays != null && startDays >= 0) ||
        (!e.start_date && !e.end_date && !e.deadlines.length);
      if (stillLive) upcoming.push(e);
      else past.push(e);
    }
    return { upcoming, past };
  }, [events]);

  const goingEvents = useMemo(() => events.filter((e) => rsvpIds.has(e.id)), [events, rsvpIds]);

  const visible = useMemo(() => {
    if (filter === "going") return goingEvents;
    if (filter === "all") return events;
    if (filter === "upcoming") return categorized.upcoming;
    return categorized.past;
  }, [filter, events, categorized, goingEvents]);

  return (
    <MemberLayout title="Events & Conferences" eyebrow="deadlines & RSVPs">
      <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed -mt-4">
        ML conference submission deadlines, workshop dates, and internal meetups. Each event lists
        CFP dates, prep notes, and LaTeX templates — RSVP to track attendance and export deadlines
        to your calendar as .ics files.
      </p>

      <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-4">
        <StatCell label="Total events" value={String(events.length)} />
        <StatCell label="Upcoming" value={String(categorized.upcoming.length)} />
        <StatCell label="You're going" value={String(goingEvents.length)} />
        <StatCell
          label="Topics tracked"
          value={String(new Set(events.flatMap((e) => e.topics)).size)}
        />
      </div>

      <FilterBar
        className="mb-6"
        value={filter}
        onChange={setFilter}
        options={(
          [
            ["upcoming", "Upcoming", categorized.upcoming.length],
            ["going", "Going", goingEvents.length],
            ["past", "Past", categorized.past.length],
            ["all", "All", events.length],
          ] as const
        ).map(([value, label, count]) => ({ value, label, count }))}
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === "going" ? "No RSVPs yet" : "No events in this view"}
          body={
            filter === "going"
              ? "RSVP on an event detail page — your attendance shows here and in dashboard deadlines."
              : "No events match this filter. Upcoming includes conferences with open submission deadlines; Past shows ended events."
          }
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {visible.map((event, i) => {
            const next = nearestDeadline(event.deadlines);
            const countdown =
              next && next.days != null && next.days >= 0
                ? next.days === 0
                  ? "Due today"
                  : `${next.days}d left`
                : null;
            const going = rsvpIds.has(event.id);
            return (
              <article
                key={event.id}
                className="panel flex flex-col sm:flex-row sm:items-stretch gap-0 rounded-sm overflow-hidden"
              >
                <Link
                  {...eventLink(event.slug)}
                  className="flex-1 block p-6 hover:bg-bone/5 transition group"
                >
                  <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-accent-blue/80">
                    event / {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl text-bone mt-2 tracking-tight group-hover:text-accent-blue transition-colors">
                    {event.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {event.prep_notes
                      ? `${event.summary ?? ""}${event.summary ? " — " : ""}Prep: ${event.prep_notes.slice(0, 80)}${event.prep_notes.length > 80 ? "…" : ""}`
                      : event.summary}
                  </p>
                  <p className="mt-4 font-mono text-[9px] tracking-[0.22em] uppercase text-muted-foreground/80">
                    {[
                      event.location,
                      event.start_date ? formatDate(event.start_date) : null,
                      next ? `${next.label} in ${next.days}d` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {going ? (
                      <span className="inline-block font-mono text-[9px] tracking-[0.2em] uppercase text-accent-green border border-accent-green/30 px-2 py-1 rounded-sm">
                        Going ✓
                      </span>
                    ) : null}
                    {countdown ? (
                      <span className="inline-block font-mono text-[9px] tracking-[0.2em] uppercase text-accent-red border border-accent-red/30 px-2 py-1 rounded-sm">
                        {countdown} · {next!.label}
                      </span>
                    ) : null}
                  </div>
                  <TagList tags={event.topics} linkToSearch className="mt-4" />
                </Link>
                <div className="flex sm:flex-col items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-border/40 px-4 py-3 sm:py-6 sm:min-w-[7rem] bg-background/50">
                  <Button
                    type="button"
                    size="sm"
                    variant={going ? "default" : "outline"}
                    disabled={rsvpBusy === event.id}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase w-full sm:w-auto"
                    onClick={() => void onToggleRsvp(event)}
                  >
                    {rsvpBusy === event.id ? "…" : going ? "Going" : "RSVP"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </MemberLayout>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/75 p-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}
