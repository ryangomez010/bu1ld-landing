import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ContentCard, EmptyState, TagList } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { MemberLayout } from "@/components/member/MemberLayout";
import { getAllGuides } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { getAllGuideProgress } from "@/lib/reading-progress";

export const Route = createFileRoute("/guides/")({
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <RequireMember>
      <GuidesContent />
    </RequireMember>
  );
}

type GuideFilter = "all" | "continue" | "not_started" | "done";

function GuidesContent() {
  const { user } = useAuth();
  const guides = getAllGuides();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<GuideFilter>("all");
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void getAllGuideProgress(user.id).then(setProgress);
  }, [user]);

  const allTags = useMemo(
    () => Array.from(new Set(guides.flatMap((g) => g.tags))).sort(),
    [guides],
  );

  const filtered = guides.filter((g) => {
    const pct = progress[g.slug] ?? 0;
    if (filter === "continue" && !(pct > 0 && pct < 95)) return false;
    if (filter === "not_started" && pct > 0) return false;
    if (filter === "done" && pct < 95) return false;
    if (tag && !g.tags.includes(tag)) return false;
    return true;
  });

  const progressStats = useMemo(() => {
    let done = 0;
    let continuing = 0;
    let notStarted = 0;
    for (const g of guides) {
      const pct = progress[g.slug] ?? 0;
      if (pct >= 95) done++;
      else if (pct > 0) continuing++;
      else notStarted++;
    }
    return { done, continuing, notStarted, total: guides.length };
  }, [guides, progress]);

  return (
    <MemberLayout title="Guides" eyebrow="reference reading">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Long-form reference essays — not a course platform. Scroll progress saves automatically so
        you can pick up where you left off.
      </p>

      <div className="mb-6 grid gap-px border border-border/40 bg-border/40 sm:grid-cols-4">
        <GuideStat label="Total" value={progressStats.total} />
        <GuideStat label="Finished" value={progressStats.done} />
        <GuideStat label="In progress" value={progressStats.continuing} />
        <GuideStat label="Not started" value={progressStats.notStarted} />
      </div>

      <FilterBar
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={(
          [
            ["all", "All"],
            ["continue", "Continue"],
            ["not_started", "Not started"],
            ["done", "Finished"],
          ] as const
        ).map(([value, label]) => ({ value, label }))}
      />

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
        <EmptyState
          title="No guides match"
          body="Try another progress filter or clear the tag chip."
          action={
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setTag(null);
              }}
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
            >
              Reset filters →
            </button>
          }
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40 sm:grid-cols-2">
          {filtered.map((guide, i) => {
            const pct = progress[guide.slug] ?? 0;
            return (
              <ContentCard
                key={guide.slug}
                to={`/guides/${guide.slug}`}
                tag={`guide / ${String(i + 1).padStart(2, "0")}`}
                title={guide.title}
                summary={guide.description}
                meta={`${guide.readMinutes} min · ${pct > 0 ? `${Math.round(pct)}% read` : "not started"}`}
              >
                <TagList tags={guide.tags} className="mt-4" />
                {pct > 0 ? (
                  <div className="mt-4 h-1 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : null}
              </ContentCard>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Looking for something specific?{" "}
        <Link to="/search" className="text-accent-blue hover:text-bone">
          Search guides →
        </Link>
      </p>
    </MemberLayout>
  );
}

function GuideStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background/75 p-4">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
    </div>
  );
}
