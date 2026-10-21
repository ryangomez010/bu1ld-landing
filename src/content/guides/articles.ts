import type { Guide, GuideSummary } from "@/lib/types";
import catalog from "./article-catalog.json";
import { articleToGuide, type ArticleBatch, type MlArticle } from "./article-format";

export const ML_ARTICLES = catalog as (GuideSummary & { batch: ArticleBatch })[];

// Keep full article bodies out of the portal/search catalog. Each topic loads on demand.
const batches = {
  foundations: () => import("./articles/foundations.json"),
  data: () => import("./articles/data.json"),
  supervised: () => import("./articles/supervised.json"),
  evaluation: () => import("./articles/evaluation.json"),
  representations: () => import("./articles/representations.json"),
  neural: () => import("./articles/neural.json"),
  vision: () => import("./articles/vision.json"),
  language: () => import("./articles/language.json"),
  systems: () => import("./articles/systems.json"),
  research: () => import("./articles/research.json"),
} satisfies Record<ArticleBatch, () => Promise<{ default: unknown }>>;

export async function loadMlArticle(slug: string): Promise<Guide | undefined> {
  const summary = ML_ARTICLES.find((article) => article.slug === slug);
  if (!summary) return undefined;
  const { default: articles } = await batches[summary.batch]();
  const article = (articles as MlArticle[]).find((item) => item.slug === slug);
  if (!article) throw new Error("Article catalog does not match its content.");
  return articleToGuide(article);
}
