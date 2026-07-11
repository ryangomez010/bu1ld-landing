import { Link } from "@tanstack/react-router";
import type { EngagementSummary } from "@/lib/engagement";

export function EngagementSummaryPanel({ stats }: { stats: EngagementSummary }) {
  const cells = [
    { label: "Papers read", value: stats.papersRead, to: "/papers" },
    { label: "Guides done", value: stats.guidesCompleted, to: "/guides" },
    { label: "In progress", value: stats.guidesInProgress, to: "/guides" },
    { label: "Active apps", value: stats.applicationsActive, to: "/applications" },
    { label: "Accepted", value: stats.applicationsAccepted, to: "/applications" },
    { label: "Events going", value: stats.eventRsvps, to: "/events" },
  ];

  return (
    <section className="section-gap">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Your activity
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Counts from your account — papers marked read, guides finished, applications in review,
            accepted project slots, and event RSVPs.
          </p>
        </div>
        <Link
          to="/saved"
          className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
        >
          {stats.savedItems} saved →
        </Link>
      </div>
      <div className="panel glass rounded-2xl overflow-hidden grid gap-px sm:grid-cols-3 lg:grid-cols-6">
        {cells.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="stat-cell relative z-[1] hover:bg-bone/[0.04] transition-colors"
          >
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl text-bone">{c.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
