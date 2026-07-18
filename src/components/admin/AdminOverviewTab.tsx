import type { AdminStats } from "@/lib/types";

export function AdminOverviewTab({
  stats,
  pendingLeads,
}: {
  stats: AdminStats | null;
  pendingLeads: number;
}) {
  const ops = stats
    ? [
        { label: "Contribution reviews", value: stats.pendingContributionReviews },
        { label: "Overdue milestones", value: stats.overdueMilestones },
        { label: "Projects without lead", value: stats.projectsWithoutLead },
        { label: "Stalled projects (30d)", value: stats.stalledProjects },
        { label: "Verified work", value: stats.verifiedContributions },
        { label: "Project publication queue", value: stats.pendingProjectReviews },
        { label: "Program decisions", value: stats.pendingProgramApplications },
        { label: "Pending leads", value: pendingLeads || stats.pendingLeads },
      ]
    : [];

  const inventory = stats
    ? [
        { label: "Members", value: stats.members },
        { label: "Projects", value: stats.projects },
        { label: "Applications", value: stats.applications },
        { label: "Contributions", value: stats.contributions },
        { label: "Evidence claims", value: stats.evidenceClaims },
        { label: "Programs", value: stats.programs },
        { label: "Events", value: stats.events },
        { label: "Papers", value: stats.papers },
        { label: "Jobs", value: stats.jobs },
      ]
    : [];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl text-bone">Leadership ops</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Actionable queues — review backlog, overdue work, owner gaps, and stalled threads. Prefer
          these over raw member counts.
        </p>
        <div className="mt-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
          {ops.map((c) => (
            <div key={c.label} className="stat-cell">
              <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-2 font-display text-3xl text-bone">{c.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-bone">Inventory</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Catalog size for context — not a substitute for verified output.
        </p>
        <div className="mt-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
          {inventory.map((c) => (
            <div key={c.label} className="stat-cell">
              <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-2 font-display text-3xl text-bone">{c.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
