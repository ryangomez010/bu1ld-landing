import { RESEARCH, dotColor } from "@/data/landing";

export function MarqueeStrip() {
  return (
    <div className="relative border-y border-border/60 bg-background/70 backdrop-blur-md py-5 overflow-hidden">
      <div className="marquee-track flex whitespace-nowrap font-mono text-[11px] tracking-[0.4em] uppercase text-bone/50">
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex shrink-0 items-center">
            {RESEARCH.map((r) => (
              <span key={r.id + k} className="flex items-center gap-6 pr-12">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor(r.color)}`} />
                {r.name}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
