import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Code2,
  Download,
  ExternalLink,
  Filter,
  LockKeyhole,
  Network,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import {
  BOUND_SOURCE_COUNT,
  PORTFOLIO_RECORDS,
  UNRESOLVED_SOURCE_COUNT,
  WEBSITE_DESTINATIONS,
  type PortfolioRecord,
  type WebsiteAvailability,
} from "@/data/portfolio";
import {
  parseNetworkSearch,
  PORTFOLIO_FILTERS,
  PUBLIC_SEARCH_MAX_LENGTH,
  shouldFocusPublicSearch,
  type PortfolioFilter,
} from "@/lib/public-discovery";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network")({
  component: NetworkPage,
  validateSearch: parseNetworkSearch,
  head: () =>
    pageHead({
      title: "Network — The Bu1ld",
      description:
        "Verified destinations and evidence-bounded source identities across the BU1LD product and research portfolio.",
      path: "/network",
    }),
});

const availabilityMeta: Record<
  WebsiteAvailability,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  live: {
    label: "Live",
    icon: CheckCircle2,
    className: "border-accent-green/30 bg-accent-green/10 text-accent-green",
  },
  preview: {
    label: "Preview",
    icon: CircleDashed,
    className: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
  },
  private: {
    label: "Owner-only",
    icon: LockKeyhole,
    className: "border-bone/20 bg-bone/5 text-muted-foreground",
  },
};

function recordMatches(record: PortfolioRecord, filter: PortfolioFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unresolved") return record.sourceStatus.startsWith("UNRESOLVED");
  if (filter === "archive") return record.classification === "ARCHIVE";
  if (filter === "products") {
    return record.classification === "PRODUCT" || record.classification === "PRODUCT_RESEARCH";
  }
  return ["RESEARCH", "RESEARCH_PLATFORM", "FLAGSHIP", "CORE"].includes(record.classification);
}

function sourceStatusLabel(status: string): string {
  if (status === "BOUND_CURRENT_CHECKOUT") return "current source bound";
  if (status === "BOUND_RELOCATED_REPOSITORY") return "relocated source bound";
  if (status === "BOUND_ARCHIVED_REPOSITORY") return "archived source bound";
  if (status === "BOUND_EMPTY_REPOSITORY") return "empty repository retained";
  if (status === "BOUND_RECOVERED_SOURCE") return "recovered source only";
  if (status === "BOUND_PARTIAL_IDENTITY") return "partial identity";
  if (status === "BOUND_DISCOVERED_REPOSITORY") return "source bound";
  if (status === "UNRESOLVED_NON_PROJECT") return "unresolved non-project record";
  if (status === "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY") return "source unresolved";
  return status.toLowerCase().replaceAll("_", " ");
}

function NetworkPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { filter: searchFilter, q: searchQuery } = search;
  const filter = searchFilter ?? "all";
  const query = searchQuery ?? "";
  const normalizedQuery = query.trim().toLowerCase();

  const updateSearch = useCallback(
    (next: { filter?: PortfolioFilter; q?: string }) => {
      const nextFilter = next.filter ?? filter;
      const nextQuery = next.q ?? query;
      void navigate({
        search: {
          filter: nextFilter === "all" ? undefined : nextFilter,
          q: nextQuery || undefined,
        },
        replace: true,
        resetScroll: false,
      });
    },
    [filter, navigate, query],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldFocusPublicSearch(event, document.activeElement)) {
        event.preventDefault();
        document.getElementById("network-search")?.focus();
      }
      if (
        !event.isComposing &&
        event.key === "Escape" &&
        document.activeElement?.id === "network-search"
      ) {
        updateSearch({ q: "" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [updateSearch]);

  const records = useMemo(
    () =>
      PORTFOLIO_RECORDS.filter((record) => {
        if (!recordMatches(record, filter)) return false;
        if (!normalizedQuery) return true;
        return [
          record.name,
          record.category,
          record.objective,
          record.implemented,
          record.intendedOutput,
          record.classification,
          record.evidenceLevel,
          sourceStatusLabel(record.sourceStatus),
          ...record.limitations,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      }),
    [filter, normalizedQuery],
  );

  const filterCount = (value: PortfolioFilter) =>
    PORTFOLIO_RECORDS.filter((record) => recordMatches(record, value)).length;
  const hasActiveFilters = filter !== "all" || normalizedQuery.length > 0;

  return (
    <InstitutionLayout
      eyebrow="Connected portfolio"
      title="Every destination. One honest map."
      description="Move between the public products, inspect source where it is actually public, and see which research identities are bound, partial, archived, or still unresolved. Links do not upgrade evidence or merge these products into one brand."
    >
      <section aria-labelledby="destination-heading">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="panel rounded-sm p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Canonical records
            </p>
            <p className="mt-2 font-display text-3xl text-bone">{PORTFOLIO_RECORDS.length}</p>
          </div>
          <div className="panel rounded-sm p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Source identities bound
            </p>
            <p className="mt-2 font-display text-3xl text-accent-green">{BOUND_SOURCE_COUNT}</p>
          </div>
          <div className="panel rounded-sm p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Unresolved identities
            </p>
            <p className="mt-2 font-display text-3xl text-accent-red">{UNRESOLVED_SOURCE_COUNT}</p>
          </div>
        </div>

        <Link
          to="/research-atlas"
          className="group mt-6 flex flex-col justify-between gap-5 rounded-sm border border-accent-blue/25 bg-accent-blue/5 p-6 transition hover:border-accent-blue/60 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
              Complete BU1LD research atlas
            </p>
            <p className="mt-2 font-display text-2xl text-bone">
              Browse all 33 public research lines
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Active work, retained reports, null results, negative findings, prototypes, and scoped
              foundries—each with its own evidence boundary and stable webpage.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue group-hover:text-bone">
            Open atlas <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>

        <a
          href="/portfolio-manifest.json"
          download
          className="mt-3 flex flex-col justify-between gap-3 rounded-sm border border-border px-5 py-4 transition hover:border-bone/30 hover:bg-bone/5 sm:flex-row sm:items-center"
        >
          <span className="inline-flex items-center gap-3 text-sm text-bone">
            <Download className="h-4 w-4 text-accent-green" aria-hidden />
            Download the public portfolio manifest
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
            JSON · {PORTFOLIO_RECORDS.length} identities · 33 research lines
          </span>
        </a>

        <div className="mt-16 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-accent-blue">
              Websites
            </p>
            <h2 id="destination-heading" className="mt-2 font-display text-3xl text-bone">
              Verified destinations
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Availability was checked on 11 October 2026. Preview and private labels are intentional,
            not launch claims.
          </p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {WEBSITE_DESTINATIONS.map((site) => {
            const meta = availabilityMeta[site.availability];
            const StatusIcon = meta.icon;
            return (
              <article key={site.id} className="panel group flex h-full flex-col rounded-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {site.role}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-bone">{site.name}</h3>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em]",
                      meta.className,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" aria-hidden />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {site.description}
                </p>
                <p className="mt-4 border-l border-border/70 pl-3 text-xs leading-relaxed text-bone/60">
                  {site.note}
                </p>
                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  {site.publicUrl ? (
                    <a
                      href={site.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-sm bg-bone px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-background transition hover:bg-accent-blue"
                    >
                      Open site
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                      <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
                      No public entry
                    </span>
                  )}
                  <a
                    href={site.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm border border-bone/20 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone transition hover:border-bone/50 hover:bg-bone/5"
                  >
                    Source
                    <Code2 className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-20" aria-labelledby="portfolio-heading">
        <div className="flex flex-col gap-5 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-accent-green">
              Source registry
            </p>
            <h2 id="portfolio-heading" className="mt-2 font-display text-3xl text-bone">
              Canonical portfolio identities
            </h2>
          </div>
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search canonical portfolio identities</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="network-search"
              type="search"
              maxLength={PUBLIC_SEARCH_MAX_LENGTH}
              value={query}
              onChange={(event) => updateSearch({ q: event.target.value })}
              placeholder="Search projects, fields, evidence…"
              className="w-full rounded-sm border border-border bg-background/70 py-3 pl-11 pr-10 text-sm text-bone outline-none transition placeholder:text-muted-foreground focus:border-accent-green/60 focus:ring-1 focus:ring-accent-green/30"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground sm:block">
              /
            </span>
          </label>
        </div>

        <div
          className="mt-5 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter portfolio records"
        >
          <Filter className="mr-1 h-4 w-4 text-muted-foreground" aria-hidden />
          {PORTFOLIO_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateSearch({ filter: option })}
              aria-pressed={filter === option}
              className={cn(
                "min-h-11 rounded-full border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] transition",
                filter === option
                  ? "border-accent-blue/50 bg-accent-blue/10 text-bone"
                  : "border-border text-muted-foreground hover:border-bone/30 hover:text-bone",
              )}
            >
              {option} · {filterCount(option)}
            </button>
          ))}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => updateSearch({ filter: "all", q: "" })}
              className="ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-transparent px-3 py-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition hover:text-bone"
            >
              <X className="h-3 w-3" aria-hidden /> Clear
            </button>
          ) : null}
        </div>

        <p
          className="mt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground"
          aria-live="polite"
        >
          Showing {records.length} of {PORTFOLIO_RECORDS.length} canonical identities
        </p>

        {records.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((record) => {
              const unresolved = record.sourceStatus.startsWith("UNRESOLVED");
              return (
                <article key={record.id} className="panel flex min-h-44 flex-col rounded-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                      {record.classification.replaceAll("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em]",
                        record.evidenceLevel === "E0"
                          ? "border-accent-red/30 text-accent-red"
                          : "border-bone/20 text-bone/70",
                      )}
                    >
                      {record.evidenceLevel}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl text-bone">{record.name}</h3>
                  <p
                    className={cn(
                      "mt-3 text-xs leading-relaxed",
                      unresolved ? "text-accent-red" : "text-muted-foreground",
                    )}
                  >
                    {sourceStatusLabel(record.sourceStatus)}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
                    <Link
                      to="/portfolio/$projectId"
                      params={{ projectId: record.id }}
                      search={search}
                      className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-bone hover:text-accent-blue"
                    >
                      Project webpage
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </Link>
                    {record.repositoryUrl ? (
                      <a
                        href={record.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue hover:text-bone"
                      >
                        Source
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-bone/40">
                        {unresolved ? (
                          <CircleDashed className="h-3 w-3" aria-hidden />
                        ) : (
                          <ShieldCheck className="h-3 w-3" aria-hidden />
                        )}
                        {unresolved ? "No source link" : "No public repository verified"}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-sm border border-border bg-bone/5 p-8 text-center">
            <Network className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="mt-4 text-sm text-muted-foreground">
              No canonical identity matches this search and filter combination.
            </p>
            <button
              type="button"
              onClick={() => updateSearch({ filter: "all", q: "" })}
              className="mt-5 min-h-11 rounded-sm border border-bone/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-bone transition hover:border-accent-green/60"
            >
              Reset network
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-accent-blue/20 bg-accent-blue/5 p-6">
            <Network className="h-5 w-5 text-accent-blue" aria-hidden />
            <h3 className="mt-4 font-display text-xl text-bone">Looking for active work?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The public project catalog is the application surface. A registry entry alone is not
              an open role, a validated result, or permission to use protected outcomes.
            </p>
            <Link
              to="/projects"
              className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue hover:text-bone"
            >
              Browse open projects <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <div className="rounded-sm border border-accent-green/20 bg-accent-green/5 p-6">
            <ShieldCheck className="h-5 w-5 text-accent-green" aria-hidden />
            <h3 className="mt-4 font-display text-xl text-bone">Looking for proof?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use the evidence register for verified claims and limitations. Source binding proves
              identity and location only; it does not establish scientific or production readiness.
            </p>
            <Link
              to="/evidence"
              className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-green hover:text-bone"
            >
              Inspect evidence <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </InstitutionLayout>
  );
}
