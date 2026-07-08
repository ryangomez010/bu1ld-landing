import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ContentCard, TagList } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { getAllGuides } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { getAllGuideProgress } from "@/lib/reading-progress";

export const Route = createFileRoute("/guides/")({
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <RequireAuth>
      <GuidesContent />
    </RequireAuth>
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

  return (
    <MemberLayout title="Guides" eyebrow="reference reading">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Long-form reference essays — not a course platform. Scroll progress saves automatically so
        you can pick up where you left off.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["continue", "Continue"],
            ["not_started", "Not started"],
            ["done", "Finished"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`font-mono text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-sm border transition ${
              filter === key
                ? "bg-accent-blue/10 text-bone border-accent-blue/30"
                : "border-border/60 text-muted-foreground hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
        <p className="text-sm text-muted-foreground">No guides match this filter.</p>
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
