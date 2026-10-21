import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

import {
  ARTICLE_BATCHES,
  ARTICLE_PARAGRAPHS,
  articleSummary,
  type MlArticle,
} from "../src/content/guides/article-format";

const root = new URL("../src/content/guides/", import.meta.url);
const catalog = [];
const slugs = new Set<string>();
const titles = new Set<string>();
const paragraphs = new Set<string>();
const tracks = new Set<string>();

for (const batch of ARTICLE_BATCHES) {
  const articles: MlArticle[] = JSON.parse(
    await readFile(new URL(`articles/${batch}.json`, root), "utf8"),
  );
  assert(articles.length >= 10, `${batch}: preserve at least ten articles`);
  assert.equal(new Set(articles.map((article) => article.track)).size, 1, `${batch}: mixed tracks`);
  assert(!tracks.has(articles[0].track), `${batch}: duplicate track`);
  tracks.add(articles[0].track);
  for (const article of articles) {
    assert(/^ml-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug), "Invalid article slug");
    assert(!slugs.has(article.slug), `Duplicate slug: ${article.slug}`);
    assert(!titles.has(article.title.toLowerCase()), `Duplicate title: ${article.title}`);
    slugs.add(article.slug);
    titles.add(article.title.toLowerCase());
    assert(article.title.length > 15 && article.description.length > 40, article.slug);
    assert(["Beginner", "Intermediate", "Advanced"].includes(article.level), article.slug);
    assert(article.track && article.tags.length >= 2, article.slug);
    for (const key of ARTICLE_PARAGRAPHS) {
      assert(typeof article[key] === "string", `${article.slug}: missing ${key}`);
      const paragraph = article[key].trim();
      assert(paragraph.split(/\s+/).length >= 30, `${article.slug}: short ${key}`);
      assert(!paragraphs.has(paragraph), `${article.slug}: repeated paragraph`);
      paragraphs.add(paragraph);
    }
    assert(article.references.length > 0, `${article.slug}: missing references`);
    for (const reference of article.references) {
      assert(reference.label.trim(), `${article.slug}: missing reference label`);
      assert.equal(new URL(reference.url).protocol, "https:", `${article.slug}: unsafe reference`);
    }
    const summary = articleSummary(article);
    assert((summary.wordCount ?? 0) >= 200, `${article.slug}: article too short`);
    catalog.push({ ...summary, batch });
  }
}

assert(catalog.length >= 100, "Preserve the original library size or expand it");
const output = await format(JSON.stringify(catalog), { parser: "json" });
const target = new URL("article-catalog.json", root);
if (process.argv.includes("--check")) {
  assert.equal(
    await readFile(target, "utf8"),
    output,
    "Guide catalog is stale; run guides:generate",
  );
} else {
  await writeFile(target, output);
}
console.log(
  `${process.argv.includes("--check") ? "Verified" : "Generated"} ${catalog.length} articles, ${tracks.size} tracks, ${catalog.reduce((total, item) => total + (item.wordCount ?? 0), 0)} body words: ${fileURLToPath(target)}`,
);
