import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { MarkdownBody, TagList } from "@/components/member/ContentCard";
import { SaveButton } from "@/components/member/SaveButton";
import { MemberLayout } from "@/components/member/MemberLayout";
import { fetchPaperBySlug, fetchPapers } from "@/lib/content";
import type { Paper } from "@/lib/types";

export const Route = createFileRoute("/papers/$slug")({
  component: PaperDetailPage,
});

function PaperDetailPage() {
  return (
    <RequireAuth>
      <PaperDetail />
    </RequireAuth>
  );
}

function PaperDetail() {
  const { slug } = Route.useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [related, setRelated] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchPaperBySlug(slug), fetchPapers()]).then(([p, all]) => {
      setPaper(p);
      if (p) {
        const tags = new Set(p.tags.map((t) => t.toLowerCase()));
        setRelated(
          all
            .filter((x) => x.id !== p.id)
            .map((x) => ({
              paper: x,
              score: x.tags.filter((t) => tags.has(t.toLowerCase())).length,
            }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((x) => x.paper),
        );
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <MemberLayout>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      </MemberLayout>
    );
  }

  if (!paper) {
    return (
      <MemberLayout title="Paper not found">
        <Link to="/papers" className="text-accent-blue text-sm">
          ← Back to papers
        </Link>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <Link
        to="/papers"
        className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone"
      >
        ← Papers
      </Link>
      <article className="mt-6 max-w-2xl">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue">
          {paper.is_classic ? "classic review" : "build review"}
        </p>
        <h1 className="font-display text-4xl text-bone mt-3 tracking-tight">{paper.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          <SaveButton itemType="paper" itemSlug={paper.slug} itemTitle={paper.title} />
        </div>
        <p className="mt-2 text-muted-foreground">
          {[paper.authors, paper.year].filter(Boolean).join(" · ")}
        </p>
        <TagList tags={paper.tags} linkToSearch className="mt-4" />
        {paper.arxiv_url ? (
          <a
            href={paper.arxiv_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-accent-blue hover:text-bone"
          >
            Read original <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        <div className="divider-grad my-8" />
        <MarkdownBody body={paper.review_body} />

        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Related reviews
            </h2>
            <div className="grid gap-px border border-border/40 bg-border/40">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/papers/${r.slug}`}
                  className="bg-background/75 p-5 hover:bg-bone/5 transition block"
                >
                  <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue">
                    {r.is_classic ? "classic" : "review"}
                  </p>
                  <h3 className="font-display text-lg text-bone mt-2">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </MemberLayout>
  );
}
