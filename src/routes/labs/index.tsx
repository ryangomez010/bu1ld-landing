import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { LABS } from "@/data/institution";
import { textAccent } from "@/data/landing";

export const Route = createFileRoute("/labs/")({
  component: LabsIndexPage,
  head: () => ({
    meta: [
      { title: "Research labs — The Bu1ld" },
      {
        name: "description",
        content:
          "Six research labs spanning scientific discovery, mathematical intelligence, robotics, computational finance, real-world AI, and emerging interdisciplinary work.",
      },
    ],
  }),
});

function LabsIndexPage() {
  return (
    <InstitutionLayout
      eyebrow="Research labs"
      title="Where questions become operating systems."
      description="Each lab owns a problem class, a method stack, and open roles. Projects live inside labs; programs feed talent into them."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {LABS.map((lab) => (
          <Link
            key={lab.slug}
            to="/labs/$slug"
            params={{ slug: lab.slug }}
            className="group rounded-sm border border-border/50 bg-bone/[0.02] p-6 transition hover:border-bone/30 hover:bg-bone/[0.04]"
          >
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.22em] ${textAccent[lab.color] ?? "text-bone"}`}
            >
              Lab
            </p>
            <h2 className="mt-3 font-display text-2xl tracking-tight text-bone group-hover:text-accent-blue">
              {lab.shortName}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lab.tagline}</p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">
              {lab.openRoles.length} open role types →
            </p>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Ready to contribute?{" "}
        <Link to="/apply" className="text-accent-blue hover:text-bone">
          Start an application
        </Link>
        .
      </p>
    </InstitutionLayout>
  );
}
