import { Link } from "@tanstack/react-router";

import type { ApplicationStatus } from "@/lib/types";

const COPY: Record<
  ApplicationStatus,
  { title: string; body: string; cta?: { label: string; href: string } }
> = {
  pending: {
    title: "What happens next",
    body: "The project lead reviews your pitch and profile. You can edit your pitch while status is pending. You'll get a notification when there's an update.",
    cta: { label: "All applications", href: "/applications" },
  },
  waitlist: {
    title: "You're on the waitlist",
    body: "The team is full or reviewing in batches. If a spot opens, you'll be notified automatically. Keep an eye on project updates from the lead.",
  },
  accepted: {
    title: "Welcome to the team",
    body: "You're in. Join the project Discord if one is linked, follow updates from the lead, and introduce yourself to other accepted builders.",
    cta: { label: "Manage applications", href: "/applications" },
  },
  declined: {
    title: "Not selected this round",
    body: "This doesn't reflect on your profile — leads optimize for fit and timing. Browse other open projects or revisit when capacity opens.",
    cta: { label: "Browse open projects", href: "/projects" },
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
