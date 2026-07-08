import { getAllGuides } from "@/content/guides";
import { fetchEvents, fetchPapers } from "@/lib/content";
import { interestScore } from "@/lib/search";
import { fetchJobs, fetchProjects } from "@/lib/projects";

export type ForYouItem = {
  type: string;
  title: string;
  summary: string;
  href: string;
  score: number;
};

type ScoredItem = ForYouItem & { slug: string };

export async function buildForYouFeed(
  interests: string[],
  opts?: { excludeSlugs?: Set<string> },
): Promise<ForYouItem[]> {
  if (!interests.length) return [];

  const [events, papers, projects, jobs] = await Promise.all([
    fetchEvents(),
    fetchPapers(),
    fetchProjects("open"),
    fetchJobs(),
  ]);
  const guides = getAllGuides();
  const exclude = opts?.excludeSlugs ?? new Set<string>();

  const items: ScoredItem[] = [
    ...events.map((e) => ({
      type: "event",
      title: e.title,
      summary: e.summary ?? "Conference radar",
      href: `/events/${e.slug}`,
      score: interestScore(e.topics, interests),
      slug: e.slug,
    })),
    ...papers.map((p) => ({
      type: "paper",
      title: p.title,
      summary: p.summary ?? "Paper review",
      href: `/papers/${p.slug}`,
      score: interestScore(p.tags, interests),
      slug: p.slug,
    })),
    ...projects.map((p) => ({
      type: "project",
      title: p.title,
      summary: p.description.slice(0, 120),
      href: `/projects/${p.slug}`,
      score: interestScore([...p.tags, ...p.skills_needed], interests),
      slug: p.slug,
    })),
    ...jobs.map((j) => ({
      type: "job",
      title: j.title,
      summary: `${j.company} — ${j.tags.join(", ")}`,
      href: `/jobs/${j.slug}`,
      score: interestScore(j.tags, interests),
      slug: j.slug,
    })),
    ...guides.map((g) => ({
      type: "guide",
      title: g.title,
      summary: g.description,
      href: `/guides/${g.slug}`,
      score: interestScore(g.tags, interests),
      slug: g.slug,
    })),
  ];

  return items
    .filter((i) => i.score > 0 && !exclude.has(`${i.type}:${i.slug}`))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ slug: _slug, ...rest }) => rest);
}
