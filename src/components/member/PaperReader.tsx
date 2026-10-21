import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Highlighter, List, StickyNote } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { TagList } from "@/components/member/ContentCard";
import { PaperReviewBody } from "@/components/member/PaperReviewMarkdown";
import { PaperLearningLinks } from "@/components/member/PaperLearningLinks";
import { ProgressRing } from "@/components/member/ProgressRing";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { ShareButton } from "@/components/member/ShareButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getAllGuides } from "@/content/guides";
import { guideLink, paperLink } from "@/lib/app-paths";
import {
  addPaperHighlight,
  deletePaperHighlight,
  fetchPaperHighlights,
  getSelectedHighlightText,
  type PaperHighlight,
} from "@/lib/paper-highlights";
import {
  fetchPaperNotes,
  fetchPaperScrollProgress,
  savePaperNotes,
  savePaperScrollProgress,
} from "@/lib/paper-notes";
import { isPaperRead, markPaperRead, unmarkPaperRead } from "@/lib/paper-read";
import { extractPullQuote, paperReadMinutes, parseReviewSections } from "@/lib/paper-review";
import { relatedGuidesForPaper } from "@/lib/research-paths";
import { paperLearningLinks } from "@/lib/paper-learning-links";
import type { Paper } from "@/lib/types";
import { safeHref } from "@/lib/urls";
import { cn } from "@/lib/utils";

function ReaderSidebar({
  toc,
  notes,
  onNotesChange,
  notesReady,
  relatedGuides,
  highlights,
  onSaveHighlight,
  onDeleteHighlight,
}: {
  toc: ReturnType<typeof parseReviewSections>;
  notes: string;
  onNotesChange: (value: string) => void;
  notesReady: boolean;
  relatedGuides: ReturnType<typeof relatedGuidesForPaper>;
  highlights: PaperHighlight[];
  onSaveHighlight: () => void;
  onDeleteHighlight: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {toc.length > 0 ? (
        <nav className="rounded-xl border border-border/40 panel glass p-4 relative z-[1]">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Sections
          </p>
          <ul className="space-y-2">
            {toc.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    "text-sm leading-snug block py-0.5 transition",
                    s.variant === "build"
                      ? "text-accent-green/90 hover:text-accent-green"
                      : "text-muted-foreground hover:text-bone",
                  )}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="rounded-xl border border-border/40 panel glass p-4 relative z-[1]">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Your notes
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Private — synced to your account when signed in.
        </p>
        <Textarea
          value={notes}
          disabled={!notesReady}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={6}
          placeholder="Claims to verify, reproduction ideas, questions for the thread…"
          className="text-sm resize-none bg-background/50"
        />
      </div>

      <div className="rounded-xl border border-border/40 panel glass p-4 relative z-[1]">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Highlights
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onSaveHighlight}
          className="w-full font-mono text-[8px] tracking-[0.12em] uppercase mb-3"
        >
          Save selection
        </Button>
        {highlights.length ? (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {highlights.map((h) => (
              <li
                key={h.id}
                className="text-xs text-muted-foreground border-l-2 border-accent-blue/40 pl-2"
              >
                <p className="line-clamp-3">{h.highlighted_text}</p>
                <button
                  type="button"
                  onClick={() => onDeleteHighlight(h.id)}
                  className="mt-1 font-mono text-[7px] uppercase text-accent-red hover:text-bone"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Select text in the review, then save.</p>
        )}
      </div>

      {relatedGuides.length > 0 ? (
        <div className="rounded-xl border border-border/40 panel glass p-4 relative z-[1]">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            Read first
          </p>
          <ul className="space-y-2">
            {relatedGuides.map((g) => (
              <li key={g.slug}>
                <Link
                  {...guideLink(g.slug)}
                  className="text-sm text-muted-foreground hover:text-bone transition line-clamp-2"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link
        to="/research"
        search={{ view: "paths" }}
        className="block font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
      >
        All reading paths →
      </Link>
    </div>
  );
}

export function PaperReader({
  paper,
  userId,
  prev,
  next,
  embeddedHeading = false,
}: {
  paper: Paper & { relatedLessons?: string[] };
  userId: string;
  prev: Paper | null;
  next: Paper | null;
  embeddedHeading?: boolean;
}) {
  const Title = embeddedHeading ? "h2" : "h1";
  const sections = useMemo(() => parseReviewSections(paper.review_body), [paper.review_body]);
  const readMinutes = paperReadMinutes(paper);
  const pullQuote = extractPullQuote(paper.summary, sections);
  const toc = sections.filter((s) => s.id !== "overview");
  const relatedGuides = useMemo(
    () =>
      paper.relatedLessons?.length
        ? paperLearningLinks(paper.relatedLessons)
        : relatedGuidesForPaper(paper, getAllGuides()),
    [paper],
  );

  const [scrollProgress, setScrollProgress] = useState(0);
  const [markedRead, setMarkedRead] = useState(false);
  const [notes, setNotes] = useState("");
  const [engagementReady, setEngagementReady] = useState(false);
  const [engagementError, setEngagementError] = useState(false);
  const notesEdited = useRef(false);
  const [highlights, setHighlights] = useState<PaperHighlight[]>([]);
  const progressSaveRef = useRef(0);

  useEffect(() => {
    let active = true;
    setEngagementReady(false);
    setEngagementError(false);
    notesEdited.current = false;
    void Promise.all([
      isPaperRead(userId, paper.slug),
      fetchPaperScrollProgress(userId, paper.slug),
      fetchPaperNotes(userId, paper.slug),
      fetchPaperHighlights(userId, paper.slug),
    ])
      .then(([read, progress, savedNotes, savedHighlights]) => {
        if (!active) return;
        setMarkedRead(read);
        setScrollProgress(progress);
        setNotes(savedNotes);
        setHighlights(savedHighlights);
        setEngagementReady(true);
      })
      .catch(() => {
        if (active) setEngagementError(true);
      });
    return () => {
      active = false;
    };
  }, [userId, paper.slug]);

  useEffect(() => {
    if (!engagementReady) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 100;
      setScrollProgress(pct);
      const rounded = Math.round(pct);
      if (rounded !== progressSaveRef.current) {
        progressSaveRef.current = rounded;
        void savePaperScrollProgress(userId, paper.slug, pct);
      }
      if (pct >= 92 && !markedRead) {
        void markPaperRead(userId, paper.slug).then(() => setMarkedRead(true));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [userId, paper.slug, markedRead, engagementReady]);

  useEffect(() => {
    if (!engagementReady || !notesEdited.current) return;
    const t = window.setTimeout(() => {
      void savePaperNotes(userId, paper.slug, notes).catch(() =>
        toast.error("Notes could not be saved. Keep a copy before leaving."),
      );
    }, 600);
    return () => window.clearTimeout(t);
  }, [notes, userId, paper.slug, engagementReady]);

  const editNotes = (value: string) => {
    notesEdited.current = true;
    setNotes(value);
  };

  const onSaveHighlight = () => {
    const text = getSelectedHighlightText();
    if (!text) {
      toast.error("Select some text in the review first.");
      return;
    }
    void addPaperHighlight(userId, paper.slug, text).then(({ highlight, error }) => {
      if (error) {
        toast.error(error);
        return;
      }
      if (highlight) setHighlights((prev) => [highlight, ...prev]);
      toast.success("Highlight saved.");
    });
  };

  const onDeleteHighlight = (id: string) => {
    void deletePaperHighlight(userId, paper.slug, id).then(({ error }) => {
      if (error) toast.error(error);
      else setHighlights((prev) => prev.filter((h) => h.id !== id));
    });
  };

  const toggleRead = () => {
    void (
      markedRead ? unmarkPaperRead(userId, paper.slug) : markPaperRead(userId, paper.slug)
    ).then(() => {
      setMarkedRead(!markedRead);
      toast.success(markedRead ? "Moved to unread" : "Marked as read");
    });
  };

  return (
    <>
      <div className="fixed top-[2px] left-0 right-0 z-[70] h-px bg-border/60">
        <div
          className="h-full bg-bone/80 transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {engagementError ? (
        <p role="alert" className="my-4 text-sm text-muted-foreground">
          Your saved reading state could not be loaded. Notes will not overwrite it. Refresh to try
          again.
        </p>
      ) : !engagementReady ? (
        <p role="status" className="my-4 text-sm text-muted-foreground">
          Loading saved reading state…
        </p>
      ) : null}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14 xl:gap-16">
        <article className="min-w-0 pb-28 lg:pb-24">
          <header className="mb-10 border-l-2 border-accent-blue/30 pl-6 md:pl-8 paper-hero">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              <ProgressRing
                value={scrollProgress}
                size={40}
                stroke={2.5}
                label="Reading progress"
              />
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                {paper.is_classic ? "Classic" : "Review"}
              </span>
              <span className="text-border">·</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {readMinutes} min · ~
                {Math.max(1, Math.round(readMinutes * (1 - scrollProgress / 100)))} min left
              </span>
              {markedRead ? (
                <>
                  <span className="text-border">·</span>
                  <span className="font-mono text-[9px] uppercase text-accent-green">Finished</span>
                </>
              ) : scrollProgress > 8 ? (
                <>
                  <span className="text-border">·</span>
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">
                    {Math.round(scrollProgress)}%
                  </span>
                </>
              ) : null}
            </div>

            <Title className="font-display text-3xl md:text-[2.5rem] text-bone tracking-tight leading-[1.12] max-w-3xl">
              {paper.title}
            </Title>
            <p className="mt-4 text-sm text-muted-foreground">
              {[paper.authors, paper.year].filter(Boolean).join(" · ")}
            </p>

            {pullQuote ? (
              <p className="mt-6 text-base md:text-lg text-foreground/85 leading-relaxed max-w-2xl">
                {pullQuote}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <SaveToCollectionButton
                itemType="paper"
                itemSlug={paper.slug}
                itemTitle={paper.title}
              />
              <ShareButton title={paper.title} />
              <ReportContentButton contentType="paper" contentSlug={paper.slug} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleRead}
                className="font-mono text-[9px] tracking-[0.15em] uppercase"
              >
                {markedRead ? "Mark unread" : "Mark read"}
              </Button>
              {safeHref(paper.arxiv_url) ? (
                <a
                  href={safeHref(paper.arxiv_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-2 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground hover:text-bone transition"
                >
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
            <TagList tags={paper.tags} linkToSearch className="mt-5" />
          </header>

          <PaperReviewBody sections={sections} />
          <div className="lg:hidden">
            <PaperLearningLinks slugs={relatedGuides.map((guide) => guide.slug)} />
          </div>

          <nav className="mt-14 grid gap-3 sm:grid-cols-2 border-t border-border/50 pt-8">
            {prev ? (
              <Link
                {...paperLink(prev.slug)}
                className="rounded-sm border border-border/50 p-4 hover:border-bone/20 transition"
              >
                <span className="font-mono text-[8px] uppercase text-muted-foreground">
                  Previous
                </span>
                <p className="mt-2 text-sm text-bone line-clamp-2">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                {...paperLink(next.slug)}
                className="rounded-sm border border-border/50 p-4 hover:border-bone/20 transition sm:text-right"
              >
                <span className="font-mono text-[8px] uppercase text-muted-foreground">Next</span>
                <p className="mt-2 text-sm text-bone line-clamp-2">{next.title}</p>
              </Link>
            ) : null}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <ReaderSidebar
              toc={toc}
              notes={notes}
              onNotesChange={editNotes}
              notesReady={engagementReady}
              relatedGuides={relatedGuides}
              highlights={highlights}
              onSaveHighlight={onSaveHighlight}
              onDeleteHighlight={onDeleteHighlight}
            />
          </div>
        </aside>
      </div>

      <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-[60] lg:hidden">
        <div className="glass-dock flex gap-2 p-1.5">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 font-mono text-[9px] uppercase h-10 rounded-xl hover:bg-bone/5"
              >
                <List className="h-3.5 w-3.5 mr-2" />
                Sections
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display text-left">Sections</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 rounded-sm border border-border/50 p-4">
                <ul className="space-y-2">
                  {toc.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={cn(
                          "text-sm leading-snug block py-1 transition",
                          s.variant === "build"
                            ? "text-accent-green/90 hover:text-accent-green"
                            : "text-muted-foreground hover:text-bone",
                        )}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <Link
                to="/research"
                search={{ view: "paths" }}
                className="mt-4 block font-mono text-[9px] uppercase text-accent-blue"
              >
                Reading paths →
              </Link>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 font-mono text-[9px] uppercase h-10 rounded-xl hover:bg-bone/5"
              >
                <StickyNote className="h-3.5 w-3.5 mr-2" />
                Notes
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[60vh]">
              <SheetHeader>
                <SheetTitle className="font-display text-left">Your notes</SheetTitle>
              </SheetHeader>
              <Textarea
                value={notes}
                disabled={!engagementReady}
                onChange={(e) => editNotes(e.target.value)}
                rows={8}
                placeholder="Claims to verify, reproduction ideas…"
                className="mt-4 text-sm resize-none"
              />
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 font-mono text-[9px] uppercase h-10 rounded-xl hover:bg-bone/5"
              >
                <Highlighter className="h-3.5 w-3.5 mr-2" />
                Highlights
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display text-left">Highlights</SheetTitle>
              </SheetHeader>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSaveHighlight}
                className="mt-4 w-full font-mono text-[8px] tracking-[0.12em] uppercase"
              >
                Save selection
              </Button>
              {highlights.length ? (
                <ul className="mt-4 space-y-2">
                  {highlights.map((h) => (
                    <li
                      key={h.id}
                      className="text-xs text-muted-foreground border-l-2 border-accent-blue/40 pl-2"
                    >
                      <p className="line-clamp-4">{h.highlighted_text}</p>
                      <button
                        type="button"
                        onClick={() => onDeleteHighlight(h.id)}
                        className="mt-1 font-mono text-[7px] uppercase text-accent-red hover:text-bone"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Select text in the review, then tap save.
                </p>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
