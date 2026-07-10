import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import {
  computeOnboardingProgress,
  dismissOnboardingChecklist,
  isOnboardingChecklistDismissed,
  type OnboardingProgress,
} from "@/lib/onboarding-progress";

export function OnboardingChecklist({
  userId,
  progress,
}: {
  userId: string;
  progress: Omit<Parameters<typeof computeOnboardingProgress>[0], never>;
}) {
  const dismissed = isOnboardingChecklistDismissed(userId);
  const data: OnboardingProgress = computeOnboardingProgress(progress);

  if (dismissed || data.complete) return null;

  return (
    <section className="mb-8 rounded-sm border border-accent-violet/30 bg-accent-violet/5 px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-violet">
            Onboarding — {data.percent}% complete
          </h2>
          <div className="mt-3 h-1.5 rounded-full bg-border/60 overflow-hidden max-w-xs">
            <div
              className="h-full bg-accent-violet transition-all"
              style={{ width: `${data.percent}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismissOnboardingChecklist(userId)}
          className="text-muted-foreground hover:text-bone"
          title="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ol className="space-y-3">
        {data.steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-[10px] w-5 h-5 flex items-center justify-center rounded-sm border ${
                  step.done
                    ? "border-accent-green/40 bg-accent-green/10 text-accent-green"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                {step.done ? "✓" : "·"}
              </span>
              <span
                className={
                  step.done ? "text-muted-foreground line-through text-sm" : "text-bone text-sm"
                }
              >
                {step.label}
              </span>
            </div>
            {!step.done ? (
              <Link
                to={step.href}
                className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone shrink-0"
              >
                Go →
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
