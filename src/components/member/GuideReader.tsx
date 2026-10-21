import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { GuideSectionView } from "@/components/member/GuideSectionView";
import { guideHeadingId } from "@/lib/guide-heading";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { Button } from "@/components/ui/button";
import { getAllGuides } from "@/content/guides";
import { guideLink } from "@/lib/app-paths";
import {
  ANONYMOUS_READER,
  getLocalGuideProgress as getLocalProgress,
  persistPublicGuideProgress as persistReadingProgress,
  setLocalGuideProgress as setLocalProgress,
} from "@/lib/guide-catalog-progress";
import { curriculumPath } from "@/content/guides/curriculum";
import type { GuideSearch } from "@/lib/guide-catalog";
import {
  readingViewportPercent,
  sourceAfterProgressLoad,
  type ProgressSource,
} from "@/lib/reading-progress-store";
import type { Guide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/urls";
import { createLessonCompletionAnalytics } from "@/lib/learning-analytics";

export function GuideReader({
  guide,
  userId,
  initialProgress = 0,
  initialSource = "local",
  librarySearch = {},
}: {
  guide: Guide;
  userId: string;
  initialProgress?: number;
  initialSource?: ProgressSource | "loading";
  librarySearch?: GuideSearch;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<ProgressSource | "saving" | "loading">(initialSource);
  const controlsReady = hydrated && initialSource !== "loading";
  const bodyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(initialProgress);
  const persistedRef = useRef(initialProgress);
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completionAnalytics = useRef(createLessonCompletionAnalytics());

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (initialSource === "loading") return;
    completionAnalytics.current.restore(initialProgress);
    const currentPercent = progressRef.current;
    const localPercent = getLocalProgress(userId, guide.slug);
    progressRef.current = Math.max(currentPercent, initialProgress);
    persistedRef.current = Math.max(persistedRef.current, initialProgress);
    setProgress(progressRef.current);
    setSaveState((current) =>
      sourceAfterProgressLoad(
        current,
        currentPercent,
        { percent: initialProgress, source: initialSource },
        localPercent,
      ),
    );
  }, [initialProgress, initialSource, userId, guide.slug]);

  const persist = useCallback(
    async (percent: number, notify = false) => {
      if (activeRef.current) setSaveState("saving");
      try {
        const result = await persistReadingProgress(userId, guide.slug, percent);
        completionAnalytics.current.persisted(percent, result);
        persistedRef.current = Math.max(persistedRef.current, result.percent);
        if (!activeRef.current) return;
        progressRef.current = Math.max(progressRef.current, result.percent);
        setProgress(progressRef.current);
        setSaveState(
          result.percent >= progressRef.current
            ? result.source
            : getLocalProgress(userId, guide.slug) >= progressRef.current
              ? "local"
              : "saving",
        );
        if (notify) {
          if (result.source === "synced") toast.success("Article marked complete and synced.");
          else if (result.source === "local")
            toast.info(
              userId === ANONYMOUS_READER
                ? "Marked complete in this browser."
                : "Marked complete on this device. Account sync is pending.",
            );
          else toast.error("Progress could not be saved. Try again.");
        }
      } catch {
        if (activeRef.current) setSaveState("unavailable");
      }
    },
    [guide.slug, userId],
  );

  useEffect(() => {
    activeRef.current = true;
    const flush = () => {
      clearTimeout(timerRef.current);
      if (progressRef.current > persistedRef.current) void persist(progressRef.current);
    };
    const onScroll = () => {
      const rect = bodyRef.current?.getBoundingClientRect();
      if (!rect) return;
      const percent = readingViewportPercent(rect.top, rect.height, window.innerHeight);
      if (percent <= progressRef.current) return;
      progressRef.current = percent;
      setProgress(percent);
      setSaveState(setLocalProgress(userId, guide.slug, percent) ? "local" : "saving");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void persist(progressRef.current);
      }, 500);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    // Do not award completion on mount because a previous page was scrolled down.
    return () => {
      activeRef.current = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [guide.slug, userId, persist]);

  function markComplete() {
    completionAnalytics.current.intendCompletion();
    clearTimeout(timerRef.current);
    progressRef.current = 100;
    setProgress(100);
    setLocalProgress(userId, guide.slug, 100);
    void persist(100, true);
  }

  function resumeReading() {
    const rect = bodyRef.current?.getBoundingClientRect();
    if (rect)
      window.scrollTo({
        top: Math.max(
          0,
          window.scrollY +
            rect.top +
            (rect.height * initialProgress) / 100 -
            window.innerHeight * 0.65,
        ),
        behavior: "auto",
      });
  }

  const curriculum = curriculumPath(guide.slug);
  const all = getAllGuides().filter((item) =>
    guide.track ? item.track === guide.track : item.track === "Reference essays",
  );
  const idx = all.findIndex((g) => g.slug === guide.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const toc = guide.sections.flatMap((section, index) =>
    section.type === "h2" ? [{ text: section.text, id: guideHeadingId(section.text, index) }] : [],
  );

  return (
    <>
      <div className="fixed top-[2px] left-0 right-0 z-[70] h-px bg-border/60">
        <div
          className="h-full bg-bone/80 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="max-w-2xl pb-24">
        <header className="border-l-2 border-bone/25 pl-6 md:pl-8">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            {guide.readMinutes} min read · {guide.level ?? "Reference essay"}
          </p>
          {guide.track ? <p className="mt-2 text-sm text-accent-blue">{guide.track}</p> : null}
          <h1 className="font-display text-3xl md:text-4xl text-bone mt-4 tracking-tight leading-[1.1]">
            {guide.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SaveToCollectionButton
              itemType="guide"
              itemSlug={guide.slug}
              itemTitle={guide.title}
            />
            {initialProgress > 0 && initialProgress < 95 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resumeReading}
                disabled={!controlsReady}
              >
                Resume reading
              </Button>
            ) : null}
            <Link
              to="/guides"
              hash="learning-paths"
              search={librarySearch}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Reading paths →
            </Link>
          </div>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{guide.description}</p>
        </header>

        {toc.length > 1 ? (
          <nav
            aria-label="On this page"
            className="mt-6 rounded-sm border border-border/60 bg-background/50 p-4"
          >
            <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              On this page
            </p>
            <ul className="space-y-2">
              {toc.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground hover:text-bone transition"
                  >
                    {section.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="divider-grad my-8" />
        <div ref={bodyRef} className="prose-build space-y-4">
          {guide.sections.map((section, i) => (
            <GuideSectionView key={i} section={section} index={i} />
          ))}
        </div>
        {curriculum ? (
          <section
            aria-label="Continue this curriculum"
            className="mt-8 rounded-xl border border-accent-blue/30 p-5"
          >
            <h2 className="font-display text-xl text-bone">{curriculum.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The exercise uses synthetic fixtures, Python 3.14.7, and no third-party packages. Run
              with --smoke. These are implementation checks, not project benchmark results.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <a
                href={`/learning/${curriculum.exercise}`}
                download
                className="text-accent-blue underline"
              >
                Download exercise
              </a>
              <a href="/learning/README.txt" className="text-accent-blue underline">
                Run instructions
              </a>
              <Link
                to="/research-atlas"
                search={{ q: curriculum.projectQuery }}
                className="text-accent-blue underline"
              >
                Related research
              </Link>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              {curriculum.lessons.map((slug) => (
                <li key={slug}>
                  <Link
                    {...guideLink(slug)}
                    aria-current={slug === guide.slug ? "page" : undefined}
                    className="text-sm text-accent-blue underline"
                  >
                    {getAllGuides().find((item) => item.slug === slug)?.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {guide.references?.length ? (
          <section
            aria-labelledby="guide-references"
            className="mt-10 rounded-xl border border-border/60 bg-card/30 p-5"
          >
            <h2 id="guide-references" className="font-display text-xl text-bone">
              Further reading
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Go deeper with the original research and documentation.
            </p>
            <ul className="mt-4 space-y-3">
              {guide.references.map((reference) => {
                const href = safeHref(reference.url);
                return href ? (
                  <li key={reference.url}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent-blue underline underline-offset-4 hover:text-bone"
                    >
                      {reference.label}
                      <span className="sr-only"> (opens in a new tab)</span> ↗
                    </a>
                  </li>
                ) : null;
              })}
            </ul>
          </section>
        ) : null}
        <div
          className={cn(
            "mt-12 rounded-sm border px-5 py-4 text-center",
            progress >= 95
              ? "border-accent-green/40 bg-accent-green/5"
              : "border-border/60 text-muted-foreground",
          )}
        >
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bone">
              {progress >= 95 ? "Article complete" : `${Math.round(progress)}% read`}
            </p>
            <p role="status" className="text-sm text-muted-foreground">
              {!hydrated
                ? "Reading progress controls require JavaScript and browser storage."
                : saveState === "loading"
                  ? "Loading your reading progress…"
                  : progress === 0
                    ? "Scroll to track your reading, or mark this article complete."
                    : saveState === "saving"
                      ? "Saving progress…"
                      : saveState === "synced"
                        ? "Progress synced to your account."
                        : saveState === "local"
                          ? userId === ANONYMOUS_READER
                            ? "Progress is saved only in this browser."
                            : "Progress is saved on this device. Account sync is pending."
                          : "Progress could not be saved. Your reading is still available."}
            </p>
            <noscript>
              <p className="text-sm text-muted-foreground">
                This lesson is fully readable without JavaScript. Reading progress cannot be loaded
                or saved while JavaScript is disabled.
              </p>
            </noscript>
            <div className="flex flex-wrap justify-center gap-3">
              {progress < 95 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={markComplete}
                  disabled={!controlsReady || saveState === "saving"}
                >
                  Mark complete
                </Button>
              ) : null}
              {((saveState === "local" && userId !== ANONYMOUS_READER) ||
                saveState === "unavailable") &&
              progress > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!controlsReady}
                  onClick={() => {
                    void persist(progressRef.current);
                  }}
                >
                  {userId === ANONYMOUS_READER ? "Retry saving" : "Retry sync"}
                </Button>
              ) : null}
              <Link
                to="/guides"
                search={{ track: guide.track ?? "Reference essays" }}
                className="inline-flex min-h-10 items-center text-sm text-accent-blue hover:underline"
              >
                Browse this topic →
              </Link>
            </div>
          </div>
        </div>

        <nav
          aria-label={guide.track ? `More in ${guide.track}` : "More reference essays"}
          className="mt-10 flex flex-wrap justify-between gap-4 border-t border-border/60 pt-6"
        >
          {prev ? (
            <Link
              {...guideLink(prev.slug)}
              search={librarySearch}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone max-w-[45%]"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              {...guideLink(next.slug)}
              search={librarySearch}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone max-w-[45%] text-right"
            >
              {next.title} →
            </Link>
          ) : null}
        </nav>
      </article>
    </>
  );
}
