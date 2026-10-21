import { getAllGuides } from "@/content/guides";
import { PUBLIC_RESEARCH_PORTFOLIO } from "@/data/research-portfolio";
import { INSTITUTION_PROGRAMS } from "@/data/institution";
import { publicEvents, publicPapers } from "@/lib/public-library";
import type { SearchResult } from "@/lib/types";

/** Public projection only: no applications, reviewer notes or unpublished drafts. */
export async function publicSearchIndex(): Promise<{
  records: SearchResult[];
  unavailable: string[];
}> {
  const [events, papers] = await Promise.all([publicEvents(), publicPapers()]);
  return {
    unavailable: [
      events.state !== "ready" ? "events" : "",
      papers.state !== "ready" ? "paper reviews" : "",
    ].filter(Boolean),
    records: [
      ...PUBLIC_RESEARCH_PORTFOLIO.map((p) => ({
        type: "project" as const,
        slug: p.slug,
        title: p.title,
        summary: `${p.summary} ${p.publicStatus}`,
        href: `/research-atlas/${p.slug}`,
        tags: p.tags,
      })),
      ...getAllGuides().map((g) => ({
        type: "guide" as const,
        slug: g.slug,
        title: g.title,
        summary: g.description,
        href: `/guides/${g.slug}`,
        tags: g.tags,
      })),
      ...INSTITUTION_PROGRAMS.map((p) => ({
        type: "job" as const,
        slug: p.slug,
        title: p.name,
        summary: `${p.summary} Interest and preparation; dates and capacity require confirmation.`,
        href: `/programs-public#${p.slug}`,
        tags: [p.kind],
      })),
      ...events.records.map((e) => ({
        type: "event" as const,
        slug: e.slug,
        title: e.title,
        summary: e.summary ?? "",
        href: `/events/${e.slug}`,
        tags: e.topics,
      })),
      ...papers.records.map((p) => ({
        type: "paper" as const,
        slug: p.slug,
        title: p.title,
        summary: p.summary ?? "",
        href: `/papers/${p.slug}`,
        tags: p.tags,
      })),
    ],
  };
}
