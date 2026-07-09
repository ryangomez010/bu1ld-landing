import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { ApplicationStatusBadge } from "@/components/member/ProjectBadges";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchMyApplications, withdrawApplication } from "@/lib/projects";
import type { ApplicationStatus, ProjectApplication } from "@/lib/types";

export const Route = createFileRoute("/applications/")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return (
    <RequireAuth>
      <ApplicationsContent />
    </RequireAuth>
  );
}

function ApplicationsContent() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  const reload = () => {
    if (!user) return;
    void fetchMyApplications(user.id).then(setApplications);
  };

  useEffect(() => {
    reload();
  }, [user]);

  const filtered = useMemo(
    () => (filter === "all" ? applications : applications.filter((a) => a.status === filter)),
    [applications, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length };
    for (const a of applications) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [applications]);

  const onWithdraw = async (id: string) => {
    if (!user) return;
    const { error } = await withdrawApplication(user.id, id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Application withdrawn.");
    reload();
  };

  return (
    <MemberLayout title="My applications" eyebrow="project forum">
      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Browse open projects and apply with a short pitch — your profile attaches automatically."
          action={
            <Link
              to="/projects"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
            >
              Browse projects →
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6 -mt-4">
            {(["all", "pending", "accepted", "waitlist", "declined"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`font-mono text-[10px] tracking-[0.22em] uppercase px-4 py-2 rounded-sm border transition ${
                  filter === f
                    ? "bg-accent-blue/10 text-bone border-accent-blue/30"
                    : "border-border/60 text-muted-foreground hover:text-bone"
                }`}
              >
                {f}
                {counts[f] ? ` (${counts[f]})` : ""}
              </button>
            ))}
          </div>

          <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-4">
            {(["pending", "accepted", "waitlist", "declined"] as const).map((s) => (
              <div key={s} className="bg-background/75 p-4">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                  {s}
                </p>
                <p className="mt-2 font-display text-2xl text-bone">{counts[s] ?? 0}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Nothing in this filter" body="Try another status." />
          ) : (
            <div className="grid gap-px bg-border/40 border border-border/40">
              {filtered.map((app) => (
                <ApplicationRow key={app.id} app={app} onWithdraw={onWithdraw} />
              ))}
            </div>
          )}
        </>
      )}
    </MemberLayout>
  );
}

function ApplicationRow({
  app,
  onWithdraw,
}: {
  app: ProjectApplication;
  onWithdraw: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-background/75 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={app.project_slug ? `/projects/${app.project_slug}` : "/projects"}
          className="font-display text-xl text-bone hover:text-accent-blue transition"
        >
          {app.project_title ?? "Project"}
        </Link>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <p
        className={`mt-4 text-sm text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
      >
        {app.pitch}
      </p>
      {app.status === "declined" ? (
        <p className="mt-3 rounded-sm border border-border/50 bg-accent-red/5 px-3 py-2 text-xs text-muted-foreground">
          Not selected this round. You can reapply if the project reopens or capacity opens up.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-bone/40">
          Applied {new Date(app.created_at).toLocaleDateString()}
          {app.updated_at !== app.created_at
            ? ` · Updated ${new Date(app.updated_at).toLocaleDateString()}`
            : ""}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
        >
          {expanded ? "Collapse" : "Expand pitch"}
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(app.pitch);
            toast.success("Pitch copied.");
          }}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground hover:text-bone"
        >
          Copy
        </button>
        {app.status === "pending" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void onWithdraw(app.id)}
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-red"
          >
            Withdraw
          </Button>
        ) : null}
      </div>
    </div>
  );
}
