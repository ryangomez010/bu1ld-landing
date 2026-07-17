import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { PARTNERSHIPS } from "@/data/institution";
import { CONTACT_EMAIL } from "@/data/landing";

export const Route = createFileRoute("/partnerships")({
  component: PartnershipsPage,
  head: () => ({
    meta: [
      { title: "Partnerships — The Bu1ld" },
      {
        name: "description",
        content:
          "Academic, infrastructure, and community partnerships. We disclose relationships when they are active and material.",
      },
    ],
  }),
});

function PartnershipsPage() {
  return (
    <InstitutionLayout
      eyebrow="Partnerships"
      title="Collaborations we can stand behind."
      description="We do not invent logos. Partnerships appear here when the relationship is real, scoped, and useful to members."
    >
      <div className="space-y-4">
        {PARTNERSHIPS.map((partner) => (
          <article
            key={partner.name}
            className="rounded-sm border border-border/50 bg-bone/[0.02] p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                {partner.kind}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {partner.status}
              </span>
            </div>
            <h2 className="mt-3 font-display text-xl text-bone">{partner.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{partner.summary}</p>
          </article>
        ))}
      </div>
      <section className="mt-12 rounded-sm border border-border/50 p-6">
        <h2 className="font-display text-xl text-bone">Propose a partnership</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Academic co-advising, compute grants, and community collaborations are welcome when they
          come with clear mutual obligations. Write{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:text-bone">
            {CONTACT_EMAIL}
          </a>{" "}
          with scope, timeline, and what success looks like in 90 days.
        </p>
        <Link
          to="/evidence"
          className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-bone"
        >
          See the evidence register →
        </Link>
      </section>
    </InstitutionLayout>
  );
}
