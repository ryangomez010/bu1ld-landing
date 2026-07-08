import { Link } from "@tanstack/react-router";

import { SectionLabel } from "@/components/landing/Section";
import { BENEFITS } from "@/data/landing";

export function WhatWeDoSection() {
  return (
    <section
      id="what"
      className="relative py-28 md:py-36 border-t border-border/60 bg-background/50 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel id="01">what we do</SectionLabel>
        <div className="mt-10 grid md:grid-cols-12 gap-12">
          <h2 className="md:col-span-5 font-display text-4xl md:text-6xl leading-[1.0] tracking-[-0.025em] text-bone">
            A living research environment{" "}
            <span className="text-accent-blue text-glow-blue">that ships.</span>
          </h2>
          <div className="md:col-span-7 space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              Most labs publish. Most startups iterate on shipped tech. The Bu1ld sits between them
              — a single community where frontier research and production systems are built by the
              same people, on the same week, in the same room.
            </p>
            <p>
              We organize around <span className="text-bone">research threads</span>, not job
              titles. A thread may begin as a paper read on Monday, a prototype by Friday, and a
              startup pitch within a quarter. Every project is held to two standards at once:
              scientific honesty and engineering rigor.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 pt-4">
              {BENEFITS.map((item, i) => (
                <li
                  key={item}
                  className="bracket rounded-sm border border-border/60 bg-card/30 px-5 py-4 text-sm text-foreground/85 backdrop-blur-sm"
                >
                  <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40 mr-2">
                    0{i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue hover:text-bone transition pt-2"
            >
              Join the membership pool →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
