import { motion } from "framer-motion";

import { SectionShell } from "@/components/landing/Section";
import { RESEARCH, dotColor, hoverGlow, textAccent } from "@/data/landing";

export function ResearchSection() {
  return (
    <SectionShell
      id="research"
      eyebrow="03"
      label="research threads"
      title="Threads we are pulling on."
      subtitle="These are the ideas we keep coming back to: uncomfortable questions, weird edge cases, and the failure modes that matter once models leave the benchmark."
    >
      <div className="grid md:grid-cols-2 gap-px bg-border/40 border border-border/40">
        {RESEARCH.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className={`group relative p-10 bg-background/70 backdrop-blur-md ${hoverGlow[r.color]} transition-all duration-500 overflow-hidden`}
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-6 font-display font-bold text-[8.5rem] leading-none opacity-[0.06] group-hover:opacity-20 transition-opacity duration-700 ${textAccent[r.color]}`}
            >
              {r.id}
            </div>
            <div className="flex items-start justify-between gap-4">
              <span
                className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textAccent[r.color]} flex items-center gap-2`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor(r.color)}`} />
                thread / {r.id}
              </span>
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
                open
              </span>
            </div>
            <h3 className="font-display text-2xl md:text-[1.85rem] mt-8 text-bone leading-[1.1] tracking-tight relative">
              {r.name}
            </h3>
            <p className="mt-5 text-muted-foreground leading-relaxed relative">{r.desc}</p>
            <div className="mt-8 h-px w-12 bg-bone/30 group-hover:w-24 group-hover:bg-bone transition-all duration-500" />
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
