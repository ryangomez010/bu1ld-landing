import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ContentCard, EmptyState, TagList } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Input } from "@/components/ui/input";
import { fetchPapers } from "@/lib/content";
import type { Paper } from "@/lib/types";

export const Route = createFileRoute("/papers/")({
  component: PapersPage,
});

function PapersPage() {
  return (
    <RequireAuth>
      <PapersContent />
    </RequireAuth>
  );
}

function PapersContent() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filter, setFilter] = useState<"all" | "classic" | "recent">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetchPapers().then(setPapers);
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(),
    [papers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (filter === "classic" && !p.is_classic) return false;
      if (filter === "recent" && p.is_classic) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      const hay = [p.title, p.authors, p.summary, ...p.tags].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [papers, filter, tag, query]);

  const classics = papers.filter((p) => p.is_classic).length;
  const recent = papers.filter((p) => !p.is_classic).length;

  return (
    <MemberLayout title="Paper Reviews" eyebrow="research literacy">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Curated BUILD reviews — classics worth re-reading and threads we are actively pulling on.
        Human editorial voice, not auto-generated summaries.
      </p>

      <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <Stat label="Total reviews" value={String(papers.length)} />
        <Stat label="Classics" value={String(classics)} />
        <Stat label="Interesting now" value={String(recent)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["classic", "Classics"],
            ["recent", "Interesting now"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`font-mono text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-sm border transition ${
              filter === key
                ? "bg-accent-blue/10 text-bone border-accent-blue/30"
                : "border-border/60 text-muted-foreground hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search papers…"
          className="ml-auto max-w-xs font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setTag(null)}
          className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm border transition ${
            !tag
              ? "border-accent-green/40 text-accent-green"
              : "border-border/60 text-muted-foreground hover:text-bone"
          }`}
        >
          All tags
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t === tag ? null : t)}
            className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm border transition ${
              tag === t
                ? "border-accent-green/40 text-accent-green"
                : "border-border/60 text-muted-foreground hover:text-bone"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No papers match" body="Try another filter or search term." />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {filtered.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/75 p-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}

function PaperCard({ paper }: { paper: Paper }) {
  return (
    <ContentCard
      to={`/papers/${paper.slug}`}
      tag={paper.is_classic ? "classic" : "review"}
      title={paper.title}
      summary={paper.summary}
      meta={[paper.authors, paper.year].filter(Boolean).join(" · ")}
    >
      <TagList tags={paper.tags} linkToSearch className="mt-4" />
    </ContentCard>
  );
}
