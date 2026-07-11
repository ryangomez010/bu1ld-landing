import { Link } from "@tanstack/react-router";

import type { RecentView } from "@/lib/recent-views";

const TYPE_LABELS: Record<RecentView["type"], string> = {
  project: "Project",
  paper: "Paper",
  guide: "Guide",
};

export function ContinueReadingStrip({ views }: { views: RecentView[] }) {
  if (!views.length) return null;

  return (
    <section className="section-gap">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
        Recently opened
      </p>
      <p className="text-xs text-muted-foreground/80 mb-3">
        Last six project, paper, or guide pages you visited — stored locally and on your account.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {views.slice(0, 6).map((view) => (
          <Link
            key={`${view.type}:${view.slug}`}
            to={view.href}
            className="panel panel-interactive rounded-xl p-4 block relative z-[1]"
          >
            <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-accent-blue">
              {TYPE_LABELS[view.type]}
            </span>
            <p className="mt-2 font-display text-base text-bone line-clamp-2">{view.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
