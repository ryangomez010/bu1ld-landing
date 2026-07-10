import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
import { fetchMyApplicationStatusMap, fetchProjects } from "@/lib/projects";
import type { ApplicationStatus, Project, ProjectStatus, ProjectType } from "@/lib/types";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [applied, setApplied] = useState<Map<string, ApplicationStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void Promise.all([
      fetchProjects(),
      user ? fetchMyApplicationStatusMap(user.id) : Promise.resolve(new Map()),
    ]).then(([data, appMap]) => {
      setProjects(data);
      setApplied(appMap);
      setLoading(false);
    });
  }, [user]);

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

  return (
    <MemberLayout title="Projects" eyebrow="join & build">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Research threads, startup builds, and program tracks. Apply with your profile — LinkedIn and
        background attached automatically.
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

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["all", "open", "active", "closed"] as const).map((f) => (
          <FilterChip key={f} active={statusFilter === f} onClick={() => setStatusFilter(f)}>
            {f} {f === "open" ? `(${open.length})` : ""}
          </FilterChip>
        ))}
        <Link
          to="/applications"
          className="ml-auto font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
        >
          My applications →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all", "research", "startup", "program"] as const).map((f) => (
          <FilterChip key={f} active={typeFilter === f} onClick={() => setTypeFilter(f)}>
            {f}
          </FilterChip>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by skill or tag…"
          className="ml-auto max-w-xs font-mono text-xs"
        />
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : list.length === 0 ? (
        <EmptyState title="No projects match" body="Try another filter or clear the search." />
      ) : (
        <div className="grid gap-2">
          {list.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.slug}`}
              className="panel panel-interactive group block p-6 rounded-sm hover:-translate-y-px"
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
            Closed threads stay visible as portfolio proof — what BUILD has shipped.
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
