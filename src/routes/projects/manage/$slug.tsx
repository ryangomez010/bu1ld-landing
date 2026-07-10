import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { RequireProjectLead } from "@/components/auth/RequireProjectLead";
import { TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { ApplicationStatusBadge } from "@/components/member/ProjectBadges";
import { Button } from "@/components/ui/button";
import {
  fetchProjectApplications,
  fetchProjectBySlug,
  updateApplicationStatus,
} from "@/lib/projects";
import { relativeTime } from "@/lib/date";
import type { ApplicationStatus, Project, ProjectApplication } from "@/lib/types";

const STATUS_HELP: Record<ApplicationStatus, string> = {
  pending: "Awaiting your review — accept, waitlist, or decline.",
  accepted: "On the team — applicant can see accepted status.",
  waitlist: "Strong fit but not joining yet — keep for a later round.",
  declined: "Not selected this round — applicant was notified in-app.",
};

export const Route = createFileRoute("/projects/manage/$slug")({
  component: ManageProjectPage,
});

function ManageProjectPage() {
  return (
    <RequireMember>
      <RequireProjectLead>
        <ManageProject />
      </RequireProjectLead>
    </RequireMember>
  );
}

function ManageProject() {
  const { slug } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const reload = () => {
    if (!project) return;
    void fetchProjectApplications(project.id).then(setApplications);
  };

  useEffect(() => {
    void fetchProjectBySlug(slug).then((p) => {
      setProject(p);
      setLoading(false);
      if (p) void fetchProjectApplications(p.id).then(setApplications);
    });
  }, [slug]);

  const setStatus = async (appId: string, status: ApplicationStatus) => {
    const { error } = await updateApplicationStatus(appId, status);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Application ${status}.`);
    reload();
  };

  if (loading) {
    return (
      <MemberLayout>
        <ListSkeleton rows={4} />
      </MemberLayout>
    );
  }

  if (!project) {
    return (
      <MemberLayout title="Not found">
        <Link to="/projects/manage" className="text-accent-blue text-sm">
          ← My projects
        </Link>
      </MemberLayout>
    );
  }

  const pending = applications.filter((a) => a.status === "pending").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const visible =
    statusFilter === "all" ? applications : applications.filter((a) => a.status === statusFilter);

  return (
    <MemberLayout title={project.title} eyebrow="review applications">
      <PageBackLink to="/projects/manage" label="My projects" />
      <Link
        to={`/projects/edit/${project.slug}`}
        className="mb-6 inline-block font-mono text-[10px] tracking-[0.25em] uppercase text-accent-green hover:text-bone"
      >
        Edit project →
      </Link>

      <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Total
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{applications.length}</p>
        </div>
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Pending
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{pending}</p>
        </div>
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Accepted
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{accepted}</p>
        </div>
      </div>

      <FilterBar
        className="mb-6"
        value={statusFilter}
        onChange={setStatusFilter}
        options={(["all", "pending", "accepted", "waitlist", "declined"] as const).map((f) => ({
          value: f,
          label: f,
          count:
            f === "all" ? applications.length : applications.filter((a) => a.status === f).length,
        }))}
      />

      {statusFilter !== "all" ? (
        <p className="mb-4 text-sm text-muted-foreground">{STATUS_HELP[statusFilter]}</p>
      ) : null}

      <div className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-muted-foreground text-sm">No applications in this filter.</p>
        ) : (
          visible.map((app) => (
            <div key={app.id} className="rounded-sm border border-border/60 bg-background/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg text-bone">
                    {app.applicant_name ?? "Member"}
                  </h3>
                  {app.applicant_background ? (
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-1 capitalize">
                      {app.applicant_background}
                    </p>
                  ) : null}
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{STATUS_HELP[app.status]}</p>
              <p className="mt-1 font-mono text-[9px] tracking-[0.15em] uppercase text-bone/40">
                Applied {relativeTime(app.created_at)}
                {app.updated_at !== app.created_at
                  ? ` · Updated ${relativeTime(app.updated_at)}`
                  : ""}
              </p>

              {app.applicant_bio ? (
                <p className="mt-3 text-sm text-muted-foreground">{app.applicant_bio}</p>
              ) : null}

              {app.applicant_interests?.length ? (
                <TagList tags={app.applicant_interests} className="mt-3" />
              ) : null}

              {app.applicant_linkedin ? (
                <a
                  href={app.applicant_linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-accent-blue hover:text-bone mr-4"
                >
                  LinkedIn →
                </a>
              ) : null}
              {app.applicant_github ? (
                <a
                  href={app.applicant_github}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-accent-blue hover:text-bone"
                >
                  GitHub →
                </a>
              ) : null}

              <div className="mt-4 p-4 bg-card/30 border border-border/40 rounded-sm">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-bone/40 mb-2">
                  Pitch
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">{app.pitch}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {app.status !== "accepted" ? (
                  <Button
                    size="sm"
                    onClick={() => void setStatus(app.id, "accepted")}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase"
                  >
                    Accept
                  </Button>
                ) : null}
                {app.status !== "waitlist" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void setStatus(app.id, "waitlist")}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase"
                  >
                    Waitlist
                  </Button>
                ) : null}
                {app.status !== "declined" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void setStatus(app.id, "declined")}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-red"
                  >
                    Decline
                  </Button>
                ) : null}
                {app.status !== "pending" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void setStatus(app.id, "pending")}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase"
                  >
                    Mark pending
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </MemberLayout>
  );
}
