import { Link } from "@tanstack/react-router";

import { projectLink } from "@/lib/app-paths";
import type { ApplicationStatus } from "@/lib/types";

const COPY: Record<ApplicationStatus, { title: string; body: string }> = {
  pending: {
    title: "Review in progress",
    body: "The project lead sees your pitch plus your full profile — bio, background, interest tags, GitHub, and LinkedIn. While status is pending you can edit the pitch from this page. You will get an in-app notification and email (if enabled) when the lead accepts, waitlists, or declines.",
  },
  waitlist: {
    title: "On the waitlist",
    body: "The team hit capacity or is reviewing in batches. If a slot opens, you are notified automatically — no re-application needed. Follow the project for milestone updates from the lead in case capacity changes mid-cycle.",
  },
  accepted: {
    title: "Accepted onto the team",
    body: "Open the project workspace to submit evidence, track milestones, and use pinned resources. Join Discord if linked, read the lead's latest update, and introduce yourself to other accepted members.",
  },
  declined: {
    title: "Not selected this round",
    body: "Leads choose for skill fit, timezone overlap, and current capacity — a decline does not affect your standing in the directory or other applications. Browse other open projects or follow this thread to re-apply if slots reopen.",
  },
};

export function ApplicationNextSteps({
  status,
  projectSlug,
}: {
  status: ApplicationStatus;
  projectSlug?: string;
}) {
  const info = COPY[status];

  return (
    <div className="mt-4 rounded-sm border border-border/50 bg-background/50 px-4 py-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {info.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.body}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        {status === "accepted" && projectSlug ? (
          <a
            href={`/projects/${projectSlug}#project-evidence`}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent-blue hover:text-bone"
          >
            Open contribution workspace →
          </a>
        ) : null}
        {status === "waitlist" && projectSlug ? (
          <Link
            {...projectLink(projectSlug)}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent-blue hover:text-bone"
          >
            View project →
          </Link>
        ) : null}
        {status === "declined" || status === "pending" ? (
          <Link
            to={status === "declined" ? "/projects" : "/applications"}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent-blue hover:text-bone"
          >
            {status === "declined" ? "Open projects" : "All applications"} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
