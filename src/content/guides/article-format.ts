import type { Guide, GuideSummary } from "@/lib/types";

export const ARTICLE_BATCHES = [
  "foundations",
  "data",
  "supervised",
  "evaluation",
  "representations",
  "neural",
  "vision",
  "language",
  "systems",
  "research",
] as const;

export type ArticleBatch = (typeof ARTICLE_BATCHES)[number];
export type MlArticle = Omit<GuideSummary, "readMinutes" | "wordCount"> & {
  track: string;
  level: NonNullable<GuideSummary["level"]>;
  concept: string;
  example: string;
  pitfall: string;
  exercise: string;
  answer: string;
  references: NonNullable<Guide["references"]>;
};

export const ARTICLE_PARAGRAPHS = ["concept", "example", "pitfall", "exercise", "answer"] as const;

export function articleSummary(article: MlArticle): GuideSummary {
  const wordCount = ARTICLE_PARAGRAPHS.reduce(
    (total, key) => total + (article[key]?.trim().split(/\s+/).filter(Boolean).length ?? 0),
    0,
  );
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tags: article.tags,
    track: article.track,
    level: article.level,
    wordCount,
    readMinutes: Math.max(1, Math.ceil(wordCount / 220)),
  };
}

export function articleToGuide(article: MlArticle): Guide {
  return {
    ...articleSummary(article),
    sections: [
      { type: "h2", text: "Core idea" },
      { type: "p", text: article.concept },
      { type: "h2", text: "Worked example" },
      { type: "p", text: article.example },
      { type: "h2", text: "Common trap" },
      { type: "p", text: article.pitfall },
      { type: "h2", text: "Try it" },
      { type: "p", text: article.exercise },
      { type: "answer", text: article.answer },
    ],
    references: article.references,
  };
}
