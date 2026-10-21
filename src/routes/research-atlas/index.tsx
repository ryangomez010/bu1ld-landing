import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Download, Filter, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import {
  getResearchAtlasCounts,
  getResearchBrief,
  PUBLIC_RESEARCH_PORTFOLIO,
} from "@/data/research-portfolio";
import {
  parseAtlasSearch,
  PUBLIC_SEARCH_MAX_LENGTH,
  shouldFocusPublicSearch,
  type AtlasFilter,
} from "@/lib/public-discovery";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research-atlas/")({
  component: ResearchAtlasPage,
  validateSearch: parseAtlasSearch,
  head: () =>
    pageHead({
      title: "Research Atlas — The BU1LD",
      description:
        "The complete evidence-bounded map of BU1LD research lines, including active studies, retained reports, negative results, prototypes, and scoped foundries.",
      path: "/research-atlas",
    }),
});

const FILTERS: Array<{ value: AtlasFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "report", label: "Reports" },
  { value: "study", label: "Studies" },
  { value: "idea", label: "Directions & foundries" },
  { value: "experiment", label: "Prototypes & experiments" },
  { value: "review", label: "Retained evidence" },
  { value: "scoping", label: "Scoped" },
];

const RESEARCH_PATHS = [
  {
    query: "memory",
    title: "Memory and sequence systems",
    description: "Mechanisms, interventions, retrieval, and long-horizon failure analysis.",
  },
  {
    query: "JEPA",
    title: "Predictive representation learning",
    description: "Joint-embedding work across finance, education, weather, and world models.",
  },
  {
    query: "Scientific ML",
    title: "Scientific machine learning",
    description: "Fluid dynamics, PDE surrogates, geometry, and falsification-led studies.",
  },
  {
    query: "Foundry",
    title: "Research foundries",
    description: "Screening systems that separate executable studies from idea inventories.",
  },
] as const;

function ResearchAtlasPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { filter: searchFilter, q: searchQuery } = search;
  const filter = searchFilter ?? "all";
  const query = searchQuery ?? "";

  const updateSearch = useCallback(
    (next: { filter?: AtlasFilter; q?: string }) => {
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
        document.getElementById("atlas-search")?.focus();
      }
      if (
        !event.isComposing &&
        event.key === "Escape" &&
        document.activeElement?.id === "atlas-search"
      ) {
        updateSearch({ q: "" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [updateSearch]);

  const normalizedQuery = query.trim().toLowerCase();
  const projects = useMemo(
    () =>
      PUBLIC_RESEARCH_PORTFOLIO.filter((project) => {
        const filterMatch = filter === "all" || project.kind === filter || project.stage === filter;
        if (!filterMatch) return false;
        if (!normalizedQuery) return true;
        return [
          project.title,
          project.summary,
          project.publicStatus,
          project.evidenceBoundary,
          ...(getResearchBrief(project.slug)?.aliases ?? []),
          ...project.tags,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      }),
    [filter, normalizedQuery],
  );

  const reportCount = PUBLIC_RESEARCH_PORTFOLIO.filter(
    (project) => project.kind === "report",
  ).length;
  const experimentCount = PUBLIC_RESEARCH_PORTFOLIO.filter(
    (project) => project.stage === "experiment",
  ).length;
  const repositoryCount = PUBLIC_RESEARCH_PORTFOLIO.filter(
    (project) => project.repositoryUrl,
  ).length;
  const hasActiveFilters = filter !== "all" || normalizedQuery.length > 0;
  const counts = getResearchAtlasCounts();

  const filterCount = (value: AtlasFilter) =>
    value === "all"
      ? PUBLIC_RESEARCH_PORTFOLIO.length
      : PUBLIC_RESEARCH_PORTFOLIO.filter(
          (project) => project.kind === value || project.stage === value,
        ).length;

  return (
    <InstitutionLayout
      eyebrow="Complete public research portfolio"
      title="Every research line. Including the ones that failed."
      description={`${PUBLIC_RESEARCH_PORTFOLIO.length} public research records: studies, retained results, scoped directions, and foundry collections. Every record has a permanent page. These are not counts of published papers, active researchers, or independently evaluated projects.`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AtlasStat label="Public research records" value={PUBLIC_RESEARCH_PORTFOLIO.length} />
        <AtlasStat label="Retained reports" value={reportCount} accent="green" />
        <AtlasStat label="Prototypes / experiments" value={experimentCount} accent="blue" />
        <AtlasStat label="Verified source links" value={repositoryCount} />
      </div>
      <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">
        Catalog accounting: {counts.projects} canonical project records, {counts.subprojects} linked
        subproject, {counts.collections} collections, and {counts.unresolvedDirections} unresolved
        direction. These categories add to {counts.records} pages; they do not imply scientific
        validation, active recruitment, or publication.
      </p>

      <section className="mt-14" aria-labelledby="atlas-heading">
        <div className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent-blue">
              Evidence-labelled atlas
            </p>
            <h2 id="atlas-heading" className="mt-2 font-display text-3xl text-bone">
              Browse the whole portfolio
            </h2>
          </div>
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search the research atlas</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="atlas-search"
              type="search"
              maxLength={PUBLIC_SEARCH_MAX_LENGTH}
              value={query}
              onChange={(event) => updateSearch({ q: event.target.value })}
              placeholder="Search titles, fields, outcomes…"
              className="w-full rounded-sm border border-border bg-background/70 py-3 pl-11 pr-4 text-sm text-bone outline-none transition placeholder:text-muted-foreground focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/30"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground sm:block">
              /
            </span>
          </label>
        </div>

        <div
          className="mt-5 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter research atlas"
        >
          <Filter className="mr-1 h-4 w-4 text-muted-foreground" aria-hidden />
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateSearch({ filter: option.value })}
              aria-pressed={filter === option.value}
              className={cn(
                "min-h-11 rounded-full border px-3 py-2 font-mono text-xs uppercase tracking-[0.15em] transition",
                filter === option.value
                  ? "border-accent-blue/60 bg-accent-blue/10 text-bone"
                  : "border-border text-muted-foreground hover:border-bone/30 hover:text-bone",
              )}
            >
              {option.label} {filterCount(option.value)}
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
          Showing {projects.length} of {PUBLIC_RESEARCH_PORTFOLIO.length} research lines
        </p>

        {projects.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.slug}
                className="panel group flex min-h-80 flex-col rounded-sm p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                    {project.kind} · {project.stage}
                  </span>
                  {project.featured ? (
                    <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-accent-blue">
                      Featured
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-5 font-display text-2xl text-bone">{project.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {project.summary}
                </p>
                <p className="mt-5 border-l border-accent-green/40 pl-3 text-xs leading-relaxed text-bone/70">
                  {project.publicStatus}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-1 font-mono text-[8px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to="/research-atlas/$slug"
                  params={{ slug: project.slug }}
                  search={search}
                  className="mt-auto inline-flex items-center gap-2 pt-7 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue transition hover:text-bone"
                >
                  Open research page
                  <ArrowRight
                    className="h-3.5 w-3.5 transition group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-sm border border-border bg-bone/5 p-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="mt-4 text-sm text-muted-foreground">
              No research line matches this search and filter combination.
            </p>
            <button
              type="button"
              onClick={() => updateSearch({ filter: "all", q: "" })}
              className="mt-5 min-h-11 rounded-sm border border-bone/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-bone transition hover:border-accent-blue/60"
            >
              Reset atlas
            </button>
          </div>
        )}
      </section>

      <section className="mt-16" aria-labelledby="paths-heading">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent-green">
          Guided discovery
        </p>
        <h2 id="paths-heading" className="mt-2 font-display text-3xl text-bone">
          Follow a research path
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          These paths filter the same {PUBLIC_RESEARCH_PORTFOLIO.length} records. A study appears
          once in the catalog even when it belongs to several paths. Foundries and unresolved
          directions are identified separately from evaluated studies.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {RESEARCH_PATHS.map((path) => {
            const count = PUBLIC_RESEARCH_PORTFOLIO.filter((project) =>
              [project.title, project.summary, ...project.tags].some((value) =>
                value.toLowerCase().includes(path.query.toLowerCase()),
              ),
            ).length;
            return (
              <Link
                key={path.query}
                to="/research-atlas"
                search={{ q: path.query }}
                className="group rounded-sm border border-border p-5 transition hover:border-accent-green/50 hover:bg-accent-green/5"
              >
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-accent-green">
                  {count} research {count === 1 ? "line" : "lines"}
                </span>
                <h3 className="mt-2 font-display text-xl text-bone">{path.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {path.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-accent-green group-hover:text-bone">
                  Explore path <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-accent-red/20 bg-accent-red/5 p-6">
          <ShieldCheck className="h-5 w-5 text-accent-red" aria-hidden />
          <h2 className="mt-4 font-display text-2xl text-bone">Negative evidence stays visible</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Null, negative, mixed, synthetic-only, and incomplete outcomes remain part of the public
            record. A working implementation is never silently upgraded into scientific success.
          </p>
        </div>
        <div className="rounded-sm border border-accent-blue/20 bg-accent-blue/5 p-6">
          <BookOpen className="h-5 w-5 text-accent-blue" aria-hidden />
          <h2 className="mt-4 font-display text-2xl text-bone">Need the product and source map?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The portfolio network separately tracks products, archives, recovered repositories, and
            unresolved source identities. The two maps connect where identity evidence supports it.
          </p>
          <Link
            to="/network"
            className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue hover:text-bone"
          >
            Open portfolio network <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <a
            href="/portfolio-manifest.json"
            download
            className="ml-5 mt-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-green hover:text-bone max-sm:ml-0"
          >
            Download public JSON <Download className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </section>
    </InstitutionLayout>
  );
}

function AtlasStat({
  label,
  value,
  accent = "bone",
}: {
  label: string;
  value: number;
  accent?: "bone" | "blue" | "green";
}) {
  return (
    <div className="panel rounded-sm p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl",
          accent === "blue"
            ? "text-accent-blue"
            : accent === "green"
              ? "text-accent-green"
              : "text-bone",
        )}
      >
        {value}
      </p>
    </div>
  );
}
