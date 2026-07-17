import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { INSTITUTION_PROGRAMS } from "@/data/institution";

export const Route = createFileRoute("/programs-public")({
  component: ProgramsPublicPage,
  head: () => ({
    meta: [
      { title: "Programs — The Bu1ld" },
      {
        name: "description",
        content:
          "Research fellowship, startup incubation, builder cohorts, and competitions at The Bu1ld.",
      },
    ],
  }),
});

function ProgramsPublicPage() {
  return (
    <InstitutionLayout
      eyebrow="Programs"
      title="Paths into the institution."
      description="Four operating tracks: fellowship, incubation, builder cohort, and competitions. Each has explicit outcomes and a real application path."
    >
      <div className="space-y-6">
        {INSTITUTION_PROGRAMS.map((program) => (
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
                {program.duration}
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
                  Who it is for
                </dt>
                <dd className="mt-2 text-sm text-bone">{program.whoFor}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Selectivity
                </dt>
                <dd className="mt-2 text-sm text-bone">{program.selectivity}</dd>
              </div>
            </dl>
            <h3 className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Outcomes
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {program.outcomes.map((outcome) => (
                <li key={outcome} className="text-sm text-muted-foreground">
                  · {outcome}
                </li>
              ))}
            </ul>
            <Link
              to="/apply"
              search={{ program: program.slug }}
              className="mt-6 inline-flex rounded-sm border border-accent-blue/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone transition hover:bg-accent-blue/10"
            >
              Apply →
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Members can also browse live program listings with capacity and deadlines inside the{" "}
        <Link to="/programs" className="text-accent-blue hover:text-bone">
          member portal
        </Link>
        .
      </p>
    </InstitutionLayout>
  );
}
