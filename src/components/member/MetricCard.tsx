import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  to,
  accent,
}: {
  label: string;
  value: string;
  to: string;
  accent?: "blue" | "green" | "red" | "violet";
}) {
  const accentBar =
    accent === "green"
      ? "group-hover:bg-accent-green"
      : accent === "red"
        ? "group-hover:bg-accent-red"
        : accent === "violet"
          ? "group-hover:bg-accent-violet"
          : "group-hover:bg-accent-blue";

  return (
    <Link to={to} className="panel panel-interactive group relative overflow-hidden p-4 block">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 bg-transparent transition-colors duration-300",
          accentBar,
        )}
      />
      <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl md:text-3xl text-bone tracking-tight transition group-hover:text-accent-blue">
        {value}
      </p>
    </Link>
  );
}
