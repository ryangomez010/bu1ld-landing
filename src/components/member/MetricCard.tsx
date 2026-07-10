import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  to,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  to: string;
  accent?: "blue" | "green" | "red" | "violet";
  icon?: LucideIcon;
}) {
  const accentColor =
    accent === "green"
      ? "text-accent-green"
      : accent === "red"
        ? "text-accent-red"
        : accent === "violet"
          ? "text-accent-violet"
          : "text-accent-blue";

  const accentBar =
    accent === "green"
      ? "group-hover:bg-accent-green"
      : accent === "red"
        ? "group-hover:bg-accent-red"
        : accent === "violet"
          ? "group-hover:bg-accent-violet"
          : "group-hover:bg-accent-blue";

  return (
    <Link to={to} className="panel panel-interactive group relative overflow-hidden p-4 block rounded-sm">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 bg-transparent transition-colors duration-300",
          accentBar,
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-40 transition-all duration-300 group-hover:opacity-100",
              accentColor,
            )}
            aria-hidden
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl md:text-3xl text-bone tracking-tight transition-colors duration-300",
          "group-hover:text-accent-blue",
        )}
      >
        {value}
      </p>
    </Link>
  );
}
