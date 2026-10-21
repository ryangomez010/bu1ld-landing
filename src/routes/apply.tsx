import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { APPLICATION_STEPS, getProgram, INSTITUTION_PROGRAMS, LABS } from "@/data/institution";
import { useAuth } from "@/lib/auth";
import {
  loginPathWithRedirect,
  programApplyPath,
  signupPathWithRedirect,
} from "@/lib/post-auth-redirect";
import { pageHead } from "@/lib/seo";

const applySearchSchema = z.object({
  program: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/apply")({
  validateSearch: (search) => applySearchSchema.parse(search),
  component: ApplyPage,
  head: () =>
    pageHead({
      title: "Apply — The Bu1ld",
      description:
        "Choose a project or program, understand the commitment and selection process, then continue through a connected application path.",
      path: "/apply",
    }),
});

function ApplyPage() {
  const { program: programSlug } = Route.useSearch();
  const { user, profile } = useAuth();
  const selected = programSlug ? getProgram(programSlug) : undefined;
  const destination = selected ? programApplyPath(selected.slug) : "/programs";
  const selectedHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (window.location.hash === "#application-details") {
      selectedHeading.current?.focus({ preventScroll: true });
    }
  }, [programSlug]);

  return (
    <InstitutionLayout
      eyebrow="Applications"
      title="Find your way into BU1LD."
      description="Choose a project or compare the program paths below. Review the commitment first; you will only need an account when you are ready to continue."
    >
      {!selected ? (
        <section
          className="mb-8 rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-6"
          aria-labelledby="project-start-title"
        >
          <h2 id="project-start-title" className="font-display text-2xl text-bone">
            Have a skill you want to put to work?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Start with a project brief. You can see the problem, required skills, and weekly
            commitment before applying.
          </p>
          <Link
            to="/projects"
            className="mt-5 inline-flex min-h-12 items-center rounded-sm bg-bone px-5 text-sm font-medium text-background transition hover:bg-accent-blue"
          >
            Find a project →
          </Link>
        </section>
      ) : null}
      {programSlug && !selected ? (
        <p
          role="status"
          className="mb-6 rounded-sm border border-border/60 p-4 text-sm text-muted-foreground"
        >
          That program path is no longer available. Choose one of the paths below to continue.
        </p>
      ) : null}
      {selected ? (
        <section
          id="application-details"
          aria-labelledby="selected-path-title"
          className="mb-10 scroll-mt-24 rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-5 sm:p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue">
            Selected path · {selected.status}
          </p>
          <h2
            ref={selectedHeading}
            tabIndex={-1}
            id="selected-path-title"
            className="mt-2 font-display text-2xl text-bone"
          >
            {selected.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{selected.summary}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Objective
              </dt>
              <dd className="mt-1 text-sm text-bone">{selected.objective}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Commitment
              </dt>
              <dd className="mt-1 text-sm text-bone">{selected.commitment}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Selection
              </dt>
              <dd className="mt-1 text-sm text-bone">{selected.selectivity}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Timeline
              </dt>
              <dd className="mt-1 text-sm text-bone">{selected.timeline}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            {selected.slug === "open-competitions" ? (
              <Link
                to="/competitions"
                className="inline-flex min-h-12 items-center rounded-sm bg-bone px-5 py-3 text-sm font-medium text-background transition hover:bg-accent-blue"
              >
                Continue to competitions →
              </Link>
            ) : user ? (
              <Link
                to="/programs/$slug"
                params={{ slug: selected.slug }}
                className="inline-flex min-h-12 items-center rounded-sm bg-bone px-5 py-3 text-sm font-medium text-background transition hover:bg-accent-blue"
              >
                {profile?.onboarding_completed
                  ? "Continue to application"
                  : "Continue with your account"}{" "}
                →
              </Link>
            ) : (
              <>
                <a
                  href={signupPathWithRedirect(destination)}
                  className="inline-flex min-h-12 items-center rounded-sm bg-bone px-5 py-3 text-sm font-medium text-background transition hover:bg-accent-blue"
                >
                  Create account to apply →
                </a>
                <a
                  href={loginPathWithRedirect(destination)}
                  className="inline-flex min-h-12 items-center rounded-sm border border-bone/25 px-5 py-3 text-sm text-muted-foreground transition hover:text-bone"
                >
                  Log in and continue
                </a>
              </>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {selected.slug === "open-competitions"
              ? "You can browse challenges without an account. Entry rules and deadlines appear with each published challenge."
              : "Creating an account does not submit an application. You can review the live cycle and complete your profile before applying. Availability and deadlines are shown in the portal."}
          </p>
          <a
            href="#program-paths"
            className="mt-3 inline-flex min-h-11 items-center text-sm text-accent-blue hover:text-bone"
          >
            Compare other paths ↓
          </a>
        </section>
      ) : null}

      <section id="program-paths" className="scroll-mt-24">
        <h2 className="font-display text-2xl text-bone">Choose a program path</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Compare the audience and commitment. Live cycles confirm dates and available places.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {INSTITUTION_PROGRAMS.map((program) => (
            <Link
              key={program.slug}
              to="/apply"
              search={{ program: program.slug }}
              hash="application-details"
              aria-current={selected?.slug === program.slug ? "true" : undefined}
              className={`flex flex-col rounded-sm border p-5 transition ${
                selected?.slug === program.slug
                  ? "border-accent-blue/50 bg-accent-blue/10"
                  : "border-border/40 hover:border-bone/30"
              }`}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                {program.kind} · {program.status}
              </p>
              <p className="mt-2 font-display text-lg text-bone">{program.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{program.whoFor}</p>
              <p className="mt-4 text-sm text-bone">{program.commitment}</p>
              <span className="mt-auto pt-5 text-sm text-accent-blue">
                {selected?.slug === program.slug
                  ? "Selected · review next steps"
                  : "Review this path"}{" "}
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="application-process-title">
        <h2 id="application-process-title" className="mb-4 font-display text-2xl text-bone">
          What happens next
        </h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {APPLICATION_STEPS.map((step) => (
            <li key={step.step} className="rounded-sm border border-border/50 bg-bone/[0.02] p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-accent-blue">{step.step}</p>
              <h3 className="mt-3 font-display text-xl text-bone">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Or start from a lab
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LABS.map((lab) => (
            <Link
              key={lab.slug}
              to="/labs/$slug"
              params={{ slug: lab.slug }}
              className="inline-flex min-h-11 items-center rounded-sm border border-bone/20 px-3 py-2 text-sm text-muted-foreground transition hover:text-bone"
            >
              {lab.shortName}
            </Link>
          ))}
        </div>
      </section>
    </InstitutionLayout>
  );
}
