import { Link } from "@tanstack/react-router";

import { SectionHeader } from "@/components/member/SectionHeader";
import type { AttentionItem } from "@/lib/attention";

export function TodayFocus({ items }: { items: AttentionItem[] }) {
  const order = { high: 0, medium: 1, low: 2 };
  const focus = [...items].sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3);
  if (!focus.length) return null;

  return (
    <section className="mb-8 panel glass surface-card overflow-hidden" aria-label="Today's focus">
      <div className="px-5 py-4 border-b border-border/30 relative z-[1]">
        <SectionHeader
          title="Today's focus"
          description="Incomplete onboarding, due-today deadlines, and unread notifications — ranked by urgency"
          className="mb-0"
        />
      </div>
      <ul className="divide-y divide-border/30 relative z-[1]">
        {focus.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-bone/[0.04] transition-colors duration-300"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm text-bone">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.body}</p>
              </div>
              <span className="cta-link shrink-0">{item.cta} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
