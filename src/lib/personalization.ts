import { getAllGuides } from "@/content/guides";
import { matchingTags } from "@/lib/interest";
import { fetchEvents, fetchNewsletters, fetchPapers } from "@/lib/content";
import { nearestDeadline } from "@/lib/date";
import { fetchJobs, fetchProjects } from "@/lib/projects";
import type { Job, MlEvent, NewsletterIssue, Paper, Project } from "@/lib/types";

export type ForYouFeedSources = {
  events: MlEvent[];
  papers: Paper[];
  projects: Project[];
  jobs: Job[];
  newsletters: NewsletterIssue[];
};

export type ForYouItem = {
  type: string;
  title: string;
  summary: string;
  href: string;
  score: number;
  matchTags: string[];
  reason: string;
};

type ScoredItem = ForYouItem & { slug: string };

const TYPE_BOOST: Record<string, number> = {
  project: 3,
  event: 2,
  guide: 1,
  paper: 1,
  job: 1,
  newsletter: 0,
};

function buildReason(
  type: string,
  matchTags: string[],
  extras: { deadlineDays?: number | null; isOpen?: boolean },
): string {
  const parts: string[] = [];
  if (matchTags.length) {
    parts.push(`Matches ${matchTags.slice(0, 2).join(", ")}`);
  }
  if (type === "project" && extras.isOpen) {
    parts.push("Open for applications");
  }
  if (type === "event" && extras.deadlineDays != null && extras.deadlineDays >= 0) {
    parts.push(
      extras.deadlineDays === 0 ? "Deadline today" : `Deadline in ${extras.deadlineDays}d`,
    );
  }
  if (!parts.length) {
    return type === "newsletter" ? "Latest community digest" : "Suggested from open listings";
  }
  return parts.join(" · ");
}

function scoreTags(tags: string[], interests: string[]): { score: number; matches: string[] } {
  if (!interests.length || !tags.length) return { score: 0, matches: [] };
  const normalized = interests.map((i) => i.toLowerCase());
  let score = 0;
  const matches: string[] = [];

  for (const tag of tags) {
    const t = tag.toLowerCase();
    for (const interest of normalized) {
      if (t === interest) {
        score += 4;
        matches.push(tag);
        break;
      }
      if (t.includes(interest) || interest.includes(t)) {
        score += 2;
        matches.push(tag);
        break;
      }
    }
  }

  return { score, matches: [...new Set(matches)] };
}

function scoreItem(
  type: string,
  title: string,
  summary: string,
  href: string,
  slug: string,
  tags: string[],
  interests: string[],
  extras: { deadlineDays?: number | null; isOpen?: boolean } = {},
): ScoredItem {
  const { score: tagScore, matches } = scoreTags(tags, interests);
  const boost = TYPE_BOOST[type] ?? 0;
  let score = tagScore + boost;

  if (type === "event" && extras.deadlineDays != null && extras.deadlineDays >= 0) {
    if (extras.deadlineDays <= 7) score += 3;
    else if (extras.deadlineDays <= 21) score += 1;
  }
  if (type === "project" && extras.isOpen) score += 2;

  const matchTags = matches.length ? matches : matchingTags(tags, interests);

  return {
    type,
    title,
    summary,
    href,
    slug,
    score,
    matchTags,
    reason: buildReason(type, matchTags, extras),
  };
}

export async function buildForYouFeed(
  interests: string[],
  opts?: { excludeSlugs?: Set<string>; sources?: ForYouFeedSources },
): Promise<ForYouItem[]> {
  if (!interests.length) return [];

  const defaultSources = await Promise.all([
    fetchEvents(),
    fetchPapers(),
    fetchProjects("open"),
    fetchJobs(),
    fetchNewsletters(),
  ]).then(([events, papers, projects, jobs, newsletters]) => ({
    events,
    papers,
    projects,
    jobs,
    newsletters,
  }));

  const sources = opts?.sources ?? defaultSources;

  const { events, papers, projects, jobs, newsletters } = sources;
  const guides = getAllGuides();
  const exclude = opts?.excludeSlugs ?? new Set<string>();

  const items: ScoredItem[] = [
    ...events.map((e) => {
      const next = nearestDeadline(e.deadlines);
      return scoreItem(
        "event",
        e.title,
        e.summary ?? "Conference radar",
        `/events/${e.slug}`,
        e.slug,
        e.topics,
        interests,
        { deadlineDays: next?.days ?? null },
      );
    }),
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
        { isOpen: p.status === "open" },
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

/** Rank open projects by interest overlap for the projects index. */
export function recommendProjects(
  projects: Awaited<ReturnType<typeof fetchProjects>>,
  interests: string[],
  opts?: { excludeIds?: Set<string>; limit?: number },
): Array<{ project: (typeof projects)[0]; score: number; matchTags: string[]; reason: string }> {
  if (!interests.length) return [];
  const exclude = opts?.excludeIds ?? new Set<string>();
  const limit = opts?.limit ?? 3;

  return projects
    .filter((p) => p.status === "open" && !exclude.has(p.id))
    .map((p) => {
      const { score, matches } = scoreTags([...p.tags, ...p.skills_needed], interests);
      return {
        project: p,
        score: score + (TYPE_BOOST.project ?? 0),
        matchTags: matches,
        reason: buildReason("project", matches, { isOpen: true }),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Trending content for empty search — open projects + imminent deadlines. */
export async function getTrendingBrowse(): Promise<
  Array<{
    type: string;
    slug: string;
    title: string;
    summary: string;
    href: string;
    badge?: string;
  }>
> {
  const [events, projects, papers] = await Promise.all([
    fetchEvents(),
    fetchProjects("open"),
    fetchPapers(),
  ]);

  const trending: Array<{
    type: string;
    slug: string;
    title: string;
    summary: string;
    href: string;
    badge?: string;
    sortKey: number;
  }> = [];

  for (const e of events) {
    const next = nearestDeadline(e.deadlines);
    if (!next || next.days == null || next.days > 30) continue;
    trending.push({
      type: "event",
      slug: e.slug,
      title: e.title,
      summary: e.summary ?? "",
      href: `/events/${e.slug}`,
      badge: next.days === 0 ? "Due today" : `${next.days}d left`,
      sortKey: next.days,
    });
  }

  for (const p of projects.filter((x) => x.status === "open").slice(0, 4)) {
    trending.push({
      type: "project",
      slug: p.slug,
      title: p.title,
      summary: p.description.slice(0, 120),
      href: `/projects/${p.slug}`,
      badge: `${p.capacity - p.team_count} slots`,
      sortKey: 100 + p.team_count,
    });
  }

  for (const p of papers.slice(0, 3)) {
    trending.push({
      type: "paper",
      slug: p.slug,
      title: p.title,
      summary: p.summary ?? "",
      href: `/papers/${p.slug}`,
      badge: p.is_classic ? "Classic" : "Review",
      sortKey: 200,
    });
  }

  return trending
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 8)
    .map(({ sortKey: _sortKey, ...rest }) => rest);
}
