import { ML_ARTICLES } from "@/content/guides/articles";
import type { GuideSummary } from "@/lib/types";

export type GuideProgressFilter = "all" | "continue" | "not_started" | "done";
export type GuideFilters = {
  query: string;
  track: string;
  level: string;
  progress: GuideProgressFilter;
};

export type GuideSearch = {
  q?: string;
  track?: string;
  level?: GuideSummary["level"];
  progress?: Exclude<GuideProgressFilter, "all">;
  limit?: number;
};

export const GUIDE_PAGE_SIZE = 24;

export function parseGuideSearch(
  search: Record<string, unknown>,
  guides: GuideSummary[],
): GuideSearch {
  const topics = new Set(guides.map((guide) => guide.track));
  const level =
    typeof search.level === "string" &&
    ["Beginner", "Intermediate", "Advanced"].includes(search.level)
      ? (search.level as GuideSummary["level"])
      : undefined;
  const progress =
    typeof search.progress === "string" &&
    ["continue", "not_started", "done"].includes(search.progress)
      ? (search.progress as GuideSearch["progress"])
      : undefined;
  const limit =
    typeof search.limit === "number" || typeof search.limit === "string"
      ? Number(search.limit)
      : NaN;
  return {
    q: typeof search.q === "string" && search.q ? search.q.slice(0, 160) : undefined,
    track: typeof search.track === "string" && topics.has(search.track) ? search.track : undefined,
    level,
    progress,
    limit:
      Number.isFinite(limit) && limit > GUIDE_PAGE_SIZE
        ? Math.min(guides.length, Math.floor(limit))
        : undefined,
  };
}

export function guideFiltersFromSearch(search: GuideSearch): GuideFilters {
  return {
    query: search.q ?? "",
    track: search.track ?? "",
    level: search.level ?? "",
    progress: search.progress ?? "all",
  };
}

export function guideLearningPaths(guides: GuideSummary[], progress: Record<string, number>) {
  const legacySlugs = new Set(ML_ARTICLES.map((guide) => guide.slug));
  const legacy = guides.filter((guide) => legacySlugs.has(guide.slug));
  const topics = Array.from(
    new Set(legacy.filter((guide) => guide.level).map((guide) => guide.track)),
  );
  return topics
    .filter((topic): topic is string => Boolean(topic))
    .map((topic) => {
      const articles = legacy.filter((guide) => guide.track === topic);
      const completed = articles.filter((guide) => (progress[guide.slug] ?? 0) >= 95).length;
      return {
        topic,
        articles,
        completed,
        readMinutes: articles.reduce((total, guide) => total + guide.readMinutes, 0),
        next: articles.find((guide) => (progress[guide.slug] ?? 0) < 95) ?? null,
      };
    });
}

export const DEFAULT_GUIDE_FILTERS: GuideFilters = {
  query: "",
  track: "",
  level: "",
  progress: "all",
};

export function filterGuides(
  guides: GuideSummary[],
  filters: GuideFilters,
  progress: Record<string, number>,
): GuideSummary[] {
  const words = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return guides.filter((guide) => {
    const pct = progress[guide.slug] ?? 0;
    if (filters.progress === "continue" && !(pct > 0 && pct < 95)) return false;
    if (filters.progress === "not_started" && pct > 0) return false;
    if (filters.progress === "done" && pct < 95) return false;
    if (filters.track && guide.track !== filters.track) return false;
    if (filters.level && guide.level !== filters.level) return false;
    const text = [guide.title, guide.description, guide.track, guide.level, ...guide.tags]
      .join(" ")
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
