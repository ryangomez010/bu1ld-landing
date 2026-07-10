import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

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
  return (
    <div className="panel panel-interactive group relative flex flex-col rounded-sm p-6 overflow-hidden">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-blue/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
      <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-accent-blue">
        {tag}
      </span>
      <h3 className="font-display text-xl text-bone mt-3 tracking-tight group-hover:text-accent-blue transition-colors duration-300">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{body}</p>
      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] uppercase text-bone/80 group-hover:text-accent-blue transition-colors duration-300"
      >
        {cta}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  );
}
