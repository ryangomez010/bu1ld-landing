import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  action,
  accent = "muted",
  className,
}: {
  title: string;
  action?: ReactNode;
  accent?: "muted" | "green" | "blue";
  className?: string;
}) {
  const accentClass =
    accent === "green"
      ? "text-accent-green"
      : accent === "blue"
        ? "text-accent-blue"
        : "text-muted-foreground";

  return (
    <div className={cn("section-header", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className={cn(
            "font-mono text-[10px] tracking-[0.3em] uppercase",
            accentClass,
          )}
        >
          {title}
        </h2>
        {action}
      </div>
      <div className="divider-grad mt-3" />
    </div>
  );
}
