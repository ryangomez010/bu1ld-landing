import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock } from "lucide-react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { FilterChip } from "@/components/member/FilterChip";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { fetchPapers } from "@/lib/content";
import { getAllPaperScrollProgress } from "@/lib/paper-reading-progress";
import { getReadPaperSlugs } from "@/lib/paper-read";
import { paperReadMinutes, pickFeaturedPaper, sortPapersForLibrary } from "@/lib/paper-review";
import type { Paper } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/papers/")({
  component: PapersPage,
  head: () => ({
    meta: [{ title: "Paper reviews — The Bu1ld" }],
  }),
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
  const [scrollProgress, setScrollProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "classic" | "recent" | "unread" | "read">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetchPapers().then((data) => {
      setPapers(sortPapersForLibrary(data));
      setLoading(false);
    });
    if (!user) return;
    void getReadPaperSlugs(user.id).then(setReadSlugs);
    setScrollProgress(getAllPaperScrollProgress(user.id));
  }, [user]);

  const allTags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(),
    [papers],
  );
  const featured = useMemo(() => pickFeaturedPaper(papers, readSlugs), [papers, readSlugs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (filter === "classic" && !p.is_classic) return false;
      if (filter === "recent" && p.is_classic) return false;
      if (filter === "read" && !readSlugs.has(p.slug)) return false;
      if (filter === "unread" && readSlugs.has(p.slug)) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return [p.title, p.authors, p.summary, ...p.tags].join(" ").toLowerCase().includes(q);
    });
  }, [papers, filter, tag, query, readSlugs]);

  const readCount = papers.filter((p) => readSlugs.has(p.slug)).length;
  const inProgress = papers.filter(
    (p) => !readSlugs.has(p.slug) && (scrollProgress[p.slug] ?? 0) > 5,
  ).length;

  return (
    <MemberLayout title="Paper reviews" eyebrow="research library">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 -mt-4">
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Member-written reviews on transformer classics and active research threads — each covers
          the method, reproducibility gaps, and what we would prototype next at The Bu1ld.
        </p>
        <Link
          to="/research"
          className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone shrink-0"
        >
          Reading paths →
        </Link>
      </div>

      <div className="mb-6 panel glass rounded-2xl overflow-hidden grid gap-px sm:grid-cols-4">
        <Stat label="Reviews" value={papers.length} />
        <Stat label="Read" value={readCount} />
        <Stat label="In progress" value={inProgress} />
        <Stat label="Classics" value={papers.filter((p) => p.is_classic).length} />
      </div>

      {featured && !loading ? (
        <Link
          to={`/papers/${featured.slug}`}
          className="mb-8 block panel glass rounded-2xl p-6 md:p-8 panel-interactive group relative overflow-hidden border-l-2 border-l-bone/30"
        >
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground relative z-[1]">
            Start here
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-bone mt-3 group-hover:text-accent-blue transition relative z-[1]">
            {featured.title}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl line-clamp-2">{featured.summary}</p>
          <p className="mt-4 font-mono text-[9px] uppercase text-muted-foreground flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {paperReadMinutes(featured)} min
            </span>
            <span>{featured.is_classic ? "Classic" : "Active thread"}</span>
          </p>
        </Link>
      ) : null}

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
            ["classic", "Classics", papers.filter((p) => p.is_classic).length],
            ["recent", "Active", papers.filter((p) => !p.is_classic).length],
          ] as const
        ).map(([value, label, count]) => ({ value, label, count }))}
      />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Title, author, tag — e.g. chinchilla, DPO, JEPA"
        className="mb-4 max-w-md font-mono text-xs"
      />

      <div className="flex flex-wrap gap-2 mb-8">
        <FilterChip active={!tag} onClick={() => setTag(null)}>
          All tags
        </FilterChip>
        {allTags.map((t) => (
          <FilterChip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No reviews match"
          body="Try Classic/Recent, the unread filter, or search by author name — e.g. Vaswani, LeCun, or a tag like world-models."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((paper) => (
            <PaperLibraryCard
              key={paper.id}
              paper={paper}
              isRead={readSlugs.has(paper.slug)}
              progress={scrollProgress[paper.slug] ?? 0}
            />
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-cell relative z-[1]">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}

function PaperLibraryCard({
  paper,
  isRead,
  progress,
}: {
  paper: Paper;
  isRead: boolean;
  progress: number;
}) {
  const mins = paperReadMinutes(paper);
  return (
    <Link
      to={`/papers/${paper.slug}`}
      className="panel panel-interactive group block rounded-sm p-5 h-full"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "font-mono text-[8px] uppercase px-2 py-0.5 rounded-sm border",
            paper.is_classic
              ? "border-accent-violet/40 text-accent-violet"
              : "border-accent-blue/40 text-accent-blue",
          )}
        >
          {paper.is_classic ? "classic" : "review"}
        </span>
        {isRead ? (
          <span className="font-mono text-[8px] uppercase text-accent-green">Read ✓</span>
        ) : progress > 5 ? (
          <span className="font-mono text-[8px] uppercase text-muted-foreground">
            {Math.round(progress)}%
          </span>
        ) : null}
      </div>
      <h3 className="font-display text-xl text-bone mt-3 group-hover:text-accent-blue transition line-clamp-2">
        {paper.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{paper.summary}</p>
      <p className="mt-3 font-mono text-[9px] uppercase text-muted-foreground">
        {[paper.authors, paper.year].filter(Boolean).join(" · ")} · {mins} min
      </p>
      {!isRead && progress > 0 ? (
        <div className="mt-3 h-1 rounded-full bg-border/60 overflow-hidden">
          <div className="h-full bg-accent-blue" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <TagList tags={paper.tags.slice(0, 4)} linkToSearch className="mt-4" />
      <span className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent-blue group-hover:text-bone">
        <BookOpen className="h-3 w-3" /> Read review
      </span>
    </Link>
  );
}
