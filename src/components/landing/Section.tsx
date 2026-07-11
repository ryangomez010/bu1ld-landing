export function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="label-sm text-muted-foreground flex items-center gap-3">
      <span className="h-px w-8 bg-gradient-to-r from-bone/40 to-transparent" />
      <span className="text-bone/70 tabular-nums">{id}</span>
      <span className="text-bone/25">/</span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

export function SectionShell({
  id,
  eyebrow,
  label,
  title,
  subtitle,
  children,
}: {
  id: string;
  eyebrow: string;
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="relative py-28 md:py-36 border-t border-border/60 bg-background/50 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel id={eyebrow}>{label}</SectionLabel>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl md:text-6xl tracking-[-0.025em] leading-[1.0] max-w-3xl text-bone">
            {title}
          </h2>
          {subtitle ? (
            <p className="max-w-md text-muted-foreground leading-relaxed text-[15px]">{subtitle}</p>
          ) : null}
        </div>
        <div className="divider-grad mt-10" />
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
