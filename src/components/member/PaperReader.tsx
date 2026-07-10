import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TagList } from "@/components/member/ContentCard";
import { PaperReviewBody } from "@/components/member/PaperReviewMarkdown";
import { SaveButton } from "@/components/member/SaveButton";
import { ShareButton } from "@/components/member/ShareButton";
import { Button } from "@/components/ui/button";
import { getPaperScrollProgress, setPaperScrollProgress } from "@/lib/paper-reading-progress";
import { isPaperRead, markPaperRead, unmarkPaperRead } from "@/lib/paper-read";
import { extractPullQuote, paperReadMinutes, parseReviewSections } from "@/lib/paper-review";
import type { Paper } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    void isPaperRead(userId, paper.slug).then(setMarkedRead);
    setScrollProgress(getPaperScrollProgress(userId, paper.slug));
  }, [userId, paper.slug]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 100;
      setScrollProgress(pct);
      setPaperScrollProgress(userId, paper.slug, pct);
      if (pct >= 92 && !markedRead) {
        void markPaperRead(userId, paper.slug).then(() => setMarkedRead(true));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [userId, paper.slug, markedRead]);

  const toggleRead = () => {
    void (markedRead ? unmarkPaperRead(userId, paper.slug) : markPaperRead(userId, paper.slug)).then(
      () => {
        setMarkedRead(!markedRead);
        toast.success(markedRead ? "Moved to unread" : "Marked as read");
      },
    );
  };

  return (
    <>
      <div className="fixed top-[2px] left-0 right-0 z-[70] h-1 bg-border/40">
        <div className="h-full bg-gradient-to-r from-accent-red via-accent-violet to-accent-blue transition-all" style={{ width: `${scrollProgress}%` }} />
      </div>
      <div className="fixed top-3 right-4 z-[70] font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground bg-background/85 backdrop-blur px-2.5 py-1.5 rounded-sm border border-border/40">
        {Math.round(scrollProgress)}% · {readMinutes} min
      </div>
      <div className="lg:grid lg:grid-cols-[1fr_14rem] lg:gap-12">
        <article className="min-w-0 pb-24 page-enter">
          <header className="paper-hero rounded-sm border border-border/50 bg-gradient-to-br from-background to-accent-blue/5 p-6 md:p-8 mb-10">
            <span className={cn("font-mono text-[9px] tracking-[0.25em] uppercase px-2.5 py-1 rounded-sm border", paper.is_classic ? "border-accent-violet/40 text-accent-violet" : "border-accent-blue/40 text-accent-blue")}>
              {paper.is_classic ? "Classic review" : "BUILD review"}
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-bone mt-4 tracking-tight">{paper.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{[paper.authors, paper.year].filter(Boolean).join(" · ")} · {readMinutes} min</p>
            {pullQuote ? <p className="mt-5 text-lg text-bone/90 border-l-2 border-accent-blue/40 pl-5">{pullQuote}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <SaveButton itemType="paper" itemSlug={paper.slug} itemTitle={paper.title} />
              <ShareButton title={paper.title} />
              <Button type="button" size="sm" variant={markedRead ? "outline" : "default"} onClick={toggleRead} className="font-mono text-[9px] uppercase">{markedRead ? "Unread" : "Mark read"}</Button>
              {paper.arxiv_url ? <a href={paper.arxiv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 border border-border/60 px-3 py-2 font-mono text-[9px] uppercase text-accent-blue hover:text-bone">arXiv <ExternalLink className="h-3 w-3" /></a> : null}
            </div>
            <TagList tags={paper.tags} linkToSearch className="mt-4" />
          </header>
          <PaperReviewBody sections={sections} />
          <nav className="mt-10 flex justify-between gap-4 border-t border-border/60 pt-8">
            {prev ? <Link to={`/papers/${prev.slug}`} className="max-w-[45%] text-sm text-muted-foreground hover:text-bone">← {prev.title}</Link> : <span />}
            {next ? <Link to={`/papers/${next.slug}`} className="max-w-[45%] text-sm text-muted-foreground hover:text-bone text-right ml-auto">{next.title} →</Link> : null}
          </nav>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-sm border border-border/60 p-4">
            <p className="font-mono text-[9px] uppercase text-muted-foreground mb-3 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Sections</p>
            <ul className="space-y-2">{toc.map((s) => <li key={s.id}><a href={`#${s.id}`} className={cn("text-sm", s.variant === "build" ? "text-accent-green" : "text-muted-foreground hover:text-bone")}>{s.title}</a></li>)}</ul>
          </div>
        </aside>
      </div>
    </>
  );
}
