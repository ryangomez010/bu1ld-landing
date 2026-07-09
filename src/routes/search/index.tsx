import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Input } from "@/components/ui/input";
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
    <RequireAuth>
      <SearchContent />
    </RequireAuth>
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
  const [typeFilter, setTypeFilter] = useState<SearchResult["type"] | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void buildSearchIndex().then((items) => {
      setIndex(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  const results = useMemo(() => {
    let matched =
      query.trim() === ""
        ? typeFilter === "all" && !tagFilter
          ? []
          : index
        : searchIndex(index, query);
    if (typeFilter !== "all") matched = matched.filter((r) => r.type === typeFilter);
    if (tagFilter) matched = matched.filter((r) => r.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
    return matched;
  }, [index, query, typeFilter, tagFilter]);

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
    void navigate({ to: "/search", search: { q: value }, replace: true });
  };

  return (
    <MemberLayout title="Search" eyebrow="find anything">
      <div className="relative max-w-xl mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Guides, papers, projects, events, jobs…"
          className="pl-10 font-mono text-sm"
          autoFocus
        />
      </div>

      {!loading ? (
        <div className="mb-4 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(TYPE_LABELS) as Array<SearchResult["type"]>).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={typeFilter === key}
              onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
              className={`bg-background/70 p-3 text-left transition hover:bg-bone/5 ${
                typeFilter === key ? "ring-1 ring-inset ring-accent-blue/40" : ""
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
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            aria-pressed={!tagFilter}
            className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm border transition ${
              !tagFilter
                ? "border-accent-green/40 text-accent-green"
                : "border-border/60 text-muted-foreground hover:text-bone"
            }`}
          >
            All tags
          </button>
          {popularTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              aria-pressed={tagFilter === t}
              className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm border transition ${
                tagFilter === t
                  ? "border-accent-green/40 text-accent-green"
                  : "border-border/60 text-muted-foreground hover:text-bone"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Indexing…
        </p>
      ) : query.trim() === "" && typeFilter === "all" && !tagFilter ? (
        <p className="text-sm text-muted-foreground">
          Search across guides, paper reviews, open projects, events, jobs, and newsletter issues.
          Click a type or tag above to browse.
        </p>
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
              className="bg-background/75 p-5 hover:bg-bone/5 transition block"
            >
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-blue">
                {TYPE_LABELS[r.type]}
              </span>
              <h3 className="font-display text-lg text-bone mt-2">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
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
