import { Link } from "@tanstack/react-router";

import { ProjectStatusBadge, ProjectTypeBadge } from "@/components/member/ProjectBadges";
import { SectionLabel } from "@/components/landing/Section";
import { trackEvent } from "@/lib/analytics";
import { projectLink } from "@/lib/app-paths";
import { useProjectsQuery } from "@/lib/queries/use-projects";

export function FeaturedProjectsSection() {
  const { data, isLoading } = useProjectsQuery();
  const projects = (data?.projects ?? [])
    .filter((project) => project.status === "open" || project.status === "active")
    .slice(0, 3);

  return (
    <section className="border-t border-border/60 bg-background/70 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel id="live">active work</SectionLabel>
        <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-3xl font-display text-4xl leading-none tracking-tight text-bone md:text-6xl">
              Start from a real brief.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Published projects state their problem, status, owner, required skills, capacity, and
              expected weekly commitment before you apply.
            </p>
          </div>
          <Link
            to="/projects"
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.24em] text-accent-blue transition hover:text-bone"
          >
            Browse every project →
          </Link>
        </div>

        {isLoading ? (
          <div
            className="mt-10 grid gap-3 md:grid-cols-3"
            role="status"
            aria-label="Loading projects"
          >
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-sm border border-border/50" />
            ))}
          </div>
        ) : projects.length ? (
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                {...projectLink(project.slug)}
                onClick={() =>
                  trackEvent("featured_project_viewed", {
                    project_slug: project.slug,
                    project_status: project.status,
                  })
                }
                className="panel panel-interactive group flex min-h-64 flex-col rounded-sm p-6"
              >
                <div className="flex flex-wrap gap-2">
                  <ProjectTypeBadge type={project.type} />
                  <ProjectStatusBadge status={project.status} />
                </div>
                <h3 className="mt-5 font-display text-2xl tracking-tight text-bone transition group-hover:text-accent-blue">
                  {project.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  {project.lead_name ? <span>Lead · {project.lead_name}</span> : null}
                  <span>
                    Capacity · {project.team_count}/{project.capacity}
                  </span>
                  {project.weekly_commitment_hours ? (
                    <span>~{project.weekly_commitment_hours} hrs/week</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-sm border border-border/50 bg-bone/[0.02] p-7">
            <p className="font-display text-xl text-bone">
              No recruiting brief is published today.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The directory stays empty rather than presenting speculative work as open. Check the
              full project list or research labs for active threads.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link
                to="/projects"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue hover:text-bone"
              >
                Open project directory →
              </Link>
              <Link
                to="/labs"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-bone"
              >
                Explore labs
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
