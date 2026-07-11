import { Link } from "@tanstack/react-router";
import { Check, Circle } from "lucide-react";

import type { CompletenessStep } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function ProfileCompletenessMeter({
  percent,
  steps,
  compact = false,
}: {
  percent: number;
  steps: CompletenessStep[];
  compact?: boolean;
}) {
  const pending = steps.filter((s) => !s.done);

  if (percent >= 100) {
    return (
      <div className="rounded-xl border border-accent-green/25 bg-accent-green/5 p-4">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-green">
          Profile complete
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your member card is ready to share from your profile page. Update interests periodically —
          they drive For You ranking, digest content, and directory search.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/40 panel glass p-5", compact && "p-4")}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Profile completeness
          </p>
          <p className="mt-1 font-display text-2xl text-bone">{percent}%</p>
        </div>
        <div className="h-12 w-12 rounded-full border-2 border-border/50 flex items-center justify-center">
          <svg className="absolute h-12 w-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-border/40"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (percent / 100) * 125.6}
              strokeLinecap="round"
              className="text-accent-green"
            />
          </svg>
        </div>
      </div>

      {!compact ? (
        <p className="text-sm text-muted-foreground mb-4">
          Each field below appears somewhere specific: your name and avatar on the directory card,
          bio and links in project application review, interests in For You ranking, goals on your
          public profile, timezone for event coordination.
        </p>
      ) : null}

      <ul className="space-y-2">
        {(compact ? pending.slice(0, 3) : steps).map((step) => (
          <li key={step.label}>
            {step.done ? (
              <div className="flex items-start gap-2 text-sm text-muted-foreground/70">
                <Check className="h-4 w-4 text-accent-green shrink-0 mt-0.5" aria-hidden />
                <span className="line-through">{step.label}</span>
              </div>
            ) : step.href ? (
              <Link
                to={step.href}
                className="flex items-start gap-2 text-sm text-bone hover:text-accent-blue transition group"
              >
                <Circle className="h-4 w-4 text-border shrink-0 mt-0.5 group-hover:text-accent-blue" />
                <span>
                  <span className="font-medium">{step.label}</span>
                  {!compact ? (
                    <span className="block text-xs text-muted-foreground mt-0.5">{step.hint}</span>
                  ) : null}
                </span>
              </Link>
            ) : (
              <div className="flex items-start gap-2 text-sm text-bone">
                <Circle className="h-4 w-4 text-border shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium">{step.label}</span>
                  {!compact ? (
                    <span className="block text-xs text-muted-foreground mt-0.5">{step.hint}</span>
                  ) : null}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {compact && pending.length > 3 ? (
        <Link
          to="/profile"
          className="mt-3 inline-block font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
        >
          {pending.length - 3} more steps →
        </Link>
      ) : null}
    </div>
  );
}
