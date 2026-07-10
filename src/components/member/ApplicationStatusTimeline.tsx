import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIMELINE_STEPS: { key: ApplicationStatus; label: string }[] = [
  { key: "pending", label: "Submitted" },
  { key: "waitlist", label: "Waitlisted" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

export function ApplicationStatusTimeline({ status }: { status: ApplicationStatus }) {
  const activeIndex = TIMELINE_STEPS.findIndex((s) => s.key === status);
  const terminal = status === "declined" || status === "accepted";

  return (
    <ol className="mt-4 flex flex-wrap items-center gap-1" aria-label="Application status">
      {TIMELINE_STEPS.map((step, i) => {
        const isActive = step.key === status;
        const isPast = i < activeIndex && !terminal;
        const show =
          status === "declined" ? step.key === "pending" || step.key === "declined" : true;
        if (!show) return null;
        return (
          <li key={step.key} className="flex items-center gap-1">
            {i > 0 && status !== "declined" ? (
              <span className="font-mono text-[8px] text-border">—</span>
            ) : null}
            <span
              className={cn(
                "font-mono text-[8px] tracking-[0.15em] uppercase px-2 py-1 rounded-sm border",
                isActive
                  ? "border-accent-blue/40 bg-accent-blue/10 text-bone"
                  : isPast
                    ? "border-accent-green/30 text-accent-green"
                    : "border-border/50 text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
