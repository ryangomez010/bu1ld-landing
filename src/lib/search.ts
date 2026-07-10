import { getAllGuides } from "@/content/guides";
import { fetchEvents, fetchNewsletters, fetchPapers } from "@/lib/content";
import { fetchJobs, fetchProjects } from "@/lib/projects";
import type { SearchResult } from "@/lib/types";

export async function buildSearchIndex(): Promise<SearchResult[]> {
  const [events, papers, projects, jobs, newsletters] = await Promise.all([
    fetchEvents(),
    fetchPapers(),
    fetchProjects(),
    fetchJobs(),
    fetchNewsletters(),
  ]);

  const guides = getAllGuides();

  const results: SearchResult[] = [
    ...events.map((e) => ({
      type: "event" as const,
      slug: e.slug,
      title: e.title,
      summary: e.summary ?? "",
      href: `/events/${e.slug}`,
      tags: e.topics,
    })),
    ...papers.map((p) => ({
      type: "paper" as const,
      slug: p.slug,
      title: p.title,
      summary: p.summary ?? "",
      href: `/papers/${p.slug}`,
      tags: p.tags,
    })),
    ...projects.map((p) => ({
      type: "project" as const,
      slug: p.slug,
      title: p.title,
      summary: p.description.slice(0, 160),
      href: `/projects/${p.slug}`,
      tags: [...p.tags, ...p.skills_needed],
    })),
    ...jobs.map((j) => ({
      type: "job" as const,
      slug: j.slug,
      title: j.title,
      summary: `${j.company} — ${j.description.slice(0, 120)}`,
      href: `/jobs/${j.slug}`,
      tags: j.tags,
    })),
    ...guides.map((g) => ({
      type: "guide" as const,
      slug: g.slug,
      title: g.title,
      summary: g.description,
      href: `/guides/${g.slug}`,
      tags: g.tags,
    })),
    ...newsletters.map((n) => ({
      type: "newsletter" as const,
      slug: n.slug,
      title: n.title,
      summary: n.summary ?? "",
      href: `/newsletter/${n.slug}`,
      tags: ["newsletter"],
    })),
  ];

  return results;
}

export function searchIndex(items: SearchResult[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      const title = item.title.toLowerCase();
      const haystack = [item.title, item.summary, ...item.tags].join(" ").toLowerCase();
      let score = 0;

      if (title === q) score += 20;
      else if (title.startsWith(q)) score += 12;
      else if (title.includes(q)) score += 10;

      if (haystack.includes(q)) score += 5;

      for (const token of tokens) {
        if (title.includes(token)) score += 4;
        if (item.tags.some((t) => t.toLowerCase().includes(token))) score += 3;
        if (item.summary.toLowerCase().includes(token)) score += 1;
      }

      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

export function interestScore(itemTags: string[], interests: string[]): number {
  if (!interests.length || !itemTags.length) return 0;
  const normalized = interests.map((i) => i.toLowerCase());
  return itemTags.reduce((acc, tag) => {
    const t = tag.toLowerCase();
    if (normalized.some((i) => t.includes(i) || i.includes(t))) return acc + 1;
    return acc;
  }, 0);
}
