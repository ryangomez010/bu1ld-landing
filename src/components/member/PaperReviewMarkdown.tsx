import type { ReactNode } from "react";

import { INSTITUTION_TAKE } from "@/data/copy";
import { safeHref } from "@/lib/urls";
import type { ReviewSection } from "@/lib/paper-review";
import { cn } from "@/lib/utils";

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g).filter(Boolean);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="text-bone font-medium">
          {bold[1]}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={i}>{link[1]}</span>;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent-blue hover:text-bone underline-offset-2 hover:underline"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownTable({ block }: { block: string }) {
  const rows = block
    .trim()
    .split("\n")
    .filter((line) => line.includes("|"));
  if (rows.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);

  const header = parseRow(rows[0]!);
  const bodyRows = rows.slice(2).map(parseRow);

  return (
    <div className="overflow-x-auto rounded-sm border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-bone/5">
            {header.map((cell) => (
              <th
                key={cell}
                className="px-4 py-3 text-left font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} className="border-b border-border/40 last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-muted-foreground">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownBlock({ block, index }: { block: string; index: number }) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("```")) {
    const code = trimmed.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
    return (
      <pre
        key={index}
        className="overflow-x-auto rounded-sm border border-border/60 bg-card/40 p-4 font-mono text-xs text-bone/85"
      >
        <code>{code}</code>
      </pre>
    );
  }

  if (trimmed.includes("|") && trimmed.split("\n").some((l) => l.includes("|"))) {
    return <MarkdownTable key={index} block={trimmed} />;
  }

  if (trimmed.startsWith("## ")) {
    const title = trimmed.slice(3).split("\n")[0] ?? "";
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return (
      <h2
        key={index}
        id={id}
        className="font-display text-2xl text-bone mt-10 tracking-tight scroll-mt-28"
      >
        {title}
      </h2>
    );
  }

  if (trimmed.startsWith("# ")) {
    return (
      <h1 key={index} className="font-display text-3xl text-bone tracking-tight">
        {trimmed.slice(2)}
      </h1>
    );
  }

  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    const items = trimmed.split("\n").map((l) => l.replace(/^[-*] /, ""));
    return (
      <ul key={index} className="list-disc pl-5 space-y-2 text-muted-foreground">
        {items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }

  if (/^\d+\. /.test(trimmed)) {
    const items = trimmed.split("\n").map((l) => l.replace(/^\d+\. /, ""));
    return (
      <ol key={index} className="list-decimal pl-5 space-y-2 text-muted-foreground">
        {items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ))}
      </ol>
    );
  }

  if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.includes("\n")) {
    return (
      <blockquote
        key={index}
        className="text-base italic text-bone/90 border-l-2 border-accent-blue/50 pl-5 py-1"
      >
        {trimmed.slice(1, -1)}
      </blockquote>
    );
  }

  return (
    <p key={index} className="text-muted-foreground leading-relaxed">
      {renderInline(trimmed)}
    </p>
  );
}

export function PaperReviewMarkdown({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/);
  return (
    <div className="prose-build space-y-5 text-foreground/90">
      {blocks.map((block, i) => (
        <MarkdownBlock key={i} block={block} index={i} />
      ))}
    </div>
  );
}

export function PaperReviewSection({ section }: { section: ReviewSection }) {
  return (
    <section id={section.id} className="scroll-mt-28">
      {section.id !== "overview" ? (
        <h2 className="font-display text-xl md:text-2xl text-bone mt-12 mb-5 tracking-tight border-t border-border/40 pt-10 first:border-0 first:pt-0 first:mt-0">
          {section.title}
        </h2>
      ) : null}
      {section.variant === "build" ? (
        <div className="border-l-2 border-accent-green/50 pl-5 md:pl-6">
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-green mb-4">
            {INSTITUTION_TAKE}
          </p>
          <PaperReviewMarkdown body={section.content} />
        </div>
      ) : (
        <PaperReviewMarkdown body={section.content} />
      )}
    </section>
  );
}

export function PaperReviewBody({ sections }: { sections: ReviewSection[] }) {
  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <PaperReviewSection key={section.id} section={section} />
      ))}
    </div>
  );
}
