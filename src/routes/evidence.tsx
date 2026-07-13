import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageBackground } from "@/components/layout/PageBackground";
import { Wordmark } from "@/components/Wordmark";
import { fetchVerifiedInstitutionalClaims } from "@/lib/institutional-claims";
import type { InstitutionalClaim } from "@/lib/types";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
  head: () => ({
    meta: [
      { title: "Evidence register — The Bu1ld" },
      {
        name: "description",
        content: "Primary sources for The Bu1ld's public institutional claims.",
      },
    ],
  }),
});

function EvidencePage() {
  const [claims, setClaims] = useState<InstitutionalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const groups = useMemo(
    () =>
      claims.reduce((result, claim) => {
        const items = result.get(claim.claim_type) ?? [];
        items.push(claim);
        result.set(claim.claim_type, items);
        return result;
      }, new Map<InstitutionalClaim["claim_type"], InstitutionalClaim[]>()),
    [claims],
  );

  useEffect(() => {
    void fetchVerifiedInstitutionalClaims().then((items) => {
      setClaims(items);
      setLoading(false);
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <PageBackground />
      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/">
            <Wordmark />
          </Link>
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-bone"
          >
            Back to institution
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent-green">
            <ShieldCheck className="h-4 w-4" />
            Public evidence register
          </div>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-bone md:text-6xl">
            Claims should survive inspection.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            This register contains the primary source behind every verified affiliation,
            publication, programme outcome, project result, or institutional statistic that The
            Bu1ld chooses to state publicly. Missing evidence means the claim does not belong here.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 h-32 animate-pulse rounded-2xl border border-border/50 bg-bone/[0.03]" />
        ) : claims.length === 0 ? (
          <section className="mt-12 rounded-2xl border border-border/60 bg-background/60 p-7">
            <h2 className="font-display text-xl text-bone">No verified claims are published.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The absence is intentional: The Bu1ld does not display affiliations, publication
              totals, member counts, or project outcomes until a responsible administrator has
              linked a current primary source.
            </p>
          </section>
        ) : (
          <div className="mt-14 space-y-12">
            {[...groups.entries()].map(([type, items]) => (
              <section key={type}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-green">
                  {type.replace("_", " ")}
                </h2>
                <div className="mt-4 grid gap-3">
                  {items.map((claim) => (
                    <article
                      key={claim.id}
                      className="rounded-2xl border border-border/60 bg-background/65 p-6 backdrop-blur-sm"
                    >
                      <h3 className="text-lg leading-relaxed text-bone">{claim.statement}</h3>
                      {claim.context ? (
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                          {claim.context}
                        </p>
                      ) : null}
                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        <a
                          href={claim.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-bone"
                        >
                          {claim.evidence_label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          Verified{" "}
                          {claim.reviewed_at
                            ? new Date(claim.reviewed_at).toLocaleDateString()
                            : "by administrator"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
