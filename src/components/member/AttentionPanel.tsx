import { type LinkProps } from "@tanstack/react-router";
import { CtaLink } from "@/components/member/ContentCard";
import { SectionHeader } from "@/components/member/SectionHeader";
import type { AttentionItem } from "@/lib/attention";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  high: "panel glass border-accent-red/25",
  medium: "panel glass border-accent-blue/25",
  low: "panel glass-subtle",
} as const;

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (!items.length) return null;

  return (
    <section className="section-gap">
      <SectionHeader
        title="Attention queue"
        description="Up to six items — incomplete profile fields, pending applications, due-today event deadlines, unread notifications, and in-progress guides."
      />
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "surface-card border px-4 py-4 flex flex-col gap-3 panel-interactive relative overflow-hidden",
              PRIORITY_STYLES[item.priority],
            )}
          >
            <div>
              <p className="font-display text-base text-bone">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
            <CtaLink
              to={item.href as LinkProps["to"]}
              className="self-start"
              aria-label={`${item.cta}: ${item.title}`}
            >
              {item.cta} →
            </CtaLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
