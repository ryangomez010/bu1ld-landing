import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, FileQuestion } from "lucide-react";

export function NotFoundResource({
  title,
  body,
  backTo,
  backLabel,
  icon: Icon = FileQuestion,
}: {
  title: string;
  body: string;
  backTo: string;
  backLabel: string;
  icon?: LucideIcon;
}) {
  return (
    <div
      role="status"
      className="panel glass rounded-2xl p-10 md:p-12 text-center max-w-lg mx-auto"
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border/50 bg-bone/3 relative z-[1]">
        <Icon className="h-6 w-6 text-muted-foreground/80" aria-hidden />
      </div>
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue relative z-[1]">
        Not found
      </p>
      <h2 className="mt-3 font-display text-2xl text-bone tracking-tight relative z-[1]">
        {title}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto relative z-[1]">
        {body}
      </p>
      <Link
        to={backTo}
        className="mt-6 inline-flex items-center gap-2 rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-bone hover:border-bone/50 hover:bg-bone/5 transition relative z-[1]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {backLabel}
      </Link>
    </div>
  );
}
