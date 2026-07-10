import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent-blue/60 motion-safe:animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading content" className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="panel h-28 rounded-sm overflow-hidden">
          <div className="h-full w-full shimmer opacity-60" />
        </div>
      ))}
    </div>
  );
}
