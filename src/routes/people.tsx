import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { PEOPLE_PUBLIC } from "@/data/institution";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/people")({
  component: PeoplePage,
  head: () =>
    pageHead({
      title: "People — The Bu1ld",
      description:
        "Verified public leadership and contributor roles at The Bu1ld; member profiles remain opt-in.",
      path: "/people",
    }),
});

function PeoplePage() {
  return (
    <InstitutionLayout
      eyebrow="People"
      title="Operators, researchers, and builders."
      description="Public pages name institutional roles carefully. Individual member profiles live in the authenticated directory once members opt into visibility."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {PEOPLE_PUBLIC.map((person) => (
          <article
            key={person.name}
            className="rounded-sm border border-border/50 bg-bone/[0.02] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-bone/20 font-mono text-sm text-bone">
                {person.initials}
              </div>
              <div>
                <h2 className="font-display text-xl text-bone">{person.name}</h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-blue">
                  {person.role}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
          </article>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Members: browse the live{" "}
        <Link to="/members" className="text-accent-blue hover:text-bone">
          directory
        </Link>{" "}
        after login.
      </p>
    </InstitutionLayout>
  );
}
