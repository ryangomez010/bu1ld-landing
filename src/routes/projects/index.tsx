import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
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
import { useAuth } from "@/lib/auth";
import { useProjectsQuery } from "@/lib/queries/use-projects";
import { recommendProjects } from "@/lib/personalization";
import type { ApplicationStatus, ProjectStatus, ProjectType } from "@/lib/types";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: "Projects — The Bu1ld" }],
  }),
});

function ProjectsPage() {
  return (
    <RequireMember>
      <ProjectsContent />
    </RequireMember>
  );
}

function ProjectsContent() {
  const { user, profile } = useAuth();
  const { data, isLoading: loading } = useProjectsQuery(undefined, user?.id);
  const projects = data?.projects ?? [];
  const applied = data?.statusMap ?? new Map<string, ApplicationStatus>();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all");
  const [query, setQuery] = useState("");

  const open = projects.filter((p) => p.status === "open");
  const alumni = projects.filter((p) => p.status === "closed");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (!q) return true;
      const hay = [p.title, p.description, ...p.tags, ...p.skills_needed].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [projects, statusFilter, typeFilter, query]);

  const list = statusFilter === "all" ? filtered.filter((p) => p.status !== "closed") : filtered;

  const recommendations = useMemo(() => {
    if (!profile?.interests?.length) return [];
    const appliedIds = new Set([...applied.keys()].map((id) => id));
    return recommendProjects(projects, profile.interests, {
      excludeIds: appliedIds,
      limit: 3,
    });
  }, [projects, profile?.interests, applied]);

  return (
    <MemberLayout title="Projects" eyebrow="join & build">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Open research threads, startup builds, and program cohorts. Each listing shows capacity,
        required skills, and application status — your profile (bio, background, interests, links)
        attaches automatically when you submit a pitch.
      </p>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <div className="panel p-4 rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Open
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{open.length}</p>
        </div>
        <div className="panel p-4 rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Active
          </p>
          <p className="mt-2 font-display text-2xl text-bone">
            {projects.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="panel p-4 rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Alumni
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{alumni.length}</p>
        </div>
      </div>

      <div className="sticky top-14 z-30 -mx-4 px-4 py-3 mb-6 md:static md:mx-0 md:px-0 md:py-0 bg-background/85 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none border-b border-border/40 md:border-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "open", "active", "closed"] as const).map((f) => (
            <FilterChip key={f} active={statusFilter === f} onClick={() => setStatusFilter(f)}>
              {f} {f === "open" ? `(${open.length})` : ""}
            </FilterChip>
          ))}
          <Link
            to="/applications"
            className="ml-auto font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone transition-colors"
          >
            My applications →
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["all", "research", "startup", "program"] as const).map((f) => (
            <FilterChip key={f} active={typeFilter === f} onClick={() => setTypeFilter(f)}>
              {f}
            </FilterChip>
          ))}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Skill or tag — e.g. PyTorch, world models, CUDA"
            className="ml-auto max-w-xs font-mono text-xs"
          />
        </div>
      </div>

      {recommendations.length > 0 && statusFilter === "all" && !query ? (
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
                to={`/projects/${project.slug}`}
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

      {loading ? (
        <ListSkeleton rows={5} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No projects match these filters"
          body="Clear the search box, set Status to Open, or remove the type filter. Alumni (closed) threads appear at the bottom when no search is active."
        />
      ) : (
        <div className="grid gap-2">
          {list.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.slug}`}
              className="panel panel-interactive group block p-6 rounded-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ProjectTypeBadge type={project.type} />
                <ProjectStatusBadge status={project.status} />
                {applied.has(project.id) ? (
                  <ApplicationStatusBadge status={applied.get(project.id)!} />
                ) : null}
                {project.team_count >= project.capacity ? (
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
                  {project.team_count}/{project.capacity} slots
                </span>
              </div>
              <TagList tags={project.tags} className="mt-4" />
              {profile?.interests?.length ? (
                <InterestMatchTags
                  tags={[...project.tags, ...project.skills_needed]}
                  interests={profile.interests}
                  className="mt-2"
                />
              ) : null}
            </Link>
          ))}
        </div>
      )}

      {alumni.length > 0 && statusFilter === "all" && !query ? (
        <section className="mt-12">
          <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Alumni projects
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Closed threads remain public — output repos, demo links, and team rosters stay visible
            as a record of what shipped from The Bu1ld.
          </p>
          <div className="grid gap-2">
            {alumni.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.slug}`}
                className="panel panel-interactive group block p-6 rounded-sm opacity-90 hover:-translate-y-px"
              >
                <ProjectStatusBadge status={project.status} />
                <h3 className="font-display text-lg text-bone mt-3 tracking-tight group-hover:text-accent-blue transition">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </MemberLayout>
  );
}
