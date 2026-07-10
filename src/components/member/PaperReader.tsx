import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, List, StickyNote } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { TagList } from "@/components/member/ContentCard";
import { PaperReviewBody } from "@/components/member/PaperReviewMarkdown";
import { SaveButton } from "@/components/member/SaveButton";
import { ShareButton } from "@/components/member/ShareButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getAllGuides } from "@/content/guides";
import {
  fetchPaperNotes,
  fetchPaperScrollProgress,
  savePaperNotes,
  savePaperScrollProgress,
} from "@/lib/paper-notes";
import { isPaperRead, markPaperRead, unmarkPaperRead } from "@/lib/paper-read";
import { extractPullQuote, paperReadMinutes, parseReviewSections } from "@/lib/paper-review";
import { relatedGuidesForPaper } from "@/lib/research-paths";
import type { Paper } from "@/lib/types";
import { cn } from "@/lib/utils";

function ReaderSidebar({
  toc,
  notes,
  onNotesChange,
  relatedGuides,
}: {
  toc: ReturnType<typeof parseReviewSections>;
  notes: string;
  onNotesChange: (value: string) => void;
  relatedGuides: ReturnType<typeof relatedGuidesForPaper>;
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
          onChange={(e) => onNotesChange(e.target.value)}
          rows={6}
          placeholder="Claims to verify, reproduction ideas, questions for the thread…"
          className="text-sm resize-none bg-background/50"
        />
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
                  to={`/guides/${g.slug}`}
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
}: {
  paper: Paper;
  userId: string;
  prev: Paper | null;
  next: Paper | null;
}) {
  const sections = useMemo(() => parseReviewSections(paper.review_body), [paper.review_body]);
  const readMinutes = paperReadMinutes(paper);
  const pullQuote = extractPullQuote(paper.summary, sections);
  const toc = sections.filter((s) => s.id !== "overview");
  const relatedGuides = useMemo(() => relatedGuidesForPaper(paper, getAllGuides()), [paper]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [markedRead, setMarkedRead] = useState(false);
  const [notes, setNotes] = useState("");
  const progressSaveRef = useRef(0);

  useEffect(() => {
    void Promise.all([
      isPaperRead(userId, paper.slug),
      fetchPaperScrollProgress(userId, paper.slug),
      fetchPaperNotes(userId, paper.slug),
    ]).then(([read, progress, savedNotes]) => {
      setMarkedRead(read);
      setScrollProgress(progress);
      setNotes(savedNotes);
    });
  }, [userId, paper.slug]);

  useEffect(() => {
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
  }, [userId, paper.slug, markedRead]);

  useEffect(() => {
    const t = window.setTimeout(() => savePaperNotes(userId, paper.slug, notes), 600);
    return () => window.clearTimeout(t);
  }, [notes, userId, paper.slug]);

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

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14 xl:gap-16">
        <article className="min-w-0 pb-28 lg:pb-24">
          <header className="mb-10 border-l-2 border-accent-blue/30 pl-6 md:pl-8 paper-hero">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                {paper.is_classic ? "Classic" : "Review"}
              </span>
              <span className="text-border">·</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {readMinutes} min read
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

            <h1 className="font-display text-3xl md:text-[2.5rem] text-bone tracking-tight leading-[1.12] max-w-3xl">
              {paper.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {[paper.authors, paper.year].filter(Boolean).join(" · ")}
            </p>

            {pullQuote ? (
              <p className="mt-6 text-base md:text-lg text-foreground/85 leading-relaxed max-w-2xl">
                {pullQuote}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <SaveButton itemType="paper" itemSlug={paper.slug} itemTitle={paper.title} />
              <ShareButton title={paper.title} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleRead}
                className="font-mono text-[9px] tracking-[0.15em] uppercase"
              >
                {markedRead ? "Mark unread" : "Mark read"}
              </Button>
              {paper.arxiv_url ? (
                <a
                  href={paper.arxiv_url}
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

          <nav className="mt-14 grid gap-3 sm:grid-cols-2 border-t border-border/50 pt-8">
            {prev ? (
              <Link
                to={`/papers/${prev.slug}`}
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
                to={`/papers/${next.slug}`}
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
              onNotesChange={setNotes}
              relatedGuides={relatedGuides}
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
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="Claims to verify, reproduction ideas…"
                className="mt-4 text-sm resize-none"
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
