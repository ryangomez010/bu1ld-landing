import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ResearchContinueCard } from "@/components/member/ResearchContinueCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { getAllGuides } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { fetchPapers } from "@/lib/content";
import { getReadPaperSlugs } from "@/lib/paper-read";
import { getAllGuideProgress } from "@/lib/reading-progress";
import {
  pathProgress,
  RESEARCH_PATHS,
  stepHref,
  stepLabel,
  type PathStep,
} from "@/lib/research-paths";
import type { Paper } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research/")({
  component: ResearchHubPage,
  head: () => ({
    meta: [{ title: "Research library — The Bu1ld" }],
  }),
});

function ResearchHubPage() {
  return (
    <RequireMember>
      <ResearchHub />
    </RequireMember>
  );
}

function ResearchHub() {
  const { user } = useAuth();
  const guides = getAllGuides();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [guideProgress, setGuideProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState(RESEARCH_PATHS[0]!.id);

  useEffect(() => {
    void fetchPapers().then((p) => {
      setPapers(p);
      setLoading(false);
    });
    if (!user) return;
    void getReadPaperSlugs(user.id).then(setReadSlugs);
    void getAllGuideProgress(user.id).then(setGuideProgress);
  }, [user]);

  const path = RESEARCH_PATHS.find((p) => p.id === activePath) ?? RESEARCH_PATHS[0]!;
  const progress = pathProgress(path, readSlugs, guideProgress);
  const papersRead = papers.filter((p) => readSlugs.has(p.slug)).length;
  const guidesDone = guides.filter((g) => (guideProgress[g.slug] ?? 0) >= 95).length;

  return (
    <MemberLayout title="Research library" eyebrow="academic resources">
      <p className="text-muted-foreground mb-8 max-w-2xl -mt-4 leading-relaxed">
        Guides for intuition, paper reviews for depth, reading paths that connect them. Everything
        here is written by BUILD members — not scraped abstracts.
      </p>

      {user ? <ResearchContinueCard userId={user.id} /> : null}

      <div className="mb-12 panel glass rounded-2xl overflow-hidden grid gap-px sm:grid-cols-3">
        <div className="stat-cell relative z-[1]">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">Paper reviews</p>
          <p className="mt-2 font-display text-2xl text-bone">
            {papersRead}/{papers.length}
          </p>
          <Link
            to="/papers"
            className="mt-2 inline-block font-mono text-[9px] uppercase text-accent-blue hover:text-bone"
          >
            Browse →
          </Link>
        </div>
        <div className="stat-cell relative z-[1]">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">Guides finished</p>
          <p className="mt-2 font-display text-2xl text-bone">
            {guidesDone}/{guides.length}
          </p>
          <Link
            to="/guides"
            className="mt-2 inline-block font-mono text-[9px] uppercase text-accent-blue hover:text-bone"
          >
            Browse →
          </Link>
        </div>
        <div className="stat-cell relative z-[1]">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">Active path</p>
          <p className="mt-2 font-display text-2xl text-bone">{progress.percent}%</p>
          <p className="mt-2 font-mono text-[9px] uppercase text-muted-foreground">
            {progress.done}/{progress.total} steps
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Reading paths
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {RESEARCH_PATHS.map((p) => {
            const pp = pathProgress(p, readSlugs, guideProgress);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePath(p.id)}
                className={cn(
                  "font-mono text-[9px] tracking-[0.15em] uppercase px-3 py-2 rounded-xl border transition panel-interactive",
                  activePath === p.id
                    ? "chip-active border-accent-blue/40"
                    : "border-border/40 text-muted-foreground hover:text-bone glass-subtle",
                )}
              >
                {p.title}
                {pp.done > 0 ? ` · ${pp.done}/${pp.total}` : ""}
              </button>
            );
          })}
        </div>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : (
          <div className="panel glass rounded-2xl overflow-hidden">
            <div className="border-b border-border/30 px-5 py-5 md:px-6 relative z-[1]">
              <h3 className="font-display text-xl text-bone">{path.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {path.description}
              </p>
              <div className="mt-4 h-1 max-w-xs rounded-full bg-border/60 overflow-hidden">
                <div className="h-full bg-bone/70" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
            <ol className="divide-y divide-border/30 relative z-[1]">
              {path.steps.map((step, i) => (
                <PathStepRow
                  key={`${step.kind}-${step.slug}`}
                  index={i + 1}
                  step={step}
                  label={stepLabel(step, guides, papers)}
                  href={stepHref(step)}
                  done={
                    step.kind === "paper"
                      ? readSlugs.has(step.slug)
                      : (guideProgress[step.slug] ?? 0) >= 95
                  }
                  inProgress={
                    step.kind === "guide" &&
                    (guideProgress[step.slug] ?? 0) > 0 &&
                    (guideProgress[step.slug] ?? 0) < 95
                  }
                  progress={step.kind === "guide" ? guideProgress[step.slug] : undefined}
                />
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Link to="/papers" className="panel panel-interactive block p-6 rounded-2xl group">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">Paper reviews</p>
          <h3 className="font-display text-xl text-bone mt-2 group-hover:text-accent-blue transition">
            Editorial reviews with BUILD context
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Classics, scaling laws, alignment — with section notes and arXiv links.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent-blue">
            Open library <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
        <Link to="/guides" className="panel panel-interactive block p-6 rounded-2xl group">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">Reference guides</p>
          <h3 className="font-display text-xl text-bone mt-2 group-hover:text-accent-blue transition">
            Short essays before the heavy papers
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Attention, JEPA, PINNs — scroll progress saves automatically.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent-blue">
            Open guides <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </section>
    </MemberLayout>
  );
}

function PathStepRow({
  index,
  step,
  label,
  href,
  done,
  inProgress,
  progress,
}: {
  index: number;
  step: PathStep;
  label: string;
  href: string;
  done: boolean;
  inProgress?: boolean;
  progress?: number;
}) {
  return (
    <li>
      <Link
        to={href}
        className="flex items-start gap-4 px-5 py-4 md:px-6 hover:bg-bone/[0.03] transition"
      >
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
            done
              ? "border-accent-green/40 bg-accent-green/10 text-accent-green"
              : "border-border/60 text-muted-foreground",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            {step.kind === "guide" ? "Guide" : "Paper review"}
          </p>
          <p className="text-bone mt-1">{label}</p>
          {inProgress && progress != null ? (
            <p className="mt-1 font-mono text-[8px] uppercase text-muted-foreground">
              {Math.round(progress)}% read
            </p>
          ) : null}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
      </Link>
    </li>
  );
}
