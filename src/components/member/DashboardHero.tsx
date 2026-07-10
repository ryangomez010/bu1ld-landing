import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardHero({
  displayName,
  bio,
  completenessPercent,
  roleBadge,
}: {
  displayName: string;
  bio: string;
  completenessPercent: number;
  roleBadge?: React.ReactNode;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mb-10 panel glass rounded-2xl p-6 md:p-8 relative overflow-hidden">
      <div className="relative z-[1] flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-accent-green">
            {greeting} · member hub
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-bone mt-3 tracking-tight flex flex-wrap items-center gap-3">
            {displayName}
            {roleBadge}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{bio}</p>
          <p className="mt-4 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground/80">
            <kbd className="kbd">⌘K</kbd> quick nav · <kbd className="kbd">/</kbd> search
          </p>
        </div>
        <Link
          to="/profile"
          className="panel glass-subtle panel-interactive rounded-xl px-5 py-4 min-w-[160px] shrink-0"
        >
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground relative z-[1]">
            Profile
          </p>
          <p className="mt-1 font-display text-2xl text-bone relative z-[1]">
            {completenessPercent}%
          </p>
          <div className="mt-3 h-1 rounded-full bg-border/50 overflow-hidden relative z-[1]">
            <div
              className="h-full bg-accent-green/90 transition-all duration-500"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </Link>
      </div>
    </div>
  );
}

export function QuickActionChip({
  to,
  label,
  icon: Icon,
  accent,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border/40 panel glass-subtle px-4 py-2.5 font-mono text-[9px] tracking-[0.18em] uppercase text-bone panel-interactive",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 relative z-[1]", accent)} aria-hidden />
      <span className="relative z-[1]">{label}</span>
    </Link>
  );
}
