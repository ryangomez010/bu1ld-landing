import { estimateReadMinutes } from "@/lib/read-time";
import type { Paper } from "@/lib/types";

export type ReviewSection = {
  id: string;
  title: string;
  content: string;
  variant?: "default" | "build";
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseReviewSections(reviewBody: string): ReviewSection[] {
  const chunks = reviewBody
    .split(/\n(?=## )/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (!chunks.length) return [];

  return chunks.map((chunk) => {
    const lines = chunk.split("\n");
    const first = lines[0] ?? "";
    if (first.startsWith("## ")) {
      const title = first.slice(3).trim();
      const content = lines.slice(1).join("\n").trim();
      const variant = /build/i.test(title) ? "build" : "default";
      return { id: slugify(title), title, content, variant };
    }
    return { id: "overview", title: "Overview", content: chunk };
  });
}

export function paperReadMinutes(paper: Paper): number {
  return estimateReadMinutes(`${paper.summary ?? ""} ${paper.review_body}`);
}

export function sortPapersForLibrary(papers: Paper[]): Paper[] {
  return [...papers].sort((a, b) => {
    if (a.is_classic !== b.is_classic) return a.is_classic ? -1 : 1;
    const yearA = a.year ?? 0;
    const yearB = b.year ?? 0;
    if (yearA !== yearB) return yearB - yearA;
    return b.published_at.localeCompare(a.published_at);
  });
}

export function paperNeighbors(
  papers: Paper[],
  slug: string,
): { prev: Paper | null; next: Paper | null } {
  const sorted = sortPapersForLibrary(papers);
  const idx = sorted.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? sorted[idx - 1]! : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1]! : null,
  };
}

export function pickFeaturedPaper(papers: Paper[], readSlugs: Set<string>): Paper | null {
  const sorted = sortPapersForLibrary(papers);
  const unreadClassic = sorted.find((p) => p.is_classic && !readSlugs.has(p.slug));
  if (unreadClassic) return unreadClassic;
  const unread = sorted.find((p) => !readSlugs.has(p.slug));
  if (unread) return unread;
  return sorted[0] ?? null;
}

export function extractPullQuote(summary: string | null, sections: ReviewSection[]): string {
  if (summary?.trim()) return summary.trim();
  const why = sections.find((s) => /why|intuition|problem/i.test(s.title));
  if (why?.content) {
    const firstPara = why.content.split(/\n\n+/)[0]?.replace(/\*\*/g, "");
    if (firstPara) return firstPara.slice(0, 220) + (firstPara.length > 220 ? "…" : "");
  }
  return "";
}
