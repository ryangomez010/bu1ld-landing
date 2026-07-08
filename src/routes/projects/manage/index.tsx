import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireProjectLead } from "@/components/auth/RequireProjectLead";
import { EmptyState } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { ProjectStatusBadge, ProjectTypeBadge } from "@/components/member/ProjectBadges";
import { useAuth } from "@/lib/auth";
import { fetchLeadProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/projects/manage/")({
  component: ManageProjectsPage,
});

function ManageProjectsPage() {
  return (
    <RequireAuth>
      <RequireProjectLead>
        <ManageContent />
      </RequireProjectLead>
    </RequireAuth>
  );
}

function ManageContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    void fetchLeadProjects(user.id).then(setProjects);
  }, [user]);

  const open = projects.filter((p) => p.status === "open").length;
  const active = projects.filter((p) => p.status === "active").length;

  return (
    <MemberLayout title="My projects" eyebrow="project lead">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 -mt-4">
        <p className="text-sm text-muted-foreground">Create projects and review applications.</p>
        <Link
          to="/projects/new"
          className="font-mono text-[10px] tracking-[0.25em] uppercase px-4 py-2 bg-bone text-background rounded-sm hover:bg-accent-blue transition"
        >
          + New project
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
          <Stat label="Your projects" value={String(projects.length)} />
          <Stat label="Open" value={String(open)} />
          <Stat label="Active" value={String(active)} />
        </div>
      ) : null}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create a research thread, startup build, or program track and start reviewing applications."
          action={
            <Link
              to="/projects/new"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
            >
              Create your first project →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {projects.map((p) => (
            <div key={p.id} className="bg-background/75 p-6">
              <div className="flex flex-wrap gap-2">
                <ProjectTypeBadge type={p.type} />
                <ProjectStatusBadge status={p.status} />
              </div>
              <h3 className="font-display text-xl text-bone mt-3">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <p className="mt-3 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {p.team_count}/{p.capacity} builders
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link
                  to={`/projects/manage/${p.slug}`}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-green hover:text-bone"
                >
                  Review applications →
                </Link>
                <Link
                  to={`/projects/edit/${p.slug}`}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone"
                >
                  Edit project →
                </Link>
                <Link
                  to={`/projects/${p.slug}`}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone"
                >
                  Public page →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/75 p-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}
