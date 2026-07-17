import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { COMPETITIONS } from "@/data/institution";

export const Route = createFileRoute("/competitions")({
  component: CompetitionsPage,
  head: () => ({
    meta: [
      { title: "Competitions — The Bu1ld" },
      {
        name: "description",
        content:
          "Time-boxed challenges with published evaluation protocols at The Bu1ld.",
      },
    ],
  }),
});

function CompetitionsPage() {
  return (
    <InstitutionLayout
      eyebrow="Competitions"
      title="Beat the protocol, not the network."
      description="Challenges publish evaluation rules before submissions open. Status is honest: upcoming means the protocol is still being frozen."
    >
      <div className="space-y-4">
        {COMPETITIONS.map((competition) => (
          <article
            key={competition.slug}
            className="rounded-sm border border-border/50 bg-bone/[0.02] p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-sm border border-bone/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-bone">
                {competition.status}
              </span>
              {competition.deadline ? (
                <span className="font-mono text-[10px] text-muted-foreground">
                  Deadline {competition.deadline}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-muted-foreground">
                  Deadline TBA
                </span>
              )}
            </div>
            <h2 className="mt-4 font-display text-2xl text-bone">{competition.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {competition.summary}
            </p>
            <p className="mt-4 text-sm text-bone">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Recognition ·{" "}
              </span>
              {competition.prize}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Want early notice?{" "}
        <Link to="/signup" className="text-accent-blue hover:text-bone">
          Create a member account
        </Link>{" "}
        and watch announcements in your dashboard.
      </p>
    </InstitutionLayout>
  );
}
