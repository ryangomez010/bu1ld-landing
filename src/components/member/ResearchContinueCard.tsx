import { Link } from "@tanstack/react-router";
import { ArrowRight, Library } from "lucide-react";
import { useEffect, useState } from "react";

import { getAllGuides } from "@/content/guides";
import { fetchPapers } from "@/lib/content";
import { getReadPaperSlugs } from "@/lib/paper-read";
import { getAllGuideProgress } from "@/lib/reading-progress";
import { findContinueResearch, type ContinueResearch } from "@/lib/research-paths";

export function ResearchContinueCard({ userId }: { userId: string }) {
  const [next, setNext] = useState<ContinueResearch | null>(null);

  useEffect(() => {
    void Promise.all([
      getReadPaperSlugs(userId),
      getAllGuideProgress(userId),
      fetchPapers(),
    ]).then(([readSlugs, guideProgress, papers]) => {
      setNext(findContinueResearch(readSlugs, guideProgress, getAllGuides(), papers));
    });
  }, [userId]);

  if (!next) return null;

  return (
    <section className="section-gap">
      <Link
        to={next.href}
        className="panel panel-interactive glass rounded-2xl p-6 md:p-7 block group relative overflow-hidden"
      >
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-accent-green flex items-center gap-2">
              <Library className="h-3.5 w-3.5" />
              Continue research
            </p>
            <h3 className="font-display text-xl text-bone mt-2 group-hover:text-accent-blue transition-colors">
              {next.stepTitle}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Path: {next.path.title} · {next.pathPercent}% complete
            </p>
            <div className="mt-4 h-1 max-w-xs rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full bg-bone/75 transition-all duration-500"
                style={{ width: `${next.pathPercent}%` }}
              />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue shrink-0 mt-1">
            Resume
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}
