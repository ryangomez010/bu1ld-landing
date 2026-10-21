import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleDashed,
  Code2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import {
  getPortfolioRecord,
  getWebsiteDestinations,
  PORTFOLIO_RECORDS,
  type PortfolioRecord,
} from "@/data/portfolio";
import { getResearchForPortfolioRecord } from "@/data/research-portfolio";
import { parseNetworkSearch, requirePublicRecord } from "@/lib/public-discovery";
import { pageHead, titleFromSlug } from "@/lib/seo";

export const Route = createFileRoute("/portfolio/$projectId")({
  validateSearch: parseNetworkSearch,
  loader: ({ params }) => requirePublicRecord(getPortfolioRecord(params.projectId)),
  component: PortfolioProjectPage,
  notFoundComponent: PortfolioNotFound,
  head: ({ params }) => {
    const project = getPortfolioRecord(params.projectId);
    const title = project?.name ?? titleFromSlug(params.projectId);
    return pageHead({
      title: `${title} — BU1LD portfolio`,
      description: project
        ? `${project.category}. Read the current implementation boundary, evidence level, limitations, and verified links.`
        : "A public BU1LD portfolio profile with evidence-bounded project status and verified links.",
      path: `/portfolio/${encodeURIComponent(params.projectId)}`,
      robots: project ? "index, follow" : "noindex, nofollow",
    });
  },
});

const EVIDENCE_LABELS: Record<`E${number}`, string> = {
  E0: "Identity or idea only",
  E1: "Written specification",
  E2: "Code exists",
  E3: "Smoke-tested",
  E4: "Controlled result or complete local flow",
  E5: "Multi-seed benchmark or comprehensive product test",
  E6: "External dataset or real-user evidence",
  E7: "Independent reproduction or external review",
  E8: "Release-ready after live and external checks",
};

function readableSourceStatus(status: string): string {
  if (status === "BOUND_CURRENT_CHECKOUT") return "Current source bound";
  if (status === "BOUND_RELOCATED_REPOSITORY") return "Relocated source bound";
  if (status === "BOUND_ARCHIVED_REPOSITORY") return "Archived source bound";
  if (status === "BOUND_EMPTY_REPOSITORY") return "Empty repository retained";
  if (status === "BOUND_RECOVERED_SOURCE") return "Recovered source only";
  if (status === "BOUND_PARTIAL_IDENTITY") return "Partial identity";
  if (status === "BOUND_DISCOVERED_REPOSITORY") return "Source bound";
  if (status === "UNRESOLVED_NON_PROJECT") return "Unresolved non-project record";
  if (status === "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY") return "Source unresolved";
  return status.toLowerCase().replaceAll("_", " ");
}

function PortfolioNotFound() {
  return (
    <InstitutionLayout
      eyebrow="Portfolio profile"
      title="Project not found"
      description="This identifier is not part of the current canonical portfolio registry."
    >
      <Link
        to="/network"
        className="inline-flex items-center gap-2 rounded-sm bg-bone px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-background transition hover:bg-accent-blue"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to all projects
      </Link>
    </InstitutionLayout>
  );
}

function PortfolioProjectPage() {
  const project: PortfolioRecord = Route.useLoaderData();
  const search = Route.useSearch();

  const destinations = getWebsiteDestinations(project.id);
  const projectIndex = PORTFOLIO_RECORDS.findIndex((record) => record.id === project.id);
  const previous = PORTFOLIO_RECORDS[projectIndex - 1];
  const next = PORTFOLIO_RECORDS[projectIndex + 1];
  const unresolved = project.sourceStatus.startsWith("UNRESOLVED");
  const connectedResearch = getResearchForPortfolioRecord(project.id);

  return (
    <InstitutionLayout
      eyebrow="Canonical portfolio profile"
      title={project.name}
      description={project.objective}
    >
      <Link
        to="/network"
        search={search}
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-bone"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All portfolio projects
      </Link>

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        This source-identity profile preserves the 10 October 2026 registry snapshot. Connected
        research pages carry their own source-review dates and evidence boundaries. Product,
        archive, and unresolved identities are not additional research papers.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="panel rounded-sm p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Classification
          </p>
          <p className="mt-2 text-sm text-bone">{project.classification.replaceAll("_", " ")}</p>
        </div>
        <div className="panel rounded-sm p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Evidence level
          </p>
          <p className="mt-2 text-sm text-bone">
            {project.evidenceLevel} · {EVIDENCE_LABELS[project.evidenceLevel]}
          </p>
        </div>
        <div className="panel rounded-sm p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Source identity
          </p>
          <p className={unresolved ? "mt-2 text-sm text-accent-red" : "mt-2 text-sm text-bone"}>
            {readableSourceStatus(project.sourceStatus)}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-10">
          <section aria-labelledby="category-heading">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
              Category
            </p>
            <h2 id="category-heading" className="mt-2 font-display text-3xl text-bone">
              {project.category}
            </h2>
          </section>

          <section className="border-t border-border/60 pt-8" aria-labelledby="implemented-heading">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-green">
              What exists now
            </p>
            <h2 id="implemented-heading" className="mt-2 font-display text-2xl text-bone">
              Current implementation
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              {project.implemented}
            </p>
          </section>

          <section className="border-t border-border/60 pt-8" aria-labelledby="output-heading">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Intended output
            </p>
            <h2 id="output-heading" className="mt-2 font-display text-2xl text-bone">
              The target, not a completion claim
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              {project.intendedOutput}
            </p>
          </section>

          <section
            className="rounded-sm border border-accent-red/20 bg-accent-red/5 p-6"
            aria-labelledby="limitations-heading"
          >
            <ShieldCheck className="h-5 w-5 text-accent-red" aria-hidden />
            <h2 id="limitations-heading" className="mt-4 font-display text-2xl text-bone">
              Evidence boundary
            </h2>
            <ul className="mt-4 space-y-3">
              {project.limitations.map((limitation) => (
                <li
                  key={limitation}
                  className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" aria-hidden />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4" aria-label="Project links">
          <div className="panel rounded-sm p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Verified links
            </p>
            <div className="mt-5 space-y-3">
              {destinations.map((destination) =>
                destination.publicUrl ? (
                  <a
                    key={destination.id}
                    href={destination.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-sm border border-bone/15 px-4 py-3 text-sm text-bone transition hover:border-accent-blue/50 hover:bg-accent-blue/5"
                  >
                    <span>
                      {destination.name}
                      <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
                        {destination.availability}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <div
                    key={destination.id}
                    className="flex items-center gap-3 rounded-sm border border-border px-4 py-3 text-sm text-muted-foreground"
                  >
                    <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{destination.name} is owner-only</span>
                  </div>
                ),
              )}

              {project.repositoryUrl ? (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-sm border border-bone/15 px-4 py-3 text-sm text-bone transition hover:border-accent-blue/50 hover:bg-accent-blue/5"
                >
                  <span>Public source</span>
                  <Code2 className="h-4 w-4 shrink-0" aria-hidden />
                </a>
              ) : null}

              {destinations.length === 0 && !project.repositoryUrl ? (
                <p className="rounded-sm border border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  No public deployment or repository URL has been verified for this identity. This
                  profile remains its stable public webpage.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-sm border border-accent-blue/20 bg-accent-blue/5 p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
              What this page proves
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This page proves that the identity is registered and publicly described at its current
              evidence boundary. It does not independently certify a result, release, or deployment.
            </p>
          </div>
        </aside>
      </div>

      {connectedResearch.length ? (
        <section
          className="mt-14 rounded-sm border border-accent-green/20 bg-accent-green/5 p-6 md:p-8"
          aria-labelledby="connected-research-heading"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-green">
            Explicit atlas connection
          </p>
          <h2 id="connected-research-heading" className="mt-2 font-display text-3xl text-bone">
            Connected research {connectedResearch.length === 1 ? "line" : "lines"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These links exist only where the public research atlas and source registry have a
            declared one-to-one identity. Similar names alone are not enough.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {connectedResearch.map((item) => (
              <Link
                key={item.slug}
                to="/research-atlas/$slug"
                params={{ slug: item.slug }}
                className="group rounded-sm border border-accent-green/20 bg-background/30 p-5 transition hover:border-accent-green/60"
              >
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-accent-green">
                  {item.kind} · {item.stage}
                </span>
                <h3 className="mt-2 font-display text-xl text-bone">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.publicStatus}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-accent-green group-hover:text-bone">
                  Open atlas record <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <nav
        className="mt-16 grid gap-3 border-t border-border/60 pt-8 sm:grid-cols-2"
        aria-label="Portfolio project pagination"
      >
        {previous ? (
          <Link
            to="/portfolio/$projectId"
            params={{ projectId: previous.id }}
            search={search}
            className="group rounded-sm border border-border p-5 transition hover:border-bone/30 hover:bg-bone/5"
          >
            <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              <ArrowLeft className="h-3 w-3" aria-hidden /> Previous project
            </span>
            <span className="mt-2 block font-display text-xl text-bone">{previous.name}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to="/portfolio/$projectId"
            params={{ projectId: next.id }}
            search={search}
            className="group rounded-sm border border-border p-5 text-right transition hover:border-bone/30 hover:bg-bone/5"
          >
            <span className="flex items-center justify-end gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              Next project <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
            <span className="mt-2 block font-display text-xl text-bone">{next.name}</span>
          </Link>
        ) : null}
      </nav>
    </InstitutionLayout>
  );
}
