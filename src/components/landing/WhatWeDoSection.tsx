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
            Research that leaves{" "}
            <span className="text-accent-blue text-glow-blue">the benchmark.</span>
          </h2>
          <div className="md:col-span-7 space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              Most labs optimize for publication. Most startups optimize for retention. The Bu1ld
              runs both cycles in parallel — the same people read a paper, build a prototype, and
              decide whether the idea survives contact with real data and real users.
            </p>
            <p>
              Work is organized around <span className="text-bone">research threads</span>, not
              departments. A thread might start as a member paper review, become an open project
              with a capacity limit and application queue, and graduate into a startup with its own
              repo and demo day. Every thread is reviewed against two criteria: is the science
              honest, and does the engineering hold up under load.
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
              Create your member account →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
