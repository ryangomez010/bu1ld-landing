import type { GuideSection } from "@/lib/types";
import { guideHeadingId } from "@/lib/guide-heading";

export function GuideSectionView({ section, index }: { section: GuideSection; index: number }) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          id={guideHeadingId(section.text, index)}
          className="font-display text-2xl text-bone mt-10 tracking-tight scroll-mt-24"
        >
          {section.text}
        </h2>
      );
    case "p":
      return <p className="text-muted-foreground leading-relaxed">{section.text}</p>;
    case "answer":
      return (
        <details className="rounded-lg border border-border/60 bg-card/20 p-5">
          <summary className="cursor-pointer text-sm font-medium text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Check your answer
          </summary>
          <p className="mt-4 text-muted-foreground leading-relaxed">{section.text}</p>
        </details>
      );
    case "list":
      return (
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "diagram":
      return (
        <div className="rounded-sm border border-border/60 bg-card/30 p-5 font-mono text-xs text-bone/80 overflow-x-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            {section.title}
          </p>
          <pre className="whitespace-pre leading-relaxed">{section.lines.join("\n")}</pre>
        </div>
      );
    case "callout":
      return (
        <div className="rounded-sm border border-accent-blue/30 bg-accent-blue/5 px-5 py-4 text-sm text-foreground/90 border-l-2 border-l-accent-blue">
          {section.text}
        </div>
      );
    default:
      return null;
  }
}
