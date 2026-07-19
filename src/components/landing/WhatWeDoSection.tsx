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
            Work that leaves{" "}
            <span className="text-accent-blue text-glow-blue">an accountable record.</span>
          </h2>
          <div className="md:col-span-7 space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              The Bu1ld is built for the handoff between understanding and making. Members read a
              paper closely, frame a narrow question, build the smallest useful test, and keep the
              result legible to the next person who touches the work.
            </p>
            <p>
              Work is organized around{" "}
              <span className="text-bone">scoped research and building threads</span>, not vague
              networking. A useful thread has a question, a named owner, an explicit contribution
              need, and a next decision. Projects can hold private applications and internal
              evidence; public material is published only when it is ready to stand on its own.
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
              to="/projects"
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue hover:text-bone transition pt-2"
            >
              Browse scoped projects →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
