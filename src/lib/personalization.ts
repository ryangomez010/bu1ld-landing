import { getAllGuides } from "@/content/guides";
import { matchingTags } from "@/lib/interest";
import { fetchEvents, fetchNewsletters, fetchPapers } from "@/lib/content";
import { interestScore } from "@/lib/search";
import { fetchJobs, fetchProjects } from "@/lib/projects";

export type ForYouItem = {
  type: string;
  title: string;
  summary: string;
  href: string;
  score: number;
  matchTags: string[];
};

type ScoredItem = ForYouItem & { slug: string };

function scoreItem(
  type: string,
  title: string,
  summary: string,
  href: string,
  slug: string,
  tags: string[],
  interests: string[],
): ScoredItem {
  return {
    type,
    title,
    summary,
    href,
    slug,
    score: interestScore(tags, interests),
    matchTags: matchingTags(tags, interests),
  };
}

export async function buildForYouFeed(
  interests: string[],
  opts?: { excludeSlugs?: Set<string> },
): Promise<ForYouItem[]> {
  if (!interests.length) return [];

  const [events, papers, projects, jobs, newsletters] = await Promise.all([
    fetchEvents(),
    fetchPapers(),
    fetchProjects("open"),
    fetchJobs(),
    fetchNewsletters(),
  ]);
  const guides = getAllGuides();
  const exclude = opts?.excludeSlugs ?? new Set<string>();

  const items: ScoredItem[] = [
    ...events.map((e) =>
      scoreItem(
        "event",
        e.title,
        e.summary ?? "Conference radar",
        `/events/${e.slug}`,
        e.slug,
        e.topics,
        interests,
      ),
    ),
    ...papers.map((p) =>
      scoreItem(
        "paper",
        p.title,
        p.summary ?? "Paper review",
        `/papers/${p.slug}`,
        p.slug,
        p.tags,
        interests,
      ),
    ),
    ...projects.map((p) =>
      scoreItem(
        "project",
        p.title,
        p.description.slice(0, 120),
        `/projects/${p.slug}`,
        p.slug,
        [...p.tags, ...p.skills_needed],
        interests,
      ),
    ),
    ...jobs.map((j) =>
      scoreItem(
        "job",
        j.title,
        `${j.company} — ${j.tags.join(", ")}`,
        `/jobs/${j.slug}`,
        j.slug,
        j.tags,
        interests,
      ),
    ),
    ...guides.map((g) =>
      scoreItem("guide", g.title, g.description, `/guides/${g.slug}`, g.slug, g.tags, interests),
    ),
    ...newsletters.map((n) =>
      scoreItem(
        "newsletter",
        n.title,
        n.summary ?? "Newsletter issue",
        `/newsletter/${n.slug}`,
        n.slug,
        ["newsletter"],
        interests,
      ),
    ),
  ];

  return items
    .filter((i) => i.score > 0 && !exclude.has(`${i.type}:${i.slug}`))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ slug: _slug, ...rest }) => rest);
}
