import { createFileRoute, Link } from "@tanstack/react-router";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";

export const Route = createFileRoute("/publications")({
  component: PublicationsPage,
  head: () => ({
    meta: [
      { title: "Publications — The Bu1ld" },
      {
        name: "description",
        content:
          "Paper reviews, explainers, and research notes from The Bu1ld. Full library available to members.",
      },
    ],
  }),
});

function PublicationsPage() {
  return (
    <InstitutionLayout
      eyebrow="Publications"
      title="Reviews that name failure modes."
      description="The Bu1ld publishes member paper reviews, explainers, and research notes. We do not claim peer-reviewed venue counts we cannot evidence."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-sm border border-border/50 bg-bone/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-green">
            Member library
          </p>
          <h2 className="mt-3 font-display text-xl text-bone">Paper reviews & explainers</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Classics and active threads — methods, reproducibility gaps, and what we would
            prototype next. Full reading paths live in the member portal.
          </p>
          <Link
            to="/papers"
            className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-accent-blue"
          >
            Open papers (members) →
          </Link>
        </article>
        <article className="rounded-sm border border-border/50 bg-bone/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue">
            Evidence
          </p>
          <h2 className="mt-3 font-display text-xl text-bone">Institutional claims</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Any public claim about publications, affiliations, or outcomes must appear in the
            evidence register with a primary source.
          </p>
          <Link
            to="/evidence"
            className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-accent-blue"
          >
            Evidence register →
          </Link>
        </article>
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Want to write a review? Members with the reviewer role can submit drafts at{" "}
        <Link to="/research/submit" className="text-accent-blue hover:text-bone">
          /research/submit
        </Link>
        .
      </p>
    </InstitutionLayout>
  );
}
