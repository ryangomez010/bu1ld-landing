import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 44,
  stroke = 3,
  className,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${Math.round(pct)}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-accent-green transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute font-mono text-[8px] tracking-wider text-bone">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
