import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { SaveButton } from "@/components/member/SaveButton";
import { TagList } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { fetchEventBySlug } from "@/lib/content";
import { daysUntil, formatDate } from "@/lib/date";
import type { MlEvent } from "@/lib/types";

export const Route = createFileRoute("/events/$slug")({
  component: EventDetailPage,
});

function EventDetailPage() {
  return (
    <RequireAuth>
      <EventDetail />
    </RequireAuth>
  );
}

function EventDetail() {
  const { slug } = Route.useParams();
  const [event, setEvent] = useState<MlEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchEventBySlug(slug).then((e) => {
      setEvent(e);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <MemberLayout>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      </MemberLayout>
    );
  }

  if (!event) {
    return (
      <MemberLayout title="Event not found">
        <Link to="/events" className="text-accent-blue hover:text-bone text-sm">
          ← Back to events
        </Link>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <Link
        to="/events"
        className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone"
      >
        ← Events
      </Link>
      <div className="mt-6">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue">
          conference / event
        </p>
        <h1 className="font-display text-4xl text-bone mt-3 tracking-tight">{event.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          <SaveButton itemType="event" itemSlug={event.slug} itemTitle={event.title} />
        </div>
        <p className="mt-2 text-muted-foreground">
          {[
            event.location,
            event.start_date && formatDate(event.start_date),
            event.end_date && `– ${formatDate(event.end_date)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <TagList tags={event.topics} className="mt-4" />
        {event.summary ? (
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{event.summary}</p>
        ) : null}

        {event.deadlines.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Deadlines
            </h2>
            <div className="grid gap-px bg-border/40 border border-border/40 sm:grid-cols-2">
              {event.deadlines.map((d) => {
                const days = daysUntil(d.date);
                return (
                  <div key={d.label} className="bg-background/70 p-4">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-bone/50">
                      {d.label}
                    </p>
                    <p className="font-display text-lg text-bone mt-1">{formatDate(d.date)}</p>
                    {days != null && days >= 0 ? (
                      <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-green mt-1">
                        {days === 0 ? "Today" : `${days} days`}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {event.prep_notes ? (
          <section className="mt-10">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
              How to prepare
            </h2>
            <p className="text-muted-foreground leading-relaxed border-l-2 border-accent-blue/40 pl-4">
              {event.prep_notes}
            </p>
          </section>
        ) : null}

        {event.resources.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Resources
            </h2>
            <ul className="space-y-2">
              {event.resources.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-accent-blue hover:text-bone transition"
                  >
                    {r.label}
                    {r.kind === "latex" ? (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        latex
                      </span>
                    ) : null}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase text-bone border border-bone/25 px-5 py-3 rounded-sm hover:bg-bone/5 transition"
          >
            Official site <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </MemberLayout>
  );
}
