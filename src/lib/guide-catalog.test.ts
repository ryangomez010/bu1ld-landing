import {
  CURRICULUM_PATHS,
  CURRICULUM_ARTICLES,
  curriculumEstimate,
  curriculumPath,
} from "../content/guides/curriculum";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { getAllGuides, getGuide, getGuideSummary, GUIDES } from "../content/guides";
import { ML_ARTICLES } from "../content/guides/articles";
import {
  ARTICLE_BATCHES,
  ARTICLE_PARAGRAPHS,
  articleSummary,
  type MlArticle,
} from "../content/guides/article-format";
import {
  DEFAULT_GUIDE_FILTERS,
  filterGuides,
  guideFiltersFromSearch,
  guideLearningPaths,
  parseGuideSearch,
} from "./guide-catalog";

describe("ML article library", () => {
  test("restores valid URL filters and bounds untrusted search parameters", () => {
    const all = getAllGuides();
    const search = parseGuideSearch(
      {
        q: "RAG",
        track: "Language models",
        level: "Intermediate",
        progress: "continue",
        limit: "48",
      },
      all,
    );
    expect(guideFiltersFromSearch(search)).toEqual({
      query: "RAG",
      track: "Language models",
      level: "Intermediate",
      progress: "continue",
    });
    expect(search.limit).toBe(48);
    const invalid = parseGuideSearch(
      { q: ["bad"], track: "missing", level: "expert", progress: "fake", limit: -1 },
      all,
    );
    expect(guideFiltersFromSearch(invalid)).toEqual(DEFAULT_GUIDE_FILTERS);
    expect(invalid.limit).toBeUndefined();
    expect(parseGuideSearch({ q: "a".repeat(500), limit: 10000 }, all).q).toHaveLength(160);
    expect(parseGuideSearch({ limit: 10000 }, all).limit).toBe(all.length);
    expect(parseGuideSearch({ limit: "Infinity" }, all).limit).toBeUndefined();
    const malformed = parseGuideSearch(
      { level: ["Beginner"], progress: ["done"], limit: [48] },
      all,
    );
    expect(guideFiltersFromSearch(malformed)).toEqual(DEFAULT_GUIDE_FILTERS);
    expect(malformed.limit).toBeUndefined();
  });

  test("offers ten complete topic paths and selects the next unfinished article", () => {
    const all = getAllGuides();
    const paths = guideLearningPaths(all, {});
    expect(paths).toHaveLength(10);
    expect(paths.every((path) => path.articles.length === 12 && path.readMinutes > 0)).toBe(true);
    expect(new Set(paths.flatMap((path) => path.articles.map((guide) => guide.slug))).size).toBe(
      120,
    );
    const first = paths[0];
    const progress = Object.fromEntries(
      first.articles.map((guide, index) => [guide.slug, index === 3 ? 40 : 100]),
    );
    const resumed = guideLearningPaths(all, progress)[0];
    expect(resumed.completed).toBe(11);
    expect(resumed.next?.slug).toBe(first.articles[3].slug);
    progress[first.articles[3].slug] = 100;
    expect(guideLearningPaths(all, progress)[0].next).toBeNull();
  });

  test("contains 120 distinct articles alongside all six existing essays", () => {
    const all = getAllGuides();
    expect(ML_ARTICLES).toHaveLength(120);
    expect(all).toHaveLength(144);
    expect(new Set(all.map((guide) => guide.slug)).size).toBe(144);
    expect(new Set(ML_ARTICLES.map((guide) => guide.title.toLowerCase())).size).toBe(120);
    expect(new Set(ML_ARTICLES.map((guide) => guide.track)).size).toBe(10);
    expect(GUIDES.every((guide) => all.some((item) => item.slug === guide.slug))).toBe(true);
    expect(all.every((guide) => !("sections" in guide))).toBe(true);
  });

  test("every authored body loads correctly and matches its lightweight catalog entry", async () => {
    const paragraphs = new Set<string>();
    for (const batch of ARTICLE_BATCHES) {
      const articles: MlArticle[] = JSON.parse(
        readFileSync(new URL(`../content/guides/articles/${batch}.json`, import.meta.url), "utf8"),
      );
      expect(articles).toHaveLength(12);
      for (const article of articles) {
        const summary = articleSummary(article);
        expect(getGuideSummary(article.slug)).toEqual(
          curriculumEstimate({ ...summary, batch } as typeof summary),
        );
        expect(summary.wordCount).toBeGreaterThanOrEqual(200);
        const loaded = await getGuide(article.slug);
        expect(loaded?.slug).toBe(article.slug);
        expect(
          loaded?.sections
            .filter((section) => section.type === "p" || section.type === "answer")
            .map((section) => section.text),
        ).toEqual(expect.arrayContaining(ARTICLE_PARAGRAPHS.map((key) => article[key])));
        expect(loaded?.references).toEqual(article.references);
        const bodyWords = loaded!.sections
          .filter((section) => section.type === "p" || section.type === "answer")
          .reduce((total, section) => total + section.text.trim().split(/\s+/).length, 0);
        if (!curriculumPath(article.slug)) {
          expect(summary.wordCount).toBe(bodyWords);
          expect(summary.readMinutes).toBe(Math.ceil(bodyWords / 220));
        }
        expect("answer" in getGuideSummary(article.slug)!).toBe(false);
        if (article.answer) {
          expect(article.answer.trim().split(/\s+/).length).toBeGreaterThanOrEqual(30);
          expect(loaded?.sections).toContainEqual({ type: "answer", text: article.answer });
        }
        for (const key of ARTICLE_PARAGRAPHS) {
          expect(article[key].trim().split(/\s+/).length).toBeGreaterThanOrEqual(30);
          expect(paragraphs.has(article[key])).toBe(false);
          paragraphs.add(article[key]);
        }
        expect(article.references.length).toBeGreaterThan(0);
        expect(
          article.references.every(
            (reference) =>
              new URL(reference.url).protocol === "https:" && reference.label.length > 0,
          ),
        ).toBe(true);
      }
    }
  });

  test("reference essays include sources, worked exercises, and accurate reading estimates", () => {
    for (const guide of GUIDES) {
      expect(guide.references?.length).toBeGreaterThan(0);
      expect(
        guide.sections.some((section) => section.type === "h2" && section.text === "Try it"),
      ).toBe(true);
      expect(guide.sections.at(-1)?.type).toBe("answer");
      const words = guide.sections
        .filter((section) => section.type === "p" || section.type === "answer")
        .reduce((total, section) => total + section.text.trim().split(/\s+/).length, 0);
      expect(guide.wordCount).toBe(words);
      expect(guide.readMinutes).toBe(Math.ceil(words / 220));
    }
  });

  test("keeps old deep links working and does not substitute content for unknown slugs", async () => {
    for (const guide of GUIDES) expect(await getGuide(guide.slug)).toEqual(guide);
    expect(await getGuide("not-a-real-article")).toBeUndefined();
    expect(getGuideSummary("not-a-real-article")).toBeUndefined();
  });

  test("combines keyword, topic, and level filters without dropping later articles", () => {
    const all = getAllGuides();
    expect(filterGuides(all, DEFAULT_GUIDE_FILTERS, {})).toHaveLength(144);
    expect(
      filterGuides(all, { ...DEFAULT_GUIDE_FILTERS, track: "Research practice" }, {}),
    ).toHaveLength(12);
    expect(
      filterGuides(
        all,
        {
          ...DEFAULT_GUIDE_FILTERS,
          query: "  CONFORMAL  coverage ",
          track: "Research practice",
          level: "Advanced",
        },
        {},
      ).map((guide) => guide.slug),
    ).toEqual(["ml-conformal-prediction"]);
    expect(
      filterGuides(all, { ...DEFAULT_GUIDE_FILTERS, query: "RAG" }, {}).some(
        (guide) => guide.slug === "ml-retrieval-augmented-generation",
      ),
    ).toBe(true);
    expect(filterGuides(all, { ...DEFAULT_GUIDE_FILTERS, query: "unfindablezyx" }, {})).toEqual([]);
    expect(
      filterGuides(
        all,
        { ...DEFAULT_GUIDE_FILTERS, track: "Reference essays", level: "Beginner" },
        {},
      ),
    ).toEqual([]);
  });

  test("uses existing completion thresholds for progress filters", () => {
    const all = getAllGuides();
    const progress = { "ml-problem-framing": 94, "ml-model-cards": 95, "ml-lora": 100 };
    expect(
      filterGuides(all, { ...DEFAULT_GUIDE_FILTERS, progress: "continue" }, progress).map(
        (guide) => guide.slug,
      ),
    ).toEqual(["ml-problem-framing"]);
    expect(
      filterGuides(all, { ...DEFAULT_GUIDE_FILTERS, progress: "done" }, progress),
    ).toHaveLength(2);
    expect(
      filterGuides(all, { ...DEFAULT_GUIDE_FILTERS, progress: "not_started" }, progress),
    ).toHaveLength(141);
  });
});

describe("structured curriculum", () => {
  test("all 48 lessons have complete teaching sections, exact reading estimates, and valid next steps", async () => {
    expect(CURRICULUM_PATHS).toHaveLength(12);
    expect(CURRICULUM_ARTICLES).toHaveLength(18);
    const slugs = CURRICULUM_PATHS.flatMap((path) => path.lessons);
    expect(new Set(slugs).size).toBe(48);
    for (const path of CURRICULUM_PATHS) {
      expect(path.lessons).toHaveLength(4);
      expect(
        readFileSync(new URL(`../../public/learning/${path.exercise}`, import.meta.url), "utf8"),
      ).toContain("--smoke");
      for (const slug of path.lessons) {
        const guide = await getGuide(slug);
        expect(guide).toBeDefined();
        for (const heading of [
          "Before you start",
          "Learning objectives",
          "Core idea",
          "Worked example",
          "Try it",
          "Understanding check",
          "Next step",
        ]) {
          expect(guide?.sections).toContainEqual({ type: "h2", text: heading });
        }
        expect(guide!.sections.filter((section) => section.type === "answer")).toHaveLength(2);
        const words = guide!.sections
          .flatMap((section) =>
            section.type === "list"
              ? section.items
              : section.type === "p" || section.type === "answer"
                ? [section.text]
                : [],
          )
          .join(" ")
          .trim()
          .split(/\s+/).length;
        expect(words).toBeGreaterThanOrEqual(350);
        expect(guide?.wordCount).toBe(words);
        expect(getGuideSummary(slug)?.wordCount).toBe(words);
        expect(guide?.references?.length).toBeGreaterThan(0);
      }
    }
  });
  test("public article routes load full content before rendering and contain no member gate", () => {
    const detail = readFileSync(new URL("../routes/guides/$slug.tsx", import.meta.url), "utf8");
    const index = readFileSync(new URL("../routes/guides/index.tsx", import.meta.url), "utf8");
    expect(detail).toContain("loader: async");
    expect(detail).toContain("await getGuide(params.slug)");
    expect(detail).not.toContain("RequireMember");
    expect(index).not.toContain("RequireMember");
  });
});
