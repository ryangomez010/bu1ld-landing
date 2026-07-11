import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { CtaLink } from "@/components/member/ContentCard";
import { fetchReadingActivityDays } from "@/lib/reading-streaks";
import { cn } from "@/lib/utils";

const INTENSITY = [
  { key: "none", className: "bg-background/40", label: "None" },
  { key: "low", className: "bg-accent-green/25", label: "Light" },
  { key: "mid", className: "bg-accent-green/45", label: "Moderate" },
  { key: "high", className: "bg-accent-green/70", label: "Heavy" },
] as const;

function intensityClass(count: number, max: number) {
  if (count === 0) return INTENSITY[0].className;
  if (count < max * 0.34) return INTENSITY[1].className;
  if (count < max * 0.67) return INTENSITY[2].className;
  return INTENSITY[3].className;
}

export function ReadingHeatmap({ userId }: { userId: string }) {
  const [days, setDays] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchReadingActivityDays(userId, 28).then((data) => {
      setDays(data);
      setLoading(false);
    });
  }, [userId]);

  const entries = Object.entries(days);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  const totalPapers = entries.reduce((sum, [, n]) => sum + n, 0);
  const activeDays = entries.filter(([, n]) => n > 0).length;

  const summary = useMemo(
    () =>
      totalPapers === 0
        ? "No papers finished in the last 4 weeks."
        : `${totalPapers} paper${totalPapers === 1 ? "" : "s"} finished across ${activeDays} active day${activeDays === 1 ? "" : "s"} in the last 4 weeks.`,
    [totalPapers, activeDays],
  );

  if (loading) {
    return (
      <div className="panel glass surface-card p-5 h-full">
        <div className="shimmer h-3 w-28 rounded-sm" />
        <div className="shimmer mt-2 h-3 w-48 rounded-sm" />
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="aspect-square shimmer rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel glass surface-card p-5 h-full flex flex-col">
      <p className="label-xs text-muted-foreground">Reading rhythm</p>
      <p className="mt-1 text-xs text-muted-foreground">Papers finished per day — last 4 weeks</p>

      {totalPapers === 0 ? (
        <div className="mt-4 flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Finish a paper to start building your reading rhythm.
          </p>
          <CtaLink to="/research" className="mt-3 inline-block">
            Browse research →
          </CtaLink>
        </div>
      ) : (
        <>
          <p className="sr-only">{summary}</p>
          <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label={summary}>
            {entries.map(([date, count]) => (
              <div
                key={date}
                role="presentation"
                aria-label={`${date}: ${count} paper${count === 1 ? "" : "s"} finished`}
                title={`${date}: ${count} paper${count === 1 ? "" : "s"}`}
                className={cn(
                  "aspect-square rounded-sm border border-border/30 transition-colors",
                  intensityClass(count, max),
                )}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2" aria-hidden>
            {INTENSITY.map(({ key, className, label }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm border border-border/30", className)} />
                <span className="label-xs text-muted-foreground/80">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
