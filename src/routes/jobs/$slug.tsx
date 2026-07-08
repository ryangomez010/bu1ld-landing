import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { TagList } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { JobSourceBadge } from "@/components/member/ProjectBadges";
import { SaveButton } from "@/components/member/SaveButton";
import { fetchJobBySlug, fetchJobs } from "@/lib/projects";
import type { Job } from "@/lib/types";

export const Route = createFileRoute("/jobs/$slug")({
  component: JobDetailPage,
});

function JobDetailPage() {
  return (
    <RequireAuth>
      <JobDetail />
    </RequireAuth>
  );
}

function JobDetail() {
  const { slug } = Route.useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [related, setRelated] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchJobBySlug(slug), fetchJobs()]).then(([j, all]) => {
      setJob(j);
      if (j) {
        const tags = new Set(j.tags.map((t) => t.toLowerCase()));
        setRelated(
          all
            .filter((x) => x.id !== j.id)
            .map((x) => ({
              job: x,
              score: x.tags.filter((t) => tags.has(t.toLowerCase())).length,
            }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((x) => x.job),
        );
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <MemberLayout>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      </MemberLayout>
    );
  }

  if (!job) {
    return (
      <MemberLayout title="Job not found">
        <Link to="/jobs" className="text-accent-blue text-sm">
          ← Back to jobs
        </Link>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <Link
        to="/jobs"
        className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone"
      >
        ← Jobs
      </Link>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <JobSourceBadge source={job.source} />
          {job.employment_type ? (
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              {job.employment_type}
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-4xl text-bone mt-4 tracking-tight">{job.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          <SaveButton itemType="job" itemSlug={job.slug} itemTitle={job.title} />
        </div>
        <p className="mt-3 text-muted-foreground">
          {job.company}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        <TagList tags={job.tags} linkToSearch className="mt-4" />
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">{job.description}</p>

        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
          >
            {job.source === "internal" ? "Apply / contact" : "View listing"}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : job.source === "internal" ? (
          <a
            href="mailto:ryan@thebu1ld.com"
            className="mt-8 inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
          >
            Email ryan@thebu1ld.com →
          </a>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Related roles
            </h2>
            <div className="grid gap-px border border-border/40 bg-border/40">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/jobs/${r.slug}`}
                  className="bg-background/75 p-5 hover:bg-bone/5 transition block"
                >
                  <JobSourceBadge source={r.source} />
                  <h3 className="font-display text-lg text-bone mt-2">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.company}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </MemberLayout>
  );
}
