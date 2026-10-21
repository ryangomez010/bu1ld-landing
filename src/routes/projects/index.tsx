import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterChip } from "@/components/member/FilterChip";
import { InterestMatchTags } from "@/components/member/InterestMatchTags";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import {
  ApplicationStatusBadge,
  ProjectStatusBadge,
  ProjectTypeBadge,
} from "@/components/member/ProjectBadges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { projectLink } from "@/lib/app-paths";
import { fetchProjects } from "@/lib/projects";
import { useProjectsQuery } from "@/lib/queries/use-projects";
import { recommendProjects } from "@/lib/personalization";
import { filterProjects, projectSearchSchema, type ProjectSearch } from "@/lib/project-discovery";
import { pageHead } from "@/lib/seo";
import { PROJECT_STATUS_LABEL } from "@/data/seed/projects";
import type { ApplicationStatus } from "@/lib/types";

export const Route = createFileRoute("/projects/")({
  validateSearch: (search) => projectSearchSchema.parse(search),
  loader: async () => {
    try {
      return {
        state: "ready" as const,
        projects: await fetchProjects(undefined, { throwOnUnavailable: true }),
      };
    } catch {
      return { state: "unavailable" as const, projects: null };
    }
  },
  component: ProjectsPage,
  head: () =>
    pageHead({
      title: "Projects — The Bu1ld",
      description:
        "Browse scoped machine-learning research and product projects by status, skills, capacity, and weekly commitment.",
      path: "/projects",
    }),
});

const EMPTY_PROJECTS: import("@/lib/types").Project[] = [];
const EMPTY_APPLICATION_STATUSES = new Map<string, ApplicationStatus>();

function ProjectsPage() {
  const { user } = useAuth();
  const content = <ProjectsContent />;
  return user ? (
    <MemberLayout title="Projects" eyebrow="join & build">
      {content}
    </MemberLayout>
  ) : (
    <InstitutionLayout
      eyebrow="Research and startup opportunities"
      title="Find a concrete problem to work on."
      description="Review published project briefs, required skills, expected commitment, capacity, and current status before creating an account."
    >
      {content}
    </InstitutionLayout>
  );
}

function ProjectsContent() {
  const { user, profile } = useAuth();
  const initial = Route.useLoaderData();
  const {
    data,
    isLoading: queryLoading,
    isError: queryError,
    isFetching,
    refetch,
  } = useProjectsQuery(undefined, user?.id, initial.projects ?? undefined);
  const isError = queryError || (!data && initial.state === "unavailable");
  const loading = queryLoading && !isError;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const projects = data?.projects ?? EMPTY_PROJECTS;
  const applied = data?.statusMap ?? EMPTY_APPLICATION_STATUSES;
  const statusFilter = search.status ?? "all";
  const typeFilter = search.type ?? "all";
  const query = search.q ?? "";
  const hasFilters = Boolean(query.trim() || statusFilter !== "all" || typeFilter !== "all");
  const updateSearch = (patch: Partial<ProjectSearch>) => {
    void navigate({
      search: { ...search, ...patch },
      replace: true,
      resetScroll: false,
    });
  };
  const resetFilters = () => void navigate({ search: {}, replace: true, resetScroll: false });

  const open = projects.filter((p) => p.status === "open");
  const alumni = projects.filter((p) => p.status === "closed");

  const list = useMemo(() => filterProjects(projects, search), [projects, search]);

  const recommendations = useMemo(() => {
    const appliedIds = new Set([...applied.keys()].map((id) => id));
    return recommendProjects(projects, profile?.interests ?? [], {
      excludeIds: appliedIds,
      limit: 3,
      memberSkills: profile?.member_skills ?? [],
      desiredRoles: profile?.desired_roles ?? [],
    });
  }, [projects, profile?.interests, profile?.member_skills, profile?.desired_roles, applied]);

  return (
    <>
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Open research threads, startup builds, and program cohorts. Each listing shows capacity and
        required skills — filter by type to find research vs product work. Your profile (bio,
        background, interests, skills, links) attaches automatically when you submit a pitch.
        {profile?.availability_hours_per_week
          ? ` Your profile lists ~${profile.availability_hours_per_week} hours/week available.`
          : ""}
      </p>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <div className="panel p-4 rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Recruiting
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{data ? open.length : "—"}</p>
        </div>
        <div className="panel p-4 rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Active
          </p>
          <p className="mt-2 font-display text-2xl text-bone">
            {data ? projects.filter((p) => p.status === "active").length : "—"}
          </p>
        </div>
        <div className="panel p-4 rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Closed
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{data ? alumni.length : "—"}</p>
        </div>
      </div>

      <div className="mb-6 space-y-4 rounded-sm border border-border/60 bg-background/85 p-4">
        <label htmlFor="project-search" className="block text-sm font-medium text-bone">
          Find a project by name, skill, or topic
        </label>
        <Input
          id="project-search"
          type="search"
          value={query}
          maxLength={200}
          onChange={(event) => updateSearch({ q: event.target.value || undefined })}
          placeholder="Try PyTorch, world models, or CUDA"
          className="h-12 text-base"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Project status">
          <span className="mr-1 text-sm text-muted-foreground">Status</span>
          {(["all", "open", "active", "closed"] as const).map((f) => (
            <FilterChip
              key={f}
              active={statusFilter === f}
              onClick={() => updateSearch({ status: f === "all" ? undefined : f })}
              className="min-h-11 text-xs"
            >
              {f === "all" ? "all" : (PROJECT_STATUS_LABEL[f] ?? f).toLowerCase()}
              {f === "open" && data ? ` (${open.length})` : ""}
            </FilterChip>
          ))}
          {user ? (
            <Link
              to="/applications"
              className="ml-auto font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone transition-colors"
            >
              My applications →
            </Link>
          ) : (
            <Link
              to="/signup"
              search={{ redirect: "/projects" }}
              className="ml-auto font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone transition-colors"
            >
              Create account to apply →
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Project type">
          <span className="mr-1 text-sm text-muted-foreground">Type</span>
          {(["all", "research", "startup", "program"] as const).map((f) => (
            <FilterChip
              key={f}
              active={typeFilter === f}
              onClick={() => updateSearch({ type: f === "all" ? undefined : f })}
              className="min-h-11 text-xs"
            >
              {f}
            </FilterChip>
          ))}
        </div>
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {loading
              ? "Loading projects…"
              : !data
                ? "Project counts are unavailable"
                : `${list.length} of ${projects.length} projects${hasFilters ? " match your filters" : " · all statuses included"}`}
          </p>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 text-sm"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {recommendations.length > 0 && !hasFilters ? (
        <section className="mb-8 rounded-sm border border-accent-green/20 bg-accent-green/5 px-5 py-5">
          <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green mb-2">
            Matches your interests
          </h2>
          <p className="text-xs text-muted-foreground mb-4 max-w-2xl">
            Open projects ranked by overlap between your profile interest tags and project
            tags/skills — excludes projects you already applied to.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {recommendations.map(({ project, matchTags, reason }) => (
              <Link
                key={project.id}
                {...projectLink(project.slug)}
                className="panel panel-interactive p-4 rounded-sm block"
              >
                <h3 className="font-display text-base text-bone">{project.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                {matchTags.length ? (
                  <p className="mt-2 font-mono text-[8px] uppercase text-accent-green">{reason}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="mb-6 rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-6"
        >
          <h2 className="font-display text-xl text-bone">
            We couldn’t refresh the project directory.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {data
              ? "Showing the last loaded projects. Availability may have changed."
              : "Please try again. You can still explore the research atlas while the directory is unavailable."}{" "}
            Your filters are saved.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? "Retrying…" : "Retry projects"}
            </Button>
            <Link
              to="/research-atlas"
              className="inline-flex min-h-11 items-center text-sm text-accent-blue hover:text-bone"
            >
              Explore the research atlas →
            </Link>
          </div>
        </div>
      ) : null}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : isError && !data ? null : list.length === 0 ? (
        <EmptyState
          title={
            projects.length === 0 ? "No published projects yet" : "No projects match these filters"
          }
          body={
            projects.length === 0
              ? "When leads publish projects, they appear here with skills, capacity, and commitment. Explore labs or compare program paths in the meantime."
              : "Try a broader skill or topic, or clear your filters to see projects across every status and type."
          }
          action={
            hasFilters ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={resetFilters}>
                Clear all filters
              </Button>
            ) : (
              <Link
                to="/labs"
                className="inline-flex min-h-11 items-center text-sm text-accent-blue hover:text-bone"
              >
                Explore research labs →
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-2">
          {list.map((project) => (
            <Link
              key={project.id}
              {...projectLink(project.slug)}
              className="panel panel-interactive group block p-6 rounded-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ProjectTypeBadge type={project.type} />
                <ProjectStatusBadge status={project.status} />
                {applied.has(project.id) ? (
                  <ApplicationStatusBadge status={applied.get(project.id)!} />
                ) : null}
                {project.status === "open" && project.team_count >= project.capacity ? (
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-red border border-accent-red/30 px-2 py-1 rounded-sm">
                    Full
                  </span>
                ) : null}
              </div>
              <h3 className="font-display text-xl text-bone mt-4 tracking-tight group-hover:text-accent-blue transition">
                {project.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {project.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {project.lead_name ? <span>Lead: {project.lead_name}</span> : null}
                <span>
                  Team · {project.team_count}/{project.capacity}
                </span>
                {project.weekly_commitment_hours ? (
                  <span>~{project.weekly_commitment_hours} hrs/week</span>
                ) : null}
              </div>
              {project.skills_needed.length > 0 ? (
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-accent-blue">
                  Skills · {project.skills_needed.join(" · ")}
                </p>
              ) : null}
              <TagList tags={project.tags} className="mt-4" />
              {profile?.interests?.length || profile?.member_skills?.length ? (
                <InterestMatchTags
                  tags={[...project.tags, ...project.skills_needed]}
                  interests={[
                    ...(profile?.interests ?? []),
                    ...(profile?.member_skills ?? []),
                    ...(profile?.desired_roles ?? []),
                  ]}
                  className="mt-2"
                />
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
