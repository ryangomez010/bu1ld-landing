import { pageHead } from "@/lib/seo";
import glossary from "@/content/guides/curriculum-glossary.json";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { GuideLayout } from "./-layout";
import { CURRICULUM_PATHS, CURRICULUM_LESSON_COUNT } from "@/content/guides/curriculum";
import { ContentCard, EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllGuides } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { guideLink } from "@/lib/app-paths";
import {
  DEFAULT_GUIDE_FILTERS,
  filterGuides,
  guideFiltersFromSearch,
  guideLearningPaths,
  GUIDE_PAGE_SIZE,
  parseGuideSearch,
  type GuideFilters,
} from "@/lib/guide-catalog";
import { ANONYMOUS_READER, loadPublicGuideProgress } from "@/lib/guide-catalog-progress";
import type { ProgressSource } from "@/lib/reading-progress-store";

export const Route = createFileRoute("/guides/")({
  component: GuidesPage,
  validateSearch: (search: Record<string, unknown>) => parseGuideSearch(search, getAllGuides()),
  head: () =>
    pageHead({
      title: "ML learning library — The BU1LD",
      description:
        "Read public ML lessons, follow twelve research learning tracks, and run CPU exercises with worked answers and original sources.",
      path: "/guides",
    }),
});

const guides = getAllGuides();
const tracks = Array.from(new Set(guides.map((guide) => guide.track).filter(Boolean)));
const articleCount = guides.filter((guide) => guide.level).length;

function GuidesPage() {
  return <GuidesContent />;
}

function GuidesContent() {
  const { user } = useAuth();
  const readerId = user?.id ?? ANONYMOUS_READER;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [progressState, setProgressState] = useState<{
    userId: string;
    values: Record<string, number>;
    source: ProgressSource;
  } | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [retry, setRetry] = useState(0);
  const filters = guideFiltersFromSearch(search);
  const visibleCount = search.limit ?? GUIDE_PAGE_SIZE;
  const progress = progressState?.userId === readerId ? (progressState?.values ?? {}) : {};
  const progressReady = Boolean(
    progressState?.userId === readerId && progressState.source !== "unavailable",
  );

  useEffect(() => {
    let active = true;
    setProgressError(false);
    {
      void loadPublicGuideProgress(readerId)
        .then((snapshot) => {
          if (active) setProgressState({ userId: readerId, ...snapshot });
        })
        .catch(() => {
          if (active) setProgressError(true);
        });
    }
    return () => {
      active = false;
    };
  }, [readerId, retry]);

  function updateFilters(patch: Partial<GuideFilters>) {
    const next = { ...filters, ...patch };
    void navigate({
      search: parseGuideSearch(
        { q: next.query, track: next.track, level: next.level, progress: next.progress },
        guides,
      ),
      replace: false,
      resetScroll: false,
    });
  }

  const filtered = filterGuides(
    guides,
    { ...filters, progress: progressReady ? filters.progress : "all" },
    progress,
  );
  const learningPaths = guideLearningPaths(guides, progress);
  const done = guides.filter((guide) => (progress[guide.slug] ?? 0) >= 95).length;
  const continuing = guides.filter((guide) => {
    const percent = progress[guide.slug] ?? 0;
    return percent > 0 && percent < 95;
  }).length;
  const hasFilters = Object.keys(DEFAULT_GUIDE_FILTERS).some(
    (key) =>
      filters[key as keyof GuideFilters] !== DEFAULT_GUIDE_FILTERS[key as keyof GuideFilters],
  );

  return (
    <GuideLayout title="ML articles & guides" eyebrow="learn / apply / investigate">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        {articleCount} focused articles, from your first model to scientific ML, plus{" "}
        {guides.length - articleCount} reference essays. Learn a concept, work through an example,
        and try it yourself. Your reading progress helps you pick up where you left off.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/40 bg-border/40 sm:grid-cols-4">
        <GuideStat label="In the library" value={guides.length} />
        <GuideStat label="Finished" value={progressReady ? done : "—"} />
        <GuideStat label="In progress" value={progressReady ? continuing : "—"} />
        <GuideStat
          label="Not started"
          value={progressReady ? guides.length - done - continuing : "—"}
        />
      </div>

      <div className="mb-8 rounded-xl border border-accent-blue/25 bg-accent-blue/5 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-display text-lg text-bone">New to machine learning?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with the problem, then build your way through data, models, and evaluation.
          </p>
        </div>
        <Link
          {...guideLink("ml-problem-framing")}
          className="mt-4 inline-flex shrink-0 items-center min-h-11 text-sm font-medium text-accent-blue hover:underline sm:mt-0"
        >
          Start with the foundations →
        </Link>
      </div>

      <section
        id="curriculum"
        className="mb-8 scroll-mt-24 rounded-xl border border-accent-blue/30 p-5"
      >
        <h2 className="font-display text-2xl text-bone">A 12-track research curriculum</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {CURRICULUM_LESSON_COUNT} structured lessons with prerequisites, worked examples, checked
          exercises, and understanding checks. Each track includes a downloadable CPU exercise.
          Completion records reading progress; it is not a qualification or accreditation.
        </p>
        <a
          href="/learning/README.txt"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-accent-blue underline"
        >
          Environment, provenance, and run instructions
        </a>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {CURRICULUM_PATHS.map((path) => (
            <details key={path.id} className="rounded-lg border border-border/60 p-4">
              <summary className="cursor-pointer font-display text-lg text-bone">
                {path.title}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {path.description}
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {path.lessons.map((slug) => (
                  <li key={slug}>
                    <Link {...guideLink(slug)} className="text-sm text-accent-blue underline">
                      {guides.find((guide) => guide.slug === slug)?.title}
                    </Link>
                    {(progress[slug] ?? 0) >= 95 ? (
                      <span className="ml-2 text-xs text-accent-green">Read</span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <a
                  href={`/learning/${path.exercise}`}
                  download
                  className="text-accent-blue underline"
                >
                  Download CPU exercise
                </a>
                <Link
                  to="/research-atlas"
                  search={{ q: path.projectQuery }}
                  className="text-accent-blue underline"
                >
                  Related research
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>
      <details
        id="learning-paths"
        className="scroll-mt-24 mb-8 rounded-xl border border-border/50 bg-card/20 p-5"
      >
        <summary className="cursor-pointer font-display text-lg text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Explore {learningPaths.length} learning paths
        </summary>
        <p className="mt-3 text-sm text-muted-foreground">
          Follow each topic in order, or jump to the next article you have not finished.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {learningPaths.map((path) => (
            <section key={path.topic} className="rounded-lg border border-border/50 p-4">
              <h2 className="font-display text-lg text-bone">{path.topic}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {path.articles.length} articles · {path.readMinutes} min reading
                {progressReady ? ` · ${path.completed} finished` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                {path.next ? (
                  <Link
                    {...guideLink(path.next.slug)}
                    search={{ track: path.topic }}
                    className="inline-flex min-h-10 items-center text-sm text-accent-blue hover:underline"
                  >
                    {path.completed > 0 ? "Continue path" : "Start path"}
                    <span className="sr-only">: {path.topic}</span> →
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center text-sm text-accent-green">
                    Path finished
                  </span>
                )}
                <Link
                  to="/guides"
                  search={{ track: path.topic }}
                  hash="guide-query"
                  className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-bone"
                >
                  Browse topic<span className="sr-only">: {path.topic}</span>
                </Link>
              </div>
            </section>
          ))}
        </div>
      </details>

      <details id="glossary" className="mb-8 scroll-mt-24 rounded-xl border border-border/50 p-5">
        <summary className="cursor-pointer font-display text-lg text-bone">ML glossary</summary>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.entries(glossary).map(([term, definition]) => (
            <div key={term}>
              <dt className="font-medium text-bone">{term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{definition}</dd>
            </div>
          ))}
        </dl>
      </details>
      <form
        key={JSON.stringify(search)}
        action="/guides"
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          updateFilters({
            query: String(values.get("q") ?? ""),
            track: String(values.get("track") ?? ""),
            level: String(values.get("level") ?? ""),
          });
        }}
        role="search"
        aria-label="Find articles and guides"
        className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div>
          <label htmlFor="guide-query" className="mb-2 block text-sm text-bone">
            Search the library
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
            />
            <Input
              id="guide-query"
              name="q"
              type="search"
              defaultValue={filters.query}
              placeholder="Try gradient descent, RAG, or evaluation"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label htmlFor="guide-track" className="mb-2 block text-sm text-bone">
            Topic
          </label>
          <select
            id="guide-track"
            name="track"
            defaultValue={filters.track}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All topics</option>
            {tracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="guide-level" className="mb-2 block text-sm text-bone">
            Level
          </label>
          <select
            id="guide-level"
            name="level"
            defaultValue={filters.level}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All levels</option>
            {["Beginner", "Intermediate", "Advanced"].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name="progress" value={filters.progress} />
        <div className="flex items-center gap-4">
          <Button type="submit" variant="outline">
            Apply filters
          </Button>
          <a href="/guides" className="text-sm text-accent-blue underline">
            Clear filters
          </a>
        </div>
      </form>
      <noscript>
        <p className="mb-4 text-sm text-muted-foreground">
          Lessons, search, topic filters, and pagination work without JavaScript. Saving and
          resuming reading progress requires JavaScript and browser storage.
        </p>
      </noscript>

      <fieldset disabled={!progressReady} className="mb-4">
        <legend className="mb-2 text-sm text-bone">Reading progress</legend>
        <FilterBar
          value={filters.progress}
          onChange={(value) => updateFilters({ progress: value })}
          options={[
            { value: "all", label: "All" },
            { value: "continue", label: "Continue", count: continuing },
            { value: "not_started", label: "Not started" },
            { value: "done", label: "Finished", count: done },
          ]}
        />
      </fieldset>
      {progressError || progressState?.source === "unavailable" ? (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Reading progress is unavailable right now. You can still browse every article.
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="ml-2 text-accent-blue underline"
          >
            Retry
          </button>
        </p>
      ) : progressReady && progressState?.source === "local" ? (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          {user
            ? "Showing progress available on this device. Account sync is pending."
            : "Progress is saved only in this browser. Clearing browser storage removes it."}
        </p>
      ) : !progressReady ? (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Reading progress loads in this browser.
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}{" "}
          {filtered.length === 1 ? "result" : "results"}
        </p>
        {hasFilters ? (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/guides" search={{}}>
              Clear filters
            </Link>
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No articles match"
          body="Try a broader search, another topic, or clear your filters."
          action={
            <Button variant="outline" asChild>
              <Link to="/guides" search={{}}>
                Reset filters
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, visibleCount).map((guide) => {
            const percent = progress[guide.slug] ?? 0;
            return (
              <ContentCard
                key={guide.slug}
                {...guideLink(guide.slug)}
                search={search}
                tag={guide.track}
                title={guide.title}
                summary={guide.description}
                meta={`${guide.level ? `${guide.level} · ` : ""}${guide.readMinutes} min${progressReady ? ` · ${percent >= 95 ? "finished" : percent > 0 ? `${Math.round(percent)}% read` : "not started"}` : ""}`}
              >
                <TagList tags={guide.tags} className="mt-4" />
                {percent > 0 ? (
                  <div aria-hidden className="mt-4 h-1 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full bg-accent-blue"
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>
                ) : null}
              </ContentCard>
            );
          })}
        </div>
      )}
      {visibleCount < filtered.length ? (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" asChild>
            <Link
              to="/guides"
              search={{ ...search, limit: Math.min(guides.length, visibleCount + GUIDE_PAGE_SIZE) }}
              resetScroll={false}
            >
              Show {Math.min(GUIDE_PAGE_SIZE, filtered.length - visibleCount)} more articles
            </Link>
          </Button>
        </div>
      ) : null}
    </GuideLayout>
  );
}

function GuideStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-background/75 p-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}
