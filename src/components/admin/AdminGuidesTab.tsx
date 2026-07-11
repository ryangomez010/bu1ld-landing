import { Link } from "@tanstack/react-router";
import { getAllGuides } from "@/content/guides";
import { guideLink } from "@/lib/app-paths";
import { estimateReadMinutes } from "@/lib/read-time";

export function AdminGuidesTab() {
  const guides = getAllGuides();

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Guides live in the repo under <code className="font-mono text-xs">src/content/guides/</code>
        . Deploy to publish changes. Reading progress syncs per member via Supabase.
      </p>
      <ul className="space-y-3 text-sm border border-border/60 rounded-sm divide-y divide-border/40">
        {guides.map((g) => (
          <li key={g.slug} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg text-bone">{g.title}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{g.description}</p>
              <p className="mt-2 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                ~{g.readMinutes ?? estimateReadMinutes(g.description)} min read ·{" "}
                {g.tags.join(", ")}
              </p>
            </div>
            <Link
              {...guideLink(g.slug)}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Preview →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
