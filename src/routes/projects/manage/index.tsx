import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { RequireProjectLead } from "@/components/auth/RequireProjectLead";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { ProjectStatusBadge, ProjectTypeBadge } from "@/components/member/ProjectBadges";
import { useAuth } from "@/lib/auth";
import { projectEditLink, projectLink, projectManageLink } from "@/lib/app-paths";
import { fetchLeadProjects, submitProjectForReview } from "@/lib/projects";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/projects/manage/")({
  component: ManageProjectsPage,
});

function ManageProjectsPage() {
  return (
    <RequireMember>
      <RequireProjectLead>
        <ManageContent />
      </RequireProjectLead>
    </RequireMember>
  );
}

function ManageContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void fetchLeadProjects(user.id).then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, [user]);

  const open = projects.filter((p) => p.status === "open").length;
  const active = projects.filter((p) => p.status === "active").length;

  return (
    <MemberLayout title="My projects" eyebrow="project lead">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 -mt-4">
        <p className="text-sm text-muted-foreground">
          Create listings, review application queues with attached profiles, and post milestone
          updates to accepted members.
        </p>
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

      {loading ? (
        <ListSkeleton rows={3} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create a listing with title, description, capacity, required skills, and optional Discord link — then share the public URL and start reviewing pitches."
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
                {!p.published ? (
                  <span className="rounded-sm border border-accent-blue/30 px-2 py-1 font-mono text-[8px] uppercase text-accent-blue">
                    {p.publication_status === "submitted"
                      ? "editorial review"
                      : p.publication_status === "changes_requested"
                        ? "revisions requested"
                        : "private draft"}
                  </span>
                ) : null}
              </div>
              <h3 className="font-display text-xl text-bone mt-3">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <p className="mt-3 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {p.team_count}/{p.capacity} builders
              </p>
              {p.publication_note ? (
                <div className="mt-3 max-w-2xl border-l-2 border-accent-blue/60 pl-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                    Editorial note
                  </span>
                  <p className="mt-1">{p.publication_note}</p>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-4">
                {!p.published && p.publication_status !== "submitted" ? (
                  <button
                    type="button"
                    onClick={() => {
                      void submitProjectForReview(p.id).then(({ error }) => {
                        if (error) toast.error(error);
                        else {
                          toast.success("Project submitted for editorial review.");
                          void fetchLeadProjects(user?.id ?? "").then(setProjects);
                        }
                      });
                    }}
                    className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
                  >
                    Submit for review →
                  </button>
                ) : null}
                <Link
                  {...projectManageLink(p.slug)}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-green hover:text-bone"
                >
                  Review applications →
                </Link>
                <Link
                  {...projectEditLink(p.slug)}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone"
                >
                  Edit project →
                </Link>
                <Link
                  {...projectLink(p.slug)}
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
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}
