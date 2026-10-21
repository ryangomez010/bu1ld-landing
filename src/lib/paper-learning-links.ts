import { getGuideSummary } from "@/content/guides";

/** Resolve only actual public lessons, preserving the author's prerequisite order. */
export function paperLearningLinks(slugs: readonly string[] = []) {
  return [...new Set(slugs)].flatMap((slug) => {
    const guide = getGuideSummary(slug);
    return guide ? [guide] : [];
  });
}
