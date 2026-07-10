import { Link } from "@tanstack/react-router";

import type { AttentionItem } from "@/lib/attention";

export function TodayFocus({ items }: { items: AttentionItem[] }) {
  const top = items.filter((i) => i.priority === "high").slice(0, 2);
  const rest = items.filter((i) => i.priority !== "high").slice(0, 1);
  const focus = [...top, ...rest].slice(0, 3);
  if (!focus.length) return null;

  return (
    <section className="mb-8 border border-border/50 rounded-sm">
      <div className="px-5 py-3 border-b border-border/40">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Today
        </p>
      </div>
      <ul className="divide-y divide-border/40">
        {focus.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-bone/[0.02] transition"
            >
              <div>
                <p className="text-sm text-bone">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.body}</p>
              </div>
              <span className="font-mono text-[8px] uppercase text-accent-blue shrink-0">
                {item.cta} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
