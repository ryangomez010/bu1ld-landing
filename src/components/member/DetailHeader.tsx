import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DetailHeader({
  eyebrow,
  title,
  meta,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("detail-header", className)}>
      {eyebrow ? (
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue">
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl md:text-4xl text-bone tracking-tight leading-[1.1]">
          {title}
        </h1>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        ) : null}
      </div>
      {meta ? (
        <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{meta}</div>
      ) : null}
      <div className="divider-grad mt-6 mb-8" />
    </header>
  );
}
