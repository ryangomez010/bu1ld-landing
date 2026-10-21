import type { Guide, GuideSection, GuideSummary } from "@/lib/types";
import paths from "./curriculum-paths.json";
import newCatalog from "./curriculum-catalog.json";
import estimates from "./curriculum-estimates.json";
import { articleToGuide, type MlArticle } from "./article-format";

export const CURRICULUM_PATHS = paths;
export const CURRICULUM_ARTICLES = newCatalog as GuideSummary[];
export const CURRICULUM_LESSON_COUNT = paths.reduce((sum, path) => sum + path.lessons.length, 0);
export function curriculumEstimate(guide: GuideSummary): GuideSummary {
  const estimate = (estimates as Record<string, { wordCount: number; readMinutes: number }>)[
    guide.slug
  ];
  return estimate ? { ...guide, ...estimate } : guide;
}
export function curriculumPath(slug: string) {
  return paths.find((path) => path.lessons.includes(slug));
}

/** Keep complete teaching bodies out of the index; load only for a selected lesson. */
export async function loadCurriculumGuide(
  slug: string,
  original?: Guide,
): Promise<Guide | undefined> {
  if (!curriculumPath(slug)) return original;
  const [{ default: supplements }, { default: additions }] = await Promise.all([
    import("./curriculum-details.json"),
    original ? Promise.resolve({ default: [] }) : import("./curriculum-lessons.json"),
  ]);
  const supplement = supplements[slug as keyof typeof supplements];
  const article = (additions as MlArticle[]).find((item) => item.slug === slug);
  const guide = original ?? (article ? articleToGuide(article) : undefined);
  if (!supplement || !guide) throw new Error("Curriculum catalog does not match its lesson.");
  const sections: GuideSection[] = [
    { type: "h2", text: "Before you start" },
    { type: "list", items: supplement.prerequisites },
    { type: "h2", text: "Learning objectives" },
    { type: "list", items: supplement.objectives },
    ...guide.sections,
    { type: "h2", text: "Apply the idea carefully" },
    { type: "p", text: supplement.extension },
    { type: "h2", text: "Understanding check" },
    { type: "p", text: supplement.check },
    { type: "answer", text: supplement.checkAnswer },
    { type: "h2", text: "Next step" },
    { type: "p", text: supplement.nextStep },
  ];
  return {
    ...guide,
    wordCount: supplement.wordCount,
    readMinutes: supplement.readMinutes,
    sections,
  };
}
