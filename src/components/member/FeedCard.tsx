import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function FeedCard({
  tag,
  title,
  body,
  to,
  cta,
}: {
  tag: string;
  title: string;
  body: string;
  to: string;
  cta: string;
}) {
  const reduce = useReducedMotion();
  const Wrapper = reduce ? "div" : motion.div;

  return (
    <Wrapper
      {...(!reduce
        ? {
            whileHover: { y: -2 },
            transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
          }
        : {})}
      className="panel panel-interactive group relative flex flex-col rounded-xl p-6 overflow-hidden h-full"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-blue/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
      <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-accent-blue relative z-[1]">
        {tag}
      </span>
      <h3 className="font-display text-xl text-bone mt-3 tracking-tight group-hover:text-accent-blue transition-colors duration-300 relative z-[1]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1 relative z-[1]">
        {body}
      </p>
      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] uppercase text-bone/80 group-hover:text-accent-blue transition-colors duration-300 relative z-[1]"
      >
        {cta}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </Wrapper>
  );
}
