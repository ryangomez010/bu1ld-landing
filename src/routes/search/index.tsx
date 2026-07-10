import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { FilterChip } from "@/components/member/FilterChip";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { highlightMatch } from "@/components/member/ResourceNotFound";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { clearRecentSearches, getRecentSearches, pushRecentSearch } from "@/lib/recent-search";
import { getTrendingBrowse } from "@/lib/personalization";
import { buildSearchIndex, searchIndex } from "@/lib/search";
import type { SearchResult } from "@/lib/types";

export const Route = createFileRoute("/search/")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
});

function SearchPage() {
  return (
    <RequireMember>
      <SearchContent />
    </RequireMember>
  );
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  event: "Event",
  paper: "Paper",
  project: "Project",
  job: "Job",
  guide: "Guide",
  newsletter: "Newsletter",
};

function SearchContent() {
  const navigate = useNavigate();
  const { q: initialQ } = Route.useSearch();
  const [query, setQuery] = useState(initialQ);
  const debouncedQuery = useDebouncedValue(query);
  const [typeFilter, setTypeFilter] = useState<SearchResult["type"] | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<Awaited<ReturnType<typeof getTrendingBrowse>>>([]);

  useEffect(() => {
    void buildSearchIndex().then((items) => {
      setIndex(items);
      setLoading(false);
    });
    void getTrendingBrowse().then(setTrending);
    setRecent(getRecentSearches());
  }, []);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    void navigate({ to: "/search", search: { q: debouncedQuery }, replace: true });
    if (debouncedQuery.trim()) {
      pushRecentSearch(debouncedQuery);
      setRecent(getRecentSearches());
    }
  }, [debouncedQuery, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    let matched =
      debouncedQuery.trim() === ""
        ? typeFilter === "all" && !tagFilter
          ? []
          : index
        : searchIndex(index, debouncedQuery);
    if (typeFilter !== "all") matched = matched.filter((r) => r.type === typeFilter);
    if (tagFilter)
      matched = matched.filter((r) =>
        r.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()),
      );
    return matched;
  }, [index, debouncedQuery, typeFilter, tagFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<SearchResult["type"], number> = {
      event: 0,
      paper: 0,
      project: 0,
      job: 0,
      guide: 0,
      newsletter: 0,
    };
    for (const item of index) counts[item.type] += 1;
    return counts;
  }, [index]);

  const popularTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const item of index) {
      for (const t of item.tags) {
        const key = t.toLowerCase();
        freq.set(key, (freq.get(key) ?? 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [index]);

  const onQueryChange = (value: string) => {
    setQuery(value);
  };

  return (
    <MemberLayout title="Search" eyebrow="find anything">
      <div className="relative max-w-xl mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          id="search-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Guides, papers, projects, events, jobs…"
          className="pl-10 font-mono text-sm bg-background/50"
          autoFocus
        />
      </div>
      <p className="mb-6 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
        Press <kbd className="kbd">/</kbd> to focus search
      </p>

      {!loading && recent.length > 0 && !query.trim() ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Recent
          </span>
          {recent.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onQueryChange(r)}
              className="font-mono text-[9px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-sm border border-border/60 text-muted-foreground hover:text-bone"
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              clearRecentSearches();
              setRecent([]);
            }}
            className="font-mono text-[9px] uppercase text-accent-red hover:text-bone"
          >
            Clear
          </button>
        </div>
      ) : null}

      {!loading ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(TYPE_LABELS) as Array<SearchResult["type"]>).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={typeFilter === key}
              onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
              className={`panel panel-interactive p-3 text-left rounded-sm ${
                typeFilter === key ? "ring-1 ring-accent-blue/40 border-accent-blue/30" : ""
              }`}
            >
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {TYPE_LABELS[key]}
              </p>
              <p className="mt-1 font-display text-xl text-bone">{typeCounts[key]}</p>
            </button>
          ))}
        </div>
      ) : null}

      {!loading && popularTags.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip active={!tagFilter} onClick={() => setTagFilter(null)}>
            All tags
          </FilterChip>
          {popularTags.map((t) => (
            <FilterChip
              key={t}
              active={tagFilter === t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className="text-[9px] tracking-[0.12em] px-2.5 py-1"
            >
              {t}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : query.trim() === "" && typeFilter === "all" && !tagFilter ? (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            Search across guides, paper reviews, open projects, events, jobs, and newsletter issues.
            Click a type or tag above to browse.
          </p>

          {trending.length > 0 ? (
            <section>
              <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green mb-4">
                Trending now
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {trending.map((r) => (
                  <Link
                    key={`trend-${r.type}-${r.slug}`}
                    to={r.href}
                    className="panel panel-interactive p-4 rounded-sm block"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue">
                        {TYPE_LABELS[r.type as SearchResult["type"]] ?? r.type}
                      </span>
                      {r.badge ? (
                        <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-accent-green">
                          {r.badge}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-display text-base text-bone mt-1">{r.title}</h3>
                    {r.summary ? (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Popular tags
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {popularTags.slice(0, 6).map((t) => {
                const count = index.filter((i) =>
                  i.tags.some((tag) => tag.toLowerCase() === t),
                ).length;
                const sample = index.find((i) => i.tags.some((tag) => tag.toLowerCase() === t));
                return sample ? (
                  <Link
                    key={`tag-${t}`}
                    to={sample.href}
                    className="panel panel-interactive p-4 rounded-sm block"
                    onClick={() => setTagFilter(t)}
                  >
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-green">
                      {t} · {count} items
                    </span>
                    <h3 className="font-display text-base text-bone mt-1">{sample.title}</h3>
                  </Link>
                ) : null;
              })}
            </div>
          </section>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No matches"
          body={`No results for “${query}”. Try broader terms like “world models” or “PyTorch”.`}
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.slug}`}
              to={r.href}
              className="panel panel-interactive p-5 rounded-sm block hover:-translate-y-px"
            >
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-blue">
                {TYPE_LABELS[r.type]}
              </span>
              <h3 className="font-display text-lg text-bone mt-2">
                {highlightMatch(r.title, query)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {highlightMatch(r.summary, query)}
              </p>
              {r.tags.length > 0 ? (
                <p className="mt-2 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                  {r.tags.slice(0, 4).join(" · ")}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
