import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";

import { SectionShell } from "@/components/landing/Section";
import { STARTUPS, stageColor } from "@/data/landing";

export function StartupsSection() {
  const reduce = useReducedMotion();

  return (
    <SectionShell
      id="startups"
      eyebrow="05"
      label="applied work"
      title="Research earns its next step."
      subtitle="Open projects, incubation, and evidence — not a fake portfolio of unnamed startups."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 border border-border/40">
        {STARTUPS.map((s, i) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase px-2.5 py-1 border rounded-sm ${stageColor[s.stage]}`}
                >
                  <span className="h-1 w-1 rounded-full bg-current" />
                  {s.stage}
                </span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-bone/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-2xl mt-6 text-bone tracking-tight">{s.name}</h3>
              <p className="mt-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
                {s.domain}
              </p>
              <p className="mt-5 text-sm text-foreground/75 leading-relaxed">{s.thesis}</p>
              <div className="mt-6 h-px w-8 bg-bone/20 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
            </>
          );
          const className =
            "p-8 bg-background/75 backdrop-blur-md hover:bg-background/40 transition group relative block";

          if (reduce) {
            return (
              <Link key={s.name} to={s.href} className={className}>
                {inner}
              </Link>
            );
          }
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
            >
              <Link to={s.href} className={className}>
                {inner}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}
