import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { fetchPublicPapers } from "@/lib/content";
import { pageHead } from "@/lib/seo";
import type { Paper } from "@/lib/types";

export const Route = createFileRoute("/publications")({
  component: PublicationsPage,
  head: () =>
    pageHead({
      title: "Publications — The Bu1ld",
      description:
        "Read published paper reviews, explainers, and research notes with explicit status and evidence-aware analysis.",
      path: "/publications",
    }),
});

function PublicationsPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublicPapers().then((rows) => {
      setPapers(rows);
      setLoading(false);
    });
  }, []);

  return (
    <InstitutionLayout
      eyebrow="Publications"
      title="Reviews that name failure modes."
      description="The Bu1ld publishes member paper reviews, explainers, and research notes. We do not claim peer-reviewed venue counts we cannot evidence."
    >
      {loading ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground animate-pulse">
          Loading publications…
        </p>
      ) : papers.length === 0 ? (
        <div className="rounded-sm border border-border/50 bg-bone/[0.02] p-8">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No public reviews are listed yet. Members can browse the full paper library after
            joining; reviewers submit drafts from the research desk.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-background transition hover:bg-accent-blue"
            >
              Join The Bu1ld
            </Link>
            <Link
              to="/papers"
              className="rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-bone"
            >
              Member papers →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {papers.map((paper) => {
            const href = paper.source_url || paper.arxiv_url;
            return (
              <li key={paper.id} className="rounded-sm border border-border/50 bg-bone/[0.02] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-green">
                  {[paper.field, paper.difficulty, paper.venue].filter(Boolean).join(" · ") ||
                    "Paper review"}
                </p>
                <h2 className="mt-3 font-display text-xl text-bone">{paper.title}</h2>
                {paper.authors ? (
                  <p className="mt-2 text-sm text-muted-foreground">{paper.authors}</p>
                ) : null}
                {(paper.editorial_summary || paper.summary) && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {paper.editorial_summary || paper.summary}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-4">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-blue hover:text-bone"
                    >
                      Source →
                    </a>
                  ) : null}
                  <Link
                    to="/papers/$slug"
                    params={{ slug: paper.slug }}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-bone"
                  >
                    Member review →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-sm border border-border/50 bg-bone/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-green">
            Member library
          </p>
          <h2 className="mt-3 font-display text-xl text-bone">Full reading paths</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Classics and active threads — methods, reproducibility gaps, and what we would prototype
            next.
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
