import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState, TagList } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { JobSourceBadge } from "@/components/member/ProjectBadges";
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "internal" | "external">("all");

  useEffect(() => {
    void fetchJobs().then((data) => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.source === filter);

  return (
    <MemberLayout title="Jobs" eyebrow="careers">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        BUILD opportunities and curated external roles. Internal listings link to BUILD tracks or
        direct contact; external roles link out.
      </p>

      <div className="flex gap-2 mb-8">
        {(["all", "internal", "external"] as const).map((f) => (
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
            {f === "all" ? "All" : f === "internal" ? "BUILD" : "External"}
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <StatCell label="All listings" value={String(jobs.length)} />
        <StatCell
          label="BUILD roles"
          value={String(jobs.filter((j) => j.source === "internal").length)}
        />
        <StatCell
          label="External roles"
          value={String(jobs.filter((j) => j.source === "external").length)}
        />
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No jobs for this filter" body="Try another source filter." />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {filtered.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.slug}`}
              className="bg-background/75 p-6 hover:bg-bone/5 transition block"
            >
              <div className="flex flex-wrap items-center gap-2">
                <JobSourceBadge source={job.source} />
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
