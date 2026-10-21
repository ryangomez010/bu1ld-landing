import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeArxivId,
  normalizePaperDoi,
  paperAgeDays,
  qualifiedRecentReviewCount,
  reviewWordCount,
  validateRecentPaperReview,
  type RecentPaperReview,
} from "../src/lib/recent-paper-reviews";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const corpus = join(root, "research/paper-reviews");
const manifestPath = join(corpus, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  selection: { asOf: string; windowDays: number; scope: string };
  papers: Array<{
    id: string;
    arxivId: string;
    doi: string | null;
    firstReleaseAt: string;
    fullText: null | { fetchStatus: string; localPath?: string; textSha256?: string };
  }>;
  failures: unknown[];
};
const asOf = new Date();
const errors: string[] = [];
const ids = new Set<string>();
const dois = new Set<string>();
for (const paper of manifest.papers) {
  if (normalizeArxivId(paper.arxivId) !== paper.arxivId || ids.has(paper.arxivId))
    errors.push(`${paper.id}: invalid/duplicate arXiv identity`);
  ids.add(paper.arxivId);
  if (paper.doi && (normalizePaperDoi(paper.doi) !== paper.doi || dois.has(paper.doi)))
    errors.push(`${paper.id}: invalid/duplicate DOI`);
  if (paper.doi) dois.add(paper.doi);
}
const reviewDirectory = join(corpus, "reviews");
const reviews = (
  existsSync(reviewDirectory)
    ? readdirSync(reviewDirectory).filter((file) => file.endsWith(".json"))
    : []
).map((file) => JSON.parse(readFileSync(join(reviewDirectory, file), "utf8")) as RecentPaperReview);
const reviewIds = new Set<string>();
const reviewDois = new Set<string>();
const reports = reviews.map((review) => {
  const issues = validateRecentPaperReview(review);
  if (reviewIds.has(review.id)) issues.push("Duplicate review identity");
  reviewIds.add(review.id);
  if (review.doi && reviewDois.has(review.doi)) issues.push("Duplicate underlying DOI work");
  if (review.doi) reviewDois.add(review.doi);
  const paper = manifest.papers.find((entry) => entry.id === review.id);
  if (
    !paper?.fullText ||
    paper.fullText.fetchStatus !== "fetched" ||
    !paper.fullText.localPath ||
    !paper.fullText.textSha256
  ) {
    issues.push("Full-text retrieval receipt missing");
  } else {
    const path = resolve(root, paper.fullText.localPath);
    if (!path.startsWith(join(corpus, "source-cache") + "/"))
      issues.push("Unsafe source-cache path");
    else if (!existsSync(path)) issues.push("Source cache unavailable for validation");
    else {
      const source = readFileSync(path, "utf8");
      if (createHash("sha256").update(source).digest("hex") !== paper.fullText.textSha256)
        issues.push("Full-text source checksum mismatch");
      for (const citation of review.citations) {
        if (citation.url.startsWith("https://arxiv.org/html/") && citation.url.includes("#")) {
          const anchor = citation.url.split("#")[1];
          if (!source.includes(`[#${anchor}]`)) issues.push(`Missing source locator: ${anchor}`);
        }
      }
    }
  }
  if (paper && review.firstReleaseAt !== paper.firstReleaseAt)
    issues.push("First release differs from primary metadata");
  const ageDays = paperAgeDays(review.firstReleaseAt, asOf);
  if (ageDays === null || ageDays > manifest.selection.windowDays)
    issues.push("Outside recorded recency window");
  for (const issue of issues) errors.push(`${review.id}: ${issue}`);
  return {
    id: review.id,
    state: review.state,
    words: reviewWordCount(review),
    ageDays,
    structuralAndSourceLocatorCheck: issues.length ? "FAIL" : "PASS",
    issues,
  };
});
const counts = {
  uniquePapersDiscovered: manifest.papers.length,
  fullTextsFetched: manifest.papers.filter((p) => p.fullText?.fetchStatus === "fetched").length,
  fullTextRead: reviews.filter((r) => r.history.some((h) => h.state === "full-text-read")).length,
  fullDrafts: reports.filter((r) => r.words >= 700).length,
  sourceChecked: reviews.filter((r) => r.history.some((h) => h.state === "source-checked")).length,
  editorialPending: reviews.filter((r) => r.state === "editorial-pending").length,
  approved: reviews.filter((r) => r.approval !== null).length,
  published: qualifiedRecentReviewCount(reviews, asOf, manifest.selection.windowDays),
};
const topicCoverage = Object.fromEntries(
  [...new Set(reviews.flatMap((r) => r.topics))]
    .sort()
    .map((topic) => [topic, reviews.filter((r) => r.topics.includes(topic)).length]),
);
const receipt = {
  schemaVersion: 1,
  checkedAt: asOf.toISOString(),
  scope: manifest.selection,
  status: errors.length ? "FAIL" : "PASS",
  acceptance: counts.published >= 100 && !errors.length ? "PASS" : "INCOMPLETE",
  note: "PASS means structural checks, source-file hashes, locators, and recorded dates agree. It is not independent scientific replication, semantic verification of every claim, human editorial approval, or publication authority.",
  counts,
  topicCoverage,
  ageDistribution: {
    "0-30": reports.filter((r) => r.ageDays !== null && r.ageDays <= 30).length,
    "31-60": reports.filter((r) => r.ageDays !== null && r.ageDays > 30 && r.ageDays <= 60).length,
    "61-90": reports.filter((r) => r.ageDays !== null && r.ageDays > 60 && r.ageDays <= 90).length,
  },
  preservedFetchFailureCount: manifest.failures.length,
  remaining: {
    sourceCheckedReviews: Math.max(0, 100 - counts.sourceChecked),
    approvals: Math.max(0, 100 - counts.approved),
    published: Math.max(0, 100 - counts.published),
  },
  reviews: reports,
  errors,
};
writeFileSync(join(corpus, "validation.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(
  JSON.stringify(
    { status: receipt.status, acceptance: receipt.acceptance, counts, errors },
    null,
    2,
  ),
);
if (errors.length) process.exitCode = 1;
