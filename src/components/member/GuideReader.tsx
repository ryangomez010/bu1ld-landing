import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { Button } from "@/components/ui/button";
import { getAllGuides } from "@/content/guides";
import { saveReadingProgress } from "@/lib/reading-progress";
import type { Guide, GuideSection } from "@/lib/types";
import { cn } from "@/lib/utils";

function GuideSectionView({ section }: { section: GuideSection }) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          id={section.text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          className="font-display text-2xl text-bone mt-10 tracking-tight scroll-mt-24"
        >
          {section.text}
        </h2>
      );
    case "p":
      return <p className="text-muted-foreground leading-relaxed">{section.text}</p>;
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

export function GuideReader({
  guide,
  userId,
  initialProgress = 0,
}: {
  guide: Guide;
  userId: string;
  initialProgress?: number;
}) {
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 100;
      setProgress(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void saveReadingProgress(userId, guide.slug, progress);
    }, 500);
    return () => clearTimeout(t);
  }, [progress, userId, guide.slug]);

  const all = getAllGuides();
  const idx = all.findIndex((g) => g.slug === guide.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const toc = guide.sections.filter((s) => s.type === "h2") as Extract<
    GuideSection,
    { type: "h2" }
  >[];

  return (
    <>
      <div className="fixed top-[2px] left-0 right-0 z-[70] h-px bg-border/60">
        <div
          className="h-full bg-bone/80 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="max-w-2xl pb-24">
        <header className="border-l-2 border-bone/25 pl-6 md:pl-8">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            {guide.readMinutes} min read · reference guide
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-bone mt-4 tracking-tight leading-[1.1]">
            {guide.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SaveToCollectionButton
              itemType="guide"
              itemSlug={guide.slug}
              itemTitle={guide.title}
            />
            <Link
              to="/research"
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Reading paths →
            </Link>
          </div>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{guide.description}</p>
        </header>

        {toc.length > 1 ? (
          <nav className="mt-6 rounded-sm border border-border/60 bg-background/50 p-4">
            <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              On this page
            </p>
            <ul className="space-y-2">
              {toc.map((section) => (
                <li key={section.text}>
                  <a
                    href={`#${section.text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-bone transition"
                  >
                    {section.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="divider-grad my-8" />
        <div className="prose-build space-y-4">
          {guide.sections.map((section, i) => (
            <GuideSectionView key={i} section={section} />
          ))}
        </div>
        <div
          className={cn(
            "mt-12 rounded-sm border px-5 py-4 text-center",
            progress >= 95
              ? "border-accent-green/40 bg-accent-green/5"
              : "border-border/60 text-muted-foreground",
          )}
        >
          {progress >= 95 ? (
            <div className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-green">
                {progress >= 100 ? "Guide complete" : "Almost done — mark complete?"}
              </p>
              {progress < 100 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setProgress(100);
                    void saveReadingProgress(userId, guide.slug, 100).then(() => {
                      toast.success("Guide marked complete.");
                    });
                  }}
                  className="font-mono text-[9px] tracking-[0.2em] uppercase"
                >
                  Mark complete
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase">
              Scroll progress saves automatically
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-border/60 pt-6">
          {prev ? (
            <Link
              to={`/guides/${prev.slug}`}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone max-w-[45%]"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/guides/${next.slug}`}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone max-w-[45%] text-right"
            >
              {next.title} →
            </Link>
          ) : null}
        </div>
      </article>
    </>
  );
}
