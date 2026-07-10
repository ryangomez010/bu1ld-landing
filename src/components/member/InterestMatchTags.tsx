import { matchingTags } from "@/lib/interest";
import { cn } from "@/lib/utils";

export function InterestMatchTags({
  tags,
  interests,
  className,
  max = 3,
}: {
  tags: string[];
  interests: string[];
  className?: string;
  max?: number;
}) {
  const matches = matchingTags(tags, interests);
  if (matches.length === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-accent-green/25 bg-accent-green/10 px-2 py-0.5 font-mono text-[8px] tracking-[0.1em] uppercase text-accent-green",
        className,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-accent-green" />
      Matches: {matches.slice(0, max).join(", ")}
    </span>
  );
}
