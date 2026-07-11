import { SectionLabel } from "@/components/landing/Section";
import { FAQ } from "@/data/landing";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative py-28 md:py-36 border-t border-border/60 bg-background/50 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel id="07">faq</SectionLabel>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl md:text-6xl tracking-[-0.025em] leading-[1.0] max-w-3xl text-bone">
            A few things people ask right away.
          </h2>
          <p className="max-w-xl text-muted-foreground leading-relaxed">
            Answers about who belongs here, how applications work, and what you get access to on day
            one.
          </p>
        </div>
        <div className="divider-grad mt-10" />
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className="p-8 bg-background/75 backdrop-blur-md group hover:bg-background/40 transition"
            >
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-accent-blue">
                Q.0{i + 1}
              </span>
              <h3 className="font-display text-xl mt-4 text-bone leading-tight tracking-tight">
                {item.q}
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
