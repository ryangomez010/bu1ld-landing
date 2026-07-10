import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ContentCard, EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { fetchEvents } from "@/lib/content";
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
  const [events, setEvents] = useState<MlEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    void fetchEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

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

  const visible =
    filter === "all" ? events : filter === "upcoming" ? categorized.upcoming : categorized.past;

  return (
    <MemberLayout title="Events & Conferences" eyebrow="member hub">
      <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed -mt-4">
        Upcoming ML conferences, BUILD events, deadlines, and prep resources — LaTeX templates,
        CFPs, and notes.
      </p>

      <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <StatCell label="Total events" value={String(events.length)} />
        <StatCell label="Upcoming" value={String(categorized.upcoming.length)} />
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
            ["past", "Past", categorized.past.length],
            ["all", "All", events.length],
          ] as const
        ).map(([value, label, count]) => ({ value, label, count }))}
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No events in this view"
          body="Add conference entries from Admin to keep this radar live."
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
            return (
              <ContentCard
                key={event.id}
                to={`/events/${event.slug}`}
                tag={`event / ${String(i + 1).padStart(2, "0")}`}
                title={event.title}
                summary={
                  event.prep_notes
                    ? `${event.summary ?? ""}${event.summary ? " — " : ""}Prep: ${event.prep_notes.slice(0, 80)}${event.prep_notes.length > 80 ? "…" : ""}`
                    : event.summary
                }
                meta={[
                  event.location,
                  event.start_date ? formatDate(event.start_date) : null,
                  next ? `${next.label} in ${next.days}d` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {countdown ? (
                  <span className="inline-block mt-3 font-mono text-[9px] tracking-[0.2em] uppercase text-accent-red border border-accent-red/30 px-2 py-1 rounded-sm">
                    {countdown} · {next!.label}
                  </span>
                ) : null}
                <TagList tags={event.topics} linkToSearch className="mt-4" />
              </ContentCard>
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
