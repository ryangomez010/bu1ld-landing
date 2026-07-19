import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { fetchPublishedCompetitions, isCatalogPreviewCompetition } from "@/lib/competitions";
import { pageHead } from "@/lib/seo";
import type { Competition } from "@/lib/types";

export const Route = createFileRoute("/competitions")({
  component: CompetitionsPage,
  head: () =>
    pageHead({
      title: "Competitions — The Bu1ld",
      description:
        "Browse time-boxed machine-learning challenges with explicit status, submission rules, and published evaluation protocols.",
      path: "/competitions",
    }),
});

function CompetitionsPage() {
  const [items, setItems] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchPublishedCompetitions()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InstitutionLayout
      eyebrow="Competitions"
      title="Beat the protocol, not the network."
      description="Challenges publish evaluation rules before submissions open. Status is honest: upcoming means the protocol is still being frozen."
    >
      {loading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading competitions…</p>
      ) : (
        <div className="space-y-4">
          {items.some(isCatalogPreviewCompetition) ? (
            <p className="rounded-sm border border-border/50 bg-bone/[0.03] p-4 text-sm text-muted-foreground">
              Some challenges below are listed for planning. Submissions open only when a challenge
              status is <span className="text-bone">open</span> — create an account to get notified.
            </p>
          ) : null}
          {items.map((competition) => (
            <article
              key={competition.slug}
              className="rounded-sm border border-border/50 bg-bone/[0.02] p-6 transition hover:border-accent-blue/40"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-sm border border-bone/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-bone">
                  {competition.status}
                </span>
                {isCatalogPreviewCompetition(competition) ? (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Catalog preview
                  </span>
                ) : null}
                {competition.deadline ? (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Deadline {competition.deadline}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground">Deadline TBA</span>
                )}
              </div>
              <h2 className="mt-4 font-display text-2xl text-bone">
                <Link
                  to="/competitions/$slug"
                  params={{ slug: competition.slug }}
                  className="hover:text-accent-blue transition"
                >
                  {competition.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {competition.summary}
              </p>
              <p className="mt-4 text-sm text-bone">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  Recognition ·{" "}
                </span>
                {competition.prize}
              </p>
              <Link
                to="/competitions/$slug"
                params={{ slug: competition.slug }}
                className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue hover:text-bone"
              >
                {competition.status === "open" && !isCatalogPreviewCompetition(competition)
                  ? "View protocol & submit →"
                  : "View challenge details →"}
              </Link>
            </article>
          ))}
        </div>
      )}
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
