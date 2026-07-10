import { cn } from "@/lib/utils";

export function CapacityBar({
  teamCount,
  capacity,
  className,
}: {
  teamCount: number;
  capacity: number;
  className?: string;
}) {
  const pct = capacity > 0 ? Math.min(100, Math.round((teamCount / capacity) * 100)) : 0;
  const full = teamCount >= capacity;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
        <span>Capacity</span>
        <span className={full ? "text-accent-red" : "text-bone/70"}>
          {teamCount}/{capacity}
        </span>
      </div>
      <div className="h-1 rounded-full bg-border/60 overflow-hidden">
        <div
          className={cn("h-full transition-all", full ? "bg-accent-red" : "bg-accent-green")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
