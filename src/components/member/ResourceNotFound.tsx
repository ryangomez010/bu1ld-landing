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
