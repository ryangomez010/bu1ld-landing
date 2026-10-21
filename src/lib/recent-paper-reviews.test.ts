import { describe, expect, test } from "bun:test";
import {
  toPublishedRecentPaperSummary,
  getPublishedRecentPaperReview,
  getPublishedRecentPaperReviews,
  normalizeArxivId,
  normalizePaperDoi,
  paperAgeDays,
  qualifiedRecentReviewCount,
  validateRecentPaperReview,
  type RecentPaperReview,
} from "./recent-paper-reviews";

function fixture(): RecentPaperReview {
  const at = "2026-10-15T20:00:00Z";
  const paragraph =
    "Synthetic test fixture content for validating publication boundaries and required section length. ".repeat(
      9,
    );
  return {
    id: "arxiv:2610.00001",
    slug: "synthetic-test-fixture",
    title: "Synthetic test fixture",
    authors: ["Test fixture"],
    arxivId: "2610.00001",
    doi: "10.1234/fixture",
    primaryUrl: "https://arxiv.org/abs/2610.00001",
    firstReleaseAt: "2026-10-01T12:00:00Z",
    revisionAt: "2026-10-15T12:00:00Z",
    version: "v2",
    retrievedAt: at,
    reviewedAt: at,
    updatedAt: at,
    topics: ["testing"],
    summary: "Test data only",
    state: "editorial-pending",
    visibility: "private",
    venue: { label: "Test", verification: "preprint" },
    license: { url: null, reuseNotes: "Test fixture only" },
    fullText: {
      url: "https://arxiv.org/html/2610.00001v2",
      sha256: "a".repeat(64),
      readAt: at,
      appendicesInspected: true,
      figuresInspected: true,
      completenessNotes: "Synthetic fixture, not an actual source read",
    },
    sections: {
      question: paragraph,
      contribution: paragraph,
      method: paragraph,
      experiments: paragraph,
      results: paragraph,
      analysis: paragraph,
      reproducibility: paragraph,
      reading: paragraph,
    },
    citations: [
      { id: "1", url: "https://arxiv.org/html/2610.00001v2#S1", locator: "Test", supports: "Test" },
    ],
    relatedLessons: [],
    relatedProjects: [],
    provenance: {
      aiAssisted: true,
      disclosure: "Fixture",
      independentlyReproduced: false,
      sourceCheckedAt: at,
      sourceCheckMethod: "Fixture",
    },
    approval: null,
    publishedAt: null,
    history: [
      "metadata-verified",
      "full-text-read",
      "drafted",
      "source-checked",
      "editorial-pending",
    ].map((state) => ({
      state,
      at,
      evidence: "Test fixture only",
    })) as RecentPaperReview["history"],
  };
}

function publishedFixture(): RecentPaperReview {
  const review = fixture();
  const at = "2026-10-15T20:00:00Z";
  review.state = "published";
  review.visibility = "public";
  review.approval = {
    approvedBy: "TEST-ONLY",
    approvedAt: at,
    evidence: "Synthetic test approval",
  };
  review.publishedAt = at;
  review.history.push(
    { state: "approved", at, evidence: "Synthetic test approval" },
    { state: "published", at, evidence: "Synthetic test publication" },
  );
  return review;
}

describe("recent paper identity and publication gates", () => {
  test("normalizes versions and DOI URLs to one underlying work", () => {
    expect(normalizeArxivId("https://arxiv.org/pdf/2610.12345v3.pdf")).toBe("2610.12345");
    expect(normalizeArxivId("https://evil.invalid/2610.12345")).toBeNull();
    expect(normalizePaperDoi("https://doi.org/10.1234/AbC")).toBe("10.1234/abc");
    expect(normalizePaperDoi("not-a-doi")).toBeNull();
  });
  test("a new revision does not reset the original release age", () => {
    const review = publishedFixture();
    review.firstReleaseAt = "2020-01-01T12:00:00Z";
    expect(paperAgeDays(review.firstReleaseAt, new Date("2026-10-16T00:00:00Z"))).toBeGreaterThan(
      90,
    );
    expect(qualifiedRecentReviewCount([review], new Date("2026-10-16T00:00:00Z"))).toBe(0);
  });
  test("drafts and machine checks never count as public editorial approval", () => {
    const review = fixture();
    expect(validateRecentPaperReview(review)).toEqual([]);
    expect(qualifiedRecentReviewCount([review], new Date("2026-10-16T00:00:00Z"))).toBe(0);
    review.state = "published";
    review.visibility = "public";
    expect(validateRecentPaperReview(review)).toContain("Actual editorial approval is required");
    expect(validateRecentPaperReview(review)).toContain("Unsupported state transition");
  });
  test("deduplicates IDs and DOI variants before counting", () => {
    const review = publishedFixture();
    const duplicate = { ...review, id: "second-source", arxivId: "2610.00002", version: "v3" };
    expect(
      qualifiedRecentReviewCount([review, review, duplicate], new Date("2026-10-16T00:00:00Z")),
    ).toBe(1);
  });
  test("rejects invalid dates, absent source inspections and unsafe URLs", () => {
    const review = fixture();
    review.firstReleaseAt = "2026-02-30T00:00:00Z";
    review.fullText.figuresInspected = false;
    review.primaryUrl = "http://127.0.0.1/private";
    expect(validateRecentPaperReview(review)).toContain("Invalid or missing timestamp");
    expect(validateRecentPaperReview(review)).toContain("Full-text inspection is incomplete");
    expect(validateRecentPaperReview(review)).toContain("Unsafe source URL");
  });
  test("future publications stay unavailable", () => {
    expect(qualifiedRecentReviewCount([publishedFixture()], new Date("2026-10-15T10:00:00Z"))).toBe(
      0,
    );
  });
  test("catalog projection excludes bodies and private inspection history", () => {
    const summary = toPublishedRecentPaperSummary(publishedFixture());
    expect(summary).not.toHaveProperty("sections");
    expect(summary).not.toHaveProperty("citations");
    expect(summary).not.toHaveProperty("fullText");
    expect(summary).not.toHaveProperty("history");
    expect(summary.wordCount).toBeGreaterThanOrEqual(700);
  });
  test("public projection contains no private corpus and missing slugs return null", () => {
    expect(
      getPublishedRecentPaperReviews().every(
        (review) => review.state === "published" && review.visibility === "public",
      ),
    ).toBe(true);
    expect(getPublishedRecentPaperReview("private-unapproved-review")).toBeNull();
  });
});
