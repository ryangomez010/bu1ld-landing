import { LANDING_ANCHORS } from "@/data/landing";

export function LandingSectionNav() {
  return (
    <div className="relative z-20 border-y border-border/60 bg-background/90 backdrop-blur-xl md:sticky md:top-[4.5rem]">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 sm:px-6">
        <p className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40 sm:block">
          Explore this page
        </p>
        <nav
          aria-label="Explore this page"
          className="-mx-2 flex min-w-0 flex-1 gap-1 overflow-x-auto px-2"
        >
          {LANDING_ANCHORS.map(([label, id], index) => (
            <a
              key={id}
              href={`#${id}`}
              className="group inline-flex min-h-12 shrink-0 items-center gap-2 rounded-sm px-3 text-xs text-muted-foreground transition hover:bg-bone/5 hover:text-bone"
            >
              <span className="font-mono text-[8px] tabular-nums text-bone/35 transition group-hover:text-accent-blue">
                {String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
