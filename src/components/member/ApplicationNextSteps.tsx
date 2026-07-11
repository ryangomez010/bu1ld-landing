import { Link } from "@tanstack/react-router";

import type { ApplicationStatus } from "@/lib/types";

const COPY: Record<
  ApplicationStatus,
  { title: string; body: string; cta?: { label: string; href: string } }
> = {
  pending: {
    title: "Review in progress",
    body: "The project lead sees your pitch plus your full profile — bio, background, interest tags, GitHub, and LinkedIn. While status is pending you can edit the pitch from this page. You will get an in-app notification and email (if enabled) when the lead accepts, waitlists, or declines.",
    cta: { label: "All applications", href: "/applications" },
  },
  waitlist: {
    title: "On the waitlist",
    body: "The team hit capacity or is reviewing in batches. If a slot opens, you are notified automatically — no re-application needed. Follow the project for milestone updates from the lead in case capacity changes mid-cycle.",
  },
  accepted: {
    title: "Accepted onto the team",
    body: "You now have access to the member workspace on this project page — team roster, pinned repo links, and project updates. Join the Discord channel if one is linked, read the lead's latest update, and introduce yourself to other accepted members in the directory.",
    cta: { label: "All applications", href: "/applications" },
  },
  declined: {
    title: "Not selected this round",
    body: "Leads choose for skill fit, timezone overlap, and current capacity — a decline does not affect your standing in the directory or other applications. Browse other open projects or follow this thread to re-apply if slots reopen.",
    cta: { label: "Open projects", href: "/projects" },
  },
};

export function ApplicationNextSteps({ status }: { status: ApplicationStatus }) {
  const info = COPY[status];

  return (
    <div className="mt-4 rounded-sm border border-border/50 bg-background/50 px-4 py-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {info.title}
      </p>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{info.body}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        {info.cta ? (
          <Link
            to={info.cta.href}
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
          >
            {info.cta.label} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
