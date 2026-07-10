import type { AdminStats } from "@/lib/types";

export function AdminOverviewTab({
  stats,
  pendingLeads,
}: {
  stats: AdminStats | null;
  pendingLeads: number;
}) {
  const cards = stats
    ? [
        { label: "Members", value: stats.members },
        { label: "Projects", value: stats.projects },
        { label: "Applications", value: stats.applications },
        { label: "Pending leads", value: pendingLeads || stats.pendingLeads },
        { label: "Events", value: stats.events },
        { label: "Papers", value: stats.papers },
        { label: "Jobs", value: stats.jobs },
      ]
    : [];

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Platform snapshot — members, content, applications, and pending lead requests.
      </p>
      <div className="grid gap-px bg-border/40 border border-border/40 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="stat-cell">
            <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
              {c.label}
            </p>
            <p className="font-display text-3xl text-bone mt-2">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
