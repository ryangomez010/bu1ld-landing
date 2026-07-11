import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireMember } from "@/components/auth/RequireAuth";
import { CtaLink, EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { JobSourceBadge } from "@/components/member/ProjectBadges";
import { useAuth } from "@/lib/auth";
import { isWithinDays } from "@/lib/date";
import { fetchMyJobApplications } from "@/lib/job-applications";
import { jobLink } from "@/lib/app-paths";
import { fetchJobs } from "@/lib/projects";
import type { Job } from "@/lib/types";

export const Route = createFileRoute("/jobs/")({
  component: JobsPage,
});

function JobsPage() {
  return (
    <RequireMember>
      <JobsContent />
    </RequireMember>
  );
}

function JobsContent() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipeline, setPipeline] = useState({ applied: 0, interviewing: 0, offered: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "internal" | "external" | "new">("all");

  useEffect(() => {
    void fetchJobs().then((data) => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchMyJobApplications(user.id).then((apps) => {
      setPipeline({
        applied: apps.filter((a) => a.status === "applied").length,
        interviewing: apps.filter((a) => a.status === "interviewing").length,
        offered: apps.filter((a) => a.status === "offered").length,
      });
    });
  }, [user]);

  const filtered = jobs.filter((j) => {
    if (filter === "new") return isWithinDays(j.created_at);
    if (filter === "all") return true;
    return j.source === filter;
  });

  const newCount = jobs.filter((j) => isWithinDays(j.created_at)).length;

  return (
    <MemberLayout title="Jobs" eyebrow="careers">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        The Bu1ld opportunities and vetted external roles. Save listings to your job tracker and log
        status changes as you move through applied, interviewing, and offered.
      </p>

      {user && (pipeline.applied > 0 || pipeline.interviewing > 0 || pipeline.offered > 0) ? (
        <div className="mb-8 panel glass surface-card p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label-xs text-accent-green">Your pipeline</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {pipeline.applied} applied · {pipeline.interviewing} interviewing · {pipeline.offered}{" "}
              offered
            </p>
          </div>
          <CtaLink to="/jobs/tracker">Open tracker →</CtaLink>
        </div>
      ) : (
        <div className="mb-8">
          <CtaLink to="/jobs/tracker">Track applications in job tracker →</CtaLink>
        </div>
      )}

      <FilterBar
        className="mb-8"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all" as const, label: "All", count: jobs.length },
          { value: "new" as const, label: "New this week", count: newCount },
          {
            value: "internal" as const,
            label: "Internal",
            count: jobs.filter((j) => j.source === "internal").length,
          },
          {
            value: "external" as const,
            label: "External",
            count: jobs.filter((j) => j.source === "external").length,
          },
        ]}
      />

      <div className="mb-8 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <StatCell label="All listings" value={String(jobs.length)} />
        <StatCell label="New this week" value={String(newCount)} />
        <StatCell
          label="Internal roles"
          value={String(jobs.filter((j) => j.source === "internal").length)}
        />
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No jobs for this filter"
          body="Switch to All or External, or check back when new internal roles are posted."
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {filtered.map((job) => (
            <Link
              key={job.id}
              {...jobLink(job.slug)}
              className="bg-background/75 p-6 hover:bg-bone/5 transition block"
            >
              <div className="flex flex-wrap items-center gap-2">
                <JobSourceBadge source={job.source} />
                {isWithinDays(job.created_at) ? (
                  <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-accent-green border border-accent-green/30 px-2 py-0.5 rounded-sm">
                    New this week
                  </span>
                ) : null}
                {job.employment_type ? (
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                    {job.employment_type}
                  </span>
                ) : null}
              </div>
              <h3 className="font-display text-xl text-bone mt-3 tracking-tight">{job.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.company}
                {job.location ? ` · ${job.location}` : ""}
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {job.description}
              </p>
              <TagList tags={job.tags} className="mt-4" />
            </Link>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/75 p-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}
