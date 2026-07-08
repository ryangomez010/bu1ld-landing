import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { Wordmark } from "@/components/Wordmark";
import { SectionLabel } from "@/components/landing/Section";
import { STATS } from "@/data/landing";

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center overflow-hidden pt-32 scanline"
    >
      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <div className="absolute top-24 right-6 hidden md:flex flex-col items-end gap-1 font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40">
          <span>lat 37.4275° N</span>
          <span>lng 122.1697° W</span>
          <span>cycle 2026.Q2</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.15 }}
          className="max-w-5xl"
        >
          <SectionLabel id="00">a machine learning institution</SectionLabel>
          <h1 className="font-display font-bold mt-8 text-[clamp(2.8rem,8.2vw,7.8rem)] leading-[0.9] tracking-[-0.035em]">
            <Wordmark />
            <span className="block text-foreground/90 mt-5">
              Where alternative intelligence
              <br className="hidden md:block" />
              becomes{" "}
              <span className="italic text-bone relative">
                real systems.
                <span className="caret-blink" />
              </span>
            </span>
          </h1>
          <p className="mt-10 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            The Bu1ld is a hub for startups, research, and exploration in machine learning — doing
            things differently this time. Researchers, engineers, and founders collaborate with
            academic partners while building useful products, testing hard ideas, and moving from
            prototypes to production.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-sm bg-bone text-background font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-accent-blue transition glow-bone"
            >
              Become a member{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#research"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-sm border border-bone/25 font-mono text-[11px] tracking-[0.3em] uppercase hover:border-bone hover:bg-bone/5 transition"
            >
              Explore research
            </a>
          </div>
        </motion.div>

        <div className="mt-28 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 border border-border/40 backdrop-blur-md">
          {STATS.map(([n, l], idx) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + idx * 0.08 }}
              className="bg-background/70 p-6 group hover:bg-background/40 transition"
            >
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40">
                0{idx + 1}
              </div>
              <div className="font-display text-2xl md:text-3xl text-bone mt-3 tracking-tight">
                {n}
              </div>
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-2">
                {l}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40">
          <span>scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-bone/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
