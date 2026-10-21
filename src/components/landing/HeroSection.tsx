import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  FlaskConical,
  Hammer,
  UserCheck,
} from "lucide-react";

import { SectionLabel } from "@/components/landing/Section";
import { trackEvent } from "@/lib/analytics";

const STARTING_POINTS = [
  {
    title: "Build with a team",
    description: "Find a brief that fits your skills and available time.",
    to: "/projects",
    detail: "Browse project briefs",
    icon: Hammer,
  },
  {
    title: "Develop your foundations",
    description: "Follow guided ML reading paths at your own pace.",
    to: "/guides",
    detail: "Public library · read without an account",
    icon: BookOpen,
  },
  {
    title: "Explore the research",
    description: "See the questions, current stage, and evidence behind each line of work.",
    to: "/research-atlas",
    detail: "Open the research atlas",
    icon: FlaskConical,
  },
] as const;

const OPERATING_PROMISES = [
  {
    label: "Public by default",
    detail: "Briefs, learning paths, and research context stay open to inspect.",
    icon: Eye,
  },
  {
    label: "Access is explicit",
    detail: "Accounts save progress; reviewed admission unlocks team workspaces.",
    icon: UserCheck,
  },
  {
    label: "Evidence earns release",
    detail: "Submitted work becomes public only after review and source checks.",
    icon: CheckCircle2,
  },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-14 md:py-20 lg:py-24">
      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-16">
        <div>
          <SectionLabel id="00">global AI research &amp; engineering</SectionLabel>
          <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.8rem,5.6vw,5.5rem)] font-bold leading-[1.02] tracking-tight text-bone">
            Build research worth
            <br className="hidden sm:block" /> putting your{" "}
            <span className="text-accent-blue">name on.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Join a scoped project, strengthen your technical foundations, and leave a clear record
            of what you contributed. The Bu1LD connects research, engineering, and publication in
            one working community.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/projects"
              onClick={() =>
                trackEvent("landing_primary_cta_clicked", { destination: "/projects" })
              }
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-bone px-6 py-3 text-sm font-medium text-background transition hover:bg-accent-blue"
            >
              Find a project{" "}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              to="/evidence"
              onClick={() =>
                trackEvent("landing_evidence_cta_clicked", { destination: "/evidence" })
              }
              className="inline-flex min-h-12 items-center justify-center rounded-sm border border-bone/25 px-6 py-3 text-sm text-bone transition hover:border-bone/50 hover:bg-bone/5"
            >
              Inspect public evidence
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Browse projects before creating an account.
          </p>
          <p className="mt-6 max-w-xl border-l border-border/70 pl-4 text-xs leading-relaxed text-muted-foreground">
            Projects are labeled recruiting, active, or closed. Contribution records show what was
            submitted and what has been reviewed.
          </p>
        </div>
        <aside
          aria-labelledby="starting-points-title"
          className="rounded-lg border border-border/70 bg-background/80 p-5 sm:p-6"
        >
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-blue">
            Your next step
          </p>
          <h2 id="starting-points-title" className="mt-2 font-display text-2xl text-bone">
            Where do you want to start?
          </h2>
          <div className="mt-5 divide-y divide-border/60">
            {STARTING_POINTS.map(({ title, description, to, detail, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group -mx-2 flex gap-4 rounded-sm px-2 py-5 transition hover:bg-bone/5"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-accent-blue/20 bg-accent-blue/5 text-accent-blue">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3 font-display text-lg text-bone">
                    {title}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent-blue"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </span>
                  <span className="mt-2 block text-xs text-accent-blue">{detail}</span>
                </span>
              </Link>
            ))}
          </div>
        </aside>

        <dl className="grid overflow-hidden rounded-sm border border-border/60 bg-background/70 sm:grid-cols-3 lg:col-span-2">
          {OPERATING_PROMISES.map(({ label, detail, icon: Icon }, index) => (
            <div
              key={label}
              className="flex gap-4 border-b border-border/60 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-accent-green/20 bg-accent-green/5 text-accent-green">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-bone">
                  0{index + 1} · {label}
                </dt>
                <dd className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
