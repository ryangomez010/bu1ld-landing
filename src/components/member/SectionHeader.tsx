import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  action,
  accent = "muted",
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  accent?: "muted" | "green" | "blue" | "violet" | "red";
  className?: string;
}) {
  const accentClass =
    accent === "green"
      ? "text-accent-green"
      : accent === "blue"
        ? "text-accent-blue"
        : accent === "violet"
          ? "text-accent-violet"
          : accent === "red"
            ? "text-accent-red"
            : "text-muted-foreground";

  return (
    <div className={cn("section-header", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={cn("label-sm", accentClass)}>{title}</h2>
        {action}
      </div>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      ) : null}
      <div className="divider-grad mt-3" />
    </div>
  );
}
