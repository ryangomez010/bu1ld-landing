import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";

import { Wordmark } from "@/components/Wordmark";
import { SectionLabel } from "@/components/landing/Section";

export function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center overflow-hidden pt-32 scanline"
    >
      <div className="relative mx-auto max-w-7xl px-6 w-full pb-24">
        <div className="absolute top-24 right-6 hidden md:flex flex-col items-end gap-1 font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40">
          <span>independent / distributed</span>
          <span>research + building</span>
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 1.0, delay: reduce ? 0 : 0.15 }}
          className="max-w-5xl"
        >
          <SectionLabel id="00">independent machine-learning work</SectionLabel>
          <h1 className="font-display font-bold mt-8 text-[clamp(2.8rem,8.2vw,7.8rem)] leading-[0.9] tracking-[-0.035em]">
            <Wordmark />
            <span className="block text-foreground/90 mt-5">
              Research threads, prototypes,
              <br className="hidden md:block" />
              and{" "}
              <span className="italic text-bone relative">
                evidence you can inspect.
                <span className="caret-blink" />
              </span>
            </span>
          </h1>
          <p className="mt-10 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            The Bu1ld is an independent membership platform for people who want machine-learning
            work to leave a trace: a careful reading, a reproducible experiment, a working
            prototype, or a candid record of what did not hold up.
          </p>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground/90">
            Members can study papers by field and difficulty, apply to scoped projects, record
            contributions against milestones, follow confirmed events, and find collaborators by
            relevant experience—not by a social feed.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-sm bg-bone text-background font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-accent-blue active:scale-[0.98] transition-all duration-200 glow-bone"
            >
              Become a member{" "}
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#research"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-sm border border-bone/25 font-mono text-[11px] tracking-[0.3em] uppercase hover:border-bone/50 hover:bg-bone/5 active:scale-[0.98] transition-all duration-200"
            >
              See the working model
            </a>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40">
          <span>scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-bone/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
