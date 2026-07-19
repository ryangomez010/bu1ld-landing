import { createFileRoute, Link } from "@tanstack/react-router";
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
  program: z.string().optional(),
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
  const memberReady = Boolean(user && profile?.onboarding_completed);

  return (
    <InstitutionLayout
      eyebrow="Applications"
      title="Start from a project, or choose a program path."
      description="Most builders browse an open project brief first, then create an account to apply. Program paths follow the same account → profile → review → contribution loop."
    >
      {selected ? (
        <div className="mb-10 rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue">
            Selected path · {selected.status}
          </p>
          <h2 className="mt-2 font-display text-2xl text-bone">{selected.name}</h2>
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
            {memberReady ? (
              selected.slug === "open-competitions" ? (
                <Link
                  to="/competitions"
                  className="rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-background transition hover:bg-accent-blue"
                >
                  Continue to competitions →
                </Link>
              ) : (
                <Link
                  to="/programs/$slug"
                  params={{ slug: selected.slug }}
                  className="rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-background transition hover:bg-accent-blue"
                >
                  Continue to application →
                </Link>
              )
            ) : (
              <>
                <a
                  href={signupPathWithRedirect(destination)}
                  className="rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-background transition hover:bg-accent-blue"
                >
                  Create account to apply →
                </a>
                <a
                  href={loginPathWithRedirect(destination)}
                  className="rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-bone"
                >
                  Log in and continue
                </a>
              </>
            )}
          </div>
        </div>
      ) : null}

      <ol className="grid gap-4 md:grid-cols-2">
        {APPLICATION_STEPS.map((step) => (
          <li key={step.step} className="rounded-sm border border-border/50 bg-bone/[0.02] p-5">
            <p className="font-mono text-[10px] tracking-[0.28em] text-bone/40">{step.step}</p>
            <h3 className="mt-3 font-display text-xl text-bone">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Choose a program
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {INSTITUTION_PROGRAMS.map((program) => (
            <Link
              key={program.slug}
              to="/apply"
              search={{ program: program.slug }}
              className={`rounded-sm border p-4 transition ${
                selected?.slug === program.slug
                  ? "border-accent-blue/50 bg-accent-blue/10"
                  : "border-border/40 hover:border-bone/30"
              }`}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                {program.kind} · {program.status}
              </p>
              <p className="mt-2 font-display text-lg text-bone">{program.name}</p>
            </Link>
          ))}
        </div>
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
              className="rounded-sm border border-bone/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-bone"
            >
              {lab.shortName}
            </Link>
          ))}
        </div>
      </section>

      {!selected ? (
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/projects"
            className="rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-background transition hover:bg-accent-blue"
          >
            Browse projects →
          </Link>
          <a
            href={signupPathWithRedirect("/projects")}
            className="rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-bone"
          >
            Create account to apply
          </a>
          <a
            href={loginPathWithRedirect("/projects")}
            className="rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-bone"
          >
            Log in
          </a>
        </div>
      ) : null}
    </InstitutionLayout>
  );
}
