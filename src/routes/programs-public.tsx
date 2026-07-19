import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { INSTITUTION_PROGRAMS } from "@/data/institution";
import { useAuth } from "@/lib/auth";
import {
  loginPathWithRedirect,
  programApplyPath,
  signupPathWithRedirect,
} from "@/lib/post-auth-redirect";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/programs-public")({
  component: ProgramsPublicPage,
  head: () =>
    pageHead({
      title: "Programs — The Bu1ld",
      description:
        "Compare The Bu1ld's research fellowship, startup incubation, builder cohort, and competition paths by objective, commitment, status, and output.",
      path: "/programs-public",
    }),
});

function ProgramsPublicPage() {
  const { user, profile } = useAuth();
  const memberReady = Boolean(user && profile?.onboarding_completed);

  return (
    <InstitutionLayout
      eyebrow="Programs"
      title="Paths into the institution."
      description="Four operating tracks: fellowship, incubation, builder cohort, and competitions. Each states objective, audience, commitment, timeline, expected output, selection, status, and a real next step."
    >
      <div className="space-y-6">
        {INSTITUTION_PROGRAMS.map((program) => {
          const destination = programApplyPath(program.slug);
          return (
            <article
              key={program.slug}
              id={program.slug}
              className="scroll-mt-28 rounded-sm border border-border/50 bg-bone/[0.02] p-6 md:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-blue">
                  {program.kind}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {program.status} · {program.duration}
                </p>
              </div>
              <h2 className="mt-3 font-display text-2xl tracking-tight text-bone md:text-3xl">
                {program.name}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {program.summary}
              </p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Objective
                  </dt>
                  <dd className="mt-2 text-sm text-bone">{program.objective}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Audience
                  </dt>
                  <dd className="mt-2 text-sm text-bone">{program.whoFor}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Commitment
                  </dt>
                  <dd className="mt-2 text-sm text-bone">{program.commitment}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Timeline
                  </dt>
                  <dd className="mt-2 text-sm text-bone">{program.timeline}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Selection
                  </dt>
                  <dd className="mt-2 text-sm text-bone">{program.selectivity}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-2 text-sm text-bone">{program.status}</dd>
                </div>
              </dl>
              <h3 className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                Expected output
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {program.outcomes.map((outcome) => (
                  <li key={outcome} className="text-sm text-muted-foreground">
                    · {outcome}
                  </li>
                ))}
              </ul>
              {memberReady ? (
                program.slug === "open-competitions" ? (
                  <Link
                    to="/competitions"
                    className="mt-6 inline-flex rounded-sm border border-accent-blue/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone transition hover:bg-accent-blue/10"
                  >
                    View competitions →
                  </Link>
                ) : (
                  <Link
                    to="/programs/$slug"
                    params={{ slug: program.slug }}
                    className="mt-6 inline-flex rounded-sm border border-accent-blue/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone transition hover:bg-accent-blue/10"
                  >
                    Apply in member portal →
                  </Link>
                )
              ) : (
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={signupPathWithRedirect(destination)}
                    className="inline-flex rounded-sm border border-accent-blue/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone transition hover:bg-accent-blue/10"
                  >
                    Create account to apply →
                  </a>
                  <a
                    href={loginPathWithRedirect(destination)}
                    className="inline-flex rounded-sm border border-bone/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-bone"
                  >
                    Log in
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Live cycles with capacity and deadlines appear in the{" "}
        <Link to="/programs" className="text-accent-blue hover:text-bone">
          member programs list
        </Link>{" "}
        once published. Until then, the tracks above describe how each path works.
      </p>
    </InstitutionLayout>
  );
}
