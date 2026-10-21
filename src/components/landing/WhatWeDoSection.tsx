import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, FileSearch, FlaskConical, Send } from "lucide-react";

import { SectionLabel } from "@/components/landing/Section";

const CONTRIBUTION_PATH = [
  {
    step: "01",
    title: "Explore in public",
    description:
      "Compare project briefs, research questions, evidence boundaries, and learning paths before creating an account.",
    access: "Public access",
    action: "Browse open work",
    to: "/projects",
    icon: FileSearch,
  },
  {
    step: "02",
    title: "Apply with context",
    description:
      "Choose a scoped role, complete your profile, and explain the concrete result you can advance in your available time.",
    access: "Account required",
    action: "See the application path",
    to: "/apply",
    icon: Send,
  },
  {
    step: "03",
    title: "Build with evidence",
    description:
      "Attach artifacts to milestones, preserve failed attempts, and respond to review without rewriting the project history.",
    access: "Accepted contributors",
    action: "Inspect the evidence model",
    to: "/evidence",
    icon: FlaskConical,
  },
  {
    step: "04",
    title: "Publish what holds up",
    description:
      "Move results outward only after review, with sources, limitations, and the current verification state kept visible.",
    access: "Reviewed release",
    action: "View publications",
    to: "/publications",
    icon: CheckCircle2,
  },
] as const;

export function WhatWeDoSection() {
  return (
    <section
      id="what"
      className="relative border-t border-border/60 bg-background/50 py-24 backdrop-blur-sm md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel id="03">how work moves</SectionLabel>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <h2 className="max-w-3xl font-display text-4xl leading-[1.02] tracking-[-0.025em] text-bone md:text-6xl">
            From curiosity to an{" "}
            <span className="text-accent-blue text-glow-blue">accountable result.</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground lg:justify-self-end lg:text-lg">
            Every path begins with public context. Accounts unlock saved progress and applications;
            accepted contributors gain project workspaces. Review determines what can become public
            evidence or a publication.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 md:grid-cols-2 xl:grid-cols-4">
          {CONTRIBUTION_PATH.map(({ step, title, description, access, action, to, icon: Icon }) => (
            <li key={step} className="flex min-h-80 flex-col bg-background/90 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[9px] tracking-[0.2em] text-bone/35">{step}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-accent-blue/20 bg-accent-blue/5 text-accent-blue">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 font-display text-2xl text-bone">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <div className="mt-auto pt-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-green">
                  {access}
                </p>
                <Link
                  to={to}
                  className="group mt-3 inline-flex min-h-10 items-center gap-2 text-sm text-bone transition hover:text-accent-blue"
                >
                  {action}
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-5 border-l-2 border-accent-blue/40 bg-accent-blue/[0.035] p-6 md:grid-cols-[auto_1fr] md:items-start">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
            The boundary
          </p>
          <div className="max-w-4xl">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Execution, tests, and demos establish that work ran. They do not establish scientific
              efficacy, production readiness, or institutional endorsement. Public records keep
              those states separate.
            </p>
            <Link
              to="/evidence"
              className="mt-4 inline-flex min-h-10 items-center text-sm text-bone underline decoration-border underline-offset-4 transition hover:text-accent-blue"
            >
              Read the evidence standard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
