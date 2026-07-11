import { cn } from "@/lib/utils";

export function StatCell({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("stat-cell relative z-[1]", className)}>
      <p className="stat-cell-label">{label}</p>
      <p className="stat-cell-value">{value}</p>
    </div>
  );
}
