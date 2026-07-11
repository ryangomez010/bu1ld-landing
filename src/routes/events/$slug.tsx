import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { TagList } from "@/components/member/ContentCard";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { ShareButton } from "@/components/member/ShareButton";
import { Button } from "@/components/ui/button";
import { buildIcsEvent, downloadIcs } from "@/lib/calendar";
import { fetchEventBySlug, fetchEvents, relatedEvents } from "@/lib/content";
import { eventLink } from "@/lib/app-paths";
import { daysUntil, formatDate } from "@/lib/date";
import { fetchRsvpCount, isRsvped, toggleEventRsvp } from "@/lib/event-rsvp";
import { useAuth } from "@/lib/auth";
import type { MlEvent } from "@/lib/types";

export const Route = createFileRoute("/events/$slug")({
  component: EventDetailPage,
});

function EventDetailPage() {
  return (
    <RequireMember>
      <EventDetail />
    </RequireMember>
  );
}

function EventDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<MlEvent | null>(null);
  const [related, setRelated] = useState<MlEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvped, setRsvped] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  useEffect(() => {
    void Promise.all([fetchEventBySlug(slug), fetchEvents()]).then(([e, all]) => {
      setEvent(e);
      if (e) setRelated(relatedEvents(e, all));
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!user || !event) return;
    void isRsvped(user.id, event.id).then(setRsvped);
    void fetchRsvpCount(event.id).then(setRsvpCount);
  }, [user, event?.id]);

  const onToggleRsvp = async () => {
    if (!user || !event) return;
    setRsvpBusy(true);
    const { rsvped: next, error } = await toggleEventRsvp(user.id, event);
    setRsvpBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setRsvped(next);
    setRsvpCount((c) => Math.max(0, c + (next ? 1 : -1)));
    toast.success(next ? "You're on the list." : "RSVP removed.");
  };

  if (loading) {
    return (
      <MemberLayout>
        <LoadingState />
      </MemberLayout>
    );
  }

  if (!event) {
    return (
      <MemberLayout title="Event not found">
        <p className="text-muted-foreground mb-4 max-w-xl leading-relaxed">
          This event may have been removed or the slug changed. Check the events calendar for
          upcoming deadlines and prep notes.
        </p>
        <Link to="/events" className="text-accent-blue hover:text-bone text-sm">
          ← Back to events
        </Link>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <PageBackLink to="/events" label="Events" />
      <div className="mt-2">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue">
          conference / event
        </p>
        <h1 className="font-display text-4xl text-bone mt-3 tracking-tight">{event.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <SaveToCollectionButton itemType="event" itemSlug={event.slug} itemTitle={event.title} />
          <ShareButton title={event.title} />
          <ReportContentButton contentType="event" contentSlug={event.slug} />
          {event.start_date ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="font-mono text-[9px] tracking-[0.15em] uppercase"
              onClick={() => {
                const ics = buildIcsEvent({
                  title: event.title,
                  startDate: event.start_date!,
                  endDate: event.end_date,
                  description: event.summary ?? undefined,
                  location: event.location,
                  url: event.url,
                });
                downloadIcs(`${event.slug}.ics`, ics);
              }}
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
              Add to calendar
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={rsvped ? "default" : "outline"}
            disabled={rsvpBusy}
            className="font-mono text-[9px] tracking-[0.15em] uppercase"
            onClick={() => void onToggleRsvp()}
          >
            {rsvpBusy ? "…" : rsvped ? "Going ✓" : "RSVP"}
          </Button>
          {rsvpCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {rsvpCount} going
            </span>
          ) : null}
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
        <TagList tags={event.topics} linkToSearch className="mt-4" />

        {event.prep_notes ? (
          <div className="mt-6 rounded-sm border border-accent-blue/30 bg-accent-blue/5 px-5 py-4">
            <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-blue mb-2">
              How to prepare
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">{event.prep_notes}</p>
          </div>
        ) : null}

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

        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Related events
            </h2>
            <div className="grid gap-px border border-border/40 bg-border/40">
              {related.map((r) => (
                <Link
                  key={r.id}
                  {...eventLink(r.slug)}
                  className="bg-background/75 p-5 hover:bg-bone/5 transition block"
                >
                  <h3 className="font-display text-lg text-bone">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </MemberLayout>
  );
}
