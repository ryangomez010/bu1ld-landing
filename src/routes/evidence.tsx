import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { PublicDataNotice } from "@/components/institution/PublicDataNotice";
import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { fetchVerifiedInstitutionalClaims } from "@/lib/institutional-claims";
import { fetchPublicProjectOutputs, type PublicProjectOutput } from "@/lib/project-collaboration";
import { pageHead } from "@/lib/seo";
import type { InstitutionalClaim } from "@/lib/types";
import { safeHref } from "@/lib/urls";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
  head: () =>
    pageHead({
      title: "Evidence register — The Bu1ld",
      description:
        "Inspect primary sources for verified institutional claims and public, independently reviewed project contributions.",
      path: "/evidence",
    }),
});

const EMPTY_CLAIMS: InstitutionalClaim[] = [];
const EMPTY_OUTPUTS: PublicProjectOutput[] = [];

function EvidencePage() {
  const claimsQuery = useQuery({
    queryKey: ["public-verified-claims"],
    queryFn: () => fetchVerifiedInstitutionalClaims({ throwOnUnavailable: true }),
    staleTime: 60_000,
    retry: false,
  });
  const outputsQuery = useQuery({
    queryKey: ["public-project-outputs"],
    queryFn: () => fetchPublicProjectOutputs(24, { throwOnUnavailable: true }),
    staleTime: 60_000,
    retry: false,
  });
  const claims = claimsQuery.data ?? EMPTY_CLAIMS;
  const outputs = outputsQuery.data ?? EMPTY_OUTPUTS;
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

  return (
    <InstitutionLayout
      eyebrow="Public evidence register"
      title="Claims should survive inspection."
      description="Verified institutional claims and public project outputs appear here. Missing evidence means a claim or contribution does not belong in the archive."
    >
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent-green">
        <ShieldCheck className="h-4 w-4" />
        Sources and verified work
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-bone">Verified institutional claims</h2>
        {claimsQuery.isError ? (
          <PublicDataNotice
            title="Verified claims couldn’t be refreshed."
            hasCachedData={claimsQuery.data !== undefined}
            retrying={claimsQuery.isFetching}
            onRetry={() => void claimsQuery.refetch()}
          />
        ) : null}
        {claimsQuery.isLoading ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Loading verified claims…
          </p>
        ) : claimsQuery.isError && !claimsQuery.data ? null : claims.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/60 p-7">
            <h3 className="font-display text-xl text-bone">No verified claims are published.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Affiliations, totals, and outcomes are listed only when an administrator links a
              current primary source and verifies the claim.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-12">
            {[...groups.entries()].map(([type, items]) => (
              <section key={type}>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-green">
                  {type.replace("_", " ")}
                </h3>
                <div className="mt-4 grid gap-3">
                  {items.map((claim) => (
                    <article
                      key={claim.id}
                      className="rounded-2xl border border-border/60 bg-background/65 p-6 backdrop-blur-sm"
                    >
                      <h4 className="text-lg leading-relaxed text-bone">{claim.statement}</h4>
                      {claim.context ? (
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                          {claim.context}
                        </p>
                      ) : null}
                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        {safeHref(claim.evidence_url) ? (
                          <a
                            href={safeHref(claim.evidence_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-bone"
                          >
                            {claim.evidence_label}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Evidence URL unavailable
                          </span>
                        )}
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
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-bone">Public project outputs</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Only completed public milestones and lead-verified public contributions from published
          projects appear here. Team-only work and unverified submissions stay private.
        </p>
        {outputsQuery.isError ? (
          <PublicDataNotice
            title="Public project outputs couldn’t be refreshed."
            hasCachedData={outputsQuery.data !== undefined}
            retrying={outputsQuery.isFetching}
            onRetry={() => void outputsQuery.refetch()}
          />
        ) : null}
        {outputsQuery.isLoading ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Loading public project outputs…
          </p>
        ) : outputsQuery.isError && !outputsQuery.data ? null : outputs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-7">
            <h3 className="font-display text-xl text-bone">
              No verified project outputs are public.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Leads can mark milestones public and verify public contribution evidence from the
              project workspace. Until then, this archive remains empty rather than showing
              demonstration results as real output.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {outputs.map((output) => {
              const item = output.kind === "milestone" ? output.milestone : output.contribution;
              const date =
                output.kind === "milestone"
                  ? (output.milestone.completed_at ?? output.milestone.updated_at)
                  : (output.contribution.verified_at ?? output.contribution.updated_at);
              return (
                <article
                  key={`${output.kind}-${item.id}`}
                  className="rounded-2xl border border-border/60 bg-background/65 p-6"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                    {output.kind} · {output.project.type}
                  </p>
                  <h3 className="mt-3 font-display text-xl text-bone">{item.title}</h3>
                  {"description" in item && item.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  {"summary" in item ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.summary}
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <Link
                      to="/projects/$slug"
                      params={{ slug: output.project.slug }}
                      className="text-sm text-accent-blue hover:text-bone"
                    >
                      {output.project.title} →
                    </Link>
                    {"evidence_url" in item && safeHref(item.evidence_url) ? (
                      <a
                        href={safeHref(item.evidence_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-accent-blue hover:text-bone"
                      >
                        Source <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </InstitutionLayout>
  );
}
