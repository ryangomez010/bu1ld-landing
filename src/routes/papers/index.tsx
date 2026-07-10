import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ContentCard, EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { FilterChip } from "@/components/member/FilterChip";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { fetchPapers } from "@/lib/content";
import { getReadPaperSlugs } from "@/lib/paper-read";
import type { Paper } from "@/lib/types";

export const Route = createFileRoute("/papers/")({
  component: PapersPage,
});

function PapersPage() {
  return (
    <RequireMember>
      <PapersContent />
    </RequireMember>
  );
}

function PapersContent() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "classic" | "recent" | "unread" | "read">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetchPapers().then((data) => {
      setPapers(data);
      setLoading(false);
    });
    if (user) void getReadPaperSlugs(user.id).then(setReadSlugs);
  }, [user]);

  const allTags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(),
    [papers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (filter === "classic" && !p.is_classic) return false;
      if (filter === "recent" && p.is_classic) return false;
      if (filter === "read" && !readSlugs.has(p.slug)) return false;
      if (filter === "unread" && readSlugs.has(p.slug)) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      const hay = [p.title, p.authors, p.summary, ...p.tags].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [papers, filter, tag, query, readSlugs]);

  const classics = papers.filter((p) => p.is_classic).length;
  const recent = papers.filter((p) => !p.is_classic).length;
  const readCount = papers.filter((p) => readSlugs.has(p.slug)).length;

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

      <FilterBar
        sticky
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={(
          [
            ["all", "All", papers.length],
            ["unread", "Unread", papers.length - readCount],
            ["read", "Read", readCount],
            ["classic", "Classics", classics],
            ["recent", "Interesting now", recent],
          ] as const
        ).map(([value, label, count]) => ({ value, label, count }))}
      />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search papers…"
        className="mb-4 max-w-xs font-mono text-xs"
      />

      <div className="flex flex-wrap gap-2 mb-8">
        <FilterChip active={!tag} onClick={() => setTag(null)}>
          All tags
        </FilterChip>
        {allTags.map((t) => (
          <FilterChip key={t} active={tag === t} onClick={() => setTag(t === tag ? null : t)}>
            {t}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No papers match" body="Try another filter or search term." />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {filtered.map((paper) => (
            <PaperCard key={paper.id} paper={paper} isRead={readSlugs.has(paper.slug)} />
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-cell">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}

function PaperCard({ paper, isRead }: { paper: Paper; isRead?: boolean }) {
  return (
    <ContentCard
      to={`/papers/${paper.slug}`}
      tag={isRead ? "read" : paper.is_classic ? "classic" : "review"}
      title={paper.title}
      summary={paper.summary}
      meta={[paper.authors, paper.year].filter(Boolean).join(" · ")}
    >
      <TagList tags={paper.tags} linkToSearch className="mt-4" />
    </ContentCard>
  );
}
