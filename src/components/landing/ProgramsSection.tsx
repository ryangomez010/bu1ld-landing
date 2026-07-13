import { Link } from "@tanstack/react-router";

import { SectionShell } from "@/components/landing/Section";

import { PROGRAMS } from "@/data/landing";

export function ProgramsSection() {
  return (
    <SectionShell
      id="programs"
      eyebrow="04"
      label="entry tracks"
      title="Structured ways to work."
      subtitle="Programs are published only when their scope, dates, capacity, and review process are ready. Each one is designed around a concrete technical output."
    >
      <div className="grid md:grid-cols-3 gap-px bg-border/40 border border-border/40">
        {PROGRAMS.map((p, i) => (
          <div
            key={p.tag}
            className="relative bg-background/80 p-10 group hover:bg-background/50 transition overflow-hidden"
          >
            <div className="absolute top-4 right-4 font-mono text-[9px] tracking-[0.3em] uppercase text-bone/30">
              0{i + 1} / 03
            </div>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue">
              {p.tag}
            </span>
            <h3 className="font-display text-2xl md:text-3xl mt-8 text-bone tracking-tight">
              {p.name}
            </h3>
            <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              {p.time}
            </p>
            <p className="mt-6 text-muted-foreground leading-relaxed text-[15px]">{p.body}</p>
            <div className="mt-10 h-px bg-gradient-to-r from-accent-blue/50 via-accent-violet/30 to-transparent" />
            <Link
              to={p.href}
              className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-bone hover:text-accent-blue transition"
            >
              View programs{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
