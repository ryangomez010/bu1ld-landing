import { Link } from "@tanstack/react-router";

import type { AttentionItem } from "@/lib/attention";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  high: "border-accent-red/30 bg-accent-red/5",
  medium: "border-accent-blue/30 bg-accent-blue/5",
  low: "border-border/50 bg-background/60",
} as const;

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (!items.length) return null;

  return (
    <section className="section-gap">
      <div className="mb-4">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Needs your attention
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prioritized actions across applications, deadlines, and your profile.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-sm border px-4 py-4 flex flex-col gap-3",
              PRIORITY_STYLES[item.priority],
            )}
          >
            <div>
              <p className="font-display text-base text-bone">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
            <Link
              to={item.href}
              className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone self-start"
            >
              {item.cta} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
