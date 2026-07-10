import type { ReactNode } from "react";

export function ResourceNotFound({
  title,
  body,
  backTo,
  backLabel = "Go back",
}: {
  title: string;
  body: string;
  backTo: string;
  backLabel?: string;
}) {
  return (
    <div className="rounded-sm border border-dashed border-border/60 p-12 text-center">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-red">not found</p>
      <h2 className="font-display text-2xl text-bone mt-4">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
      <a
        href={backTo}
        className="mt-6 inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone transition"
      >
        {backLabel}
      </a>
    </div>
  );
}

export function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-blue/25 text-bone rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
