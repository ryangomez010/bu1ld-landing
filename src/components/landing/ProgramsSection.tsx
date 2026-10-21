import { Link } from "@tanstack/react-router";

import { SectionShell } from "@/components/landing/Section";

import { PROGRAMS } from "@/data/landing";

export function ProgramsSection() {
  return (
    <SectionShell
      id="programs"
      eyebrow="05"
      label="program formats"
      title="Structured ways to work."
      subtitle="Explore program formats designed around a concrete technical output. These are interest pages; dates, reviewer capacity, and open intake are unconfirmed."
    >
      <div className="grid md:grid-cols-3 gap-px bg-border/40 border border-border/40">
        {PROGRAMS.map((p, i) => (
          <div
            key={p.tag}
            className="relative bg-background/80 p-10 group hover:bg-background/50 transition overflow-hidden"
          >
            <div className="absolute top-4 right-4 font-mono text-[9px] tracking-[0.3em] uppercase text-bone/30">
              {String(i + 1).padStart(2, "0")} / {String(PROGRAMS.length).padStart(2, "0")}
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
              Read program format{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-4 border-l-2 border-accent-blue/40 bg-accent-blue/[0.035] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Compare every path by audience, commitment, selection, status, and expected output before
          deciding whether to apply.
        </p>
        <Link
          to="/programs-public"
          className="inline-flex min-h-11 shrink-0 items-center text-sm text-bone transition hover:text-accent-blue"
        >
          Compare all program paths →
        </Link>
      </div>
    </SectionShell>
  );
}
