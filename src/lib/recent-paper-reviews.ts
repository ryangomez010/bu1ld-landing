import { publishedRecentPaperReviewIndex } from "@/content/paper-reviews/published";

export const RECENT_REVIEW_STATES = [
  "discovered",
  "metadata-verified",
  "full-text-read",
  "drafted",
  "source-checked",
  "editorial-pending",
  "approved",
  "published",
  "needs-update",
  "withdrawn",
] as const;

export type RecentReviewState = (typeof RECENT_REVIEW_STATES)[number];
export type ReviewSection =
  | "question"
  | "contribution"
  | "method"
  | "experiments"
  | "results"
  | "analysis"
  | "reproducibility"
  | "reading";

export type RecentPaperReview = {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  arxivId: string | null;
  doi: string | null;
  primaryUrl: string;
  firstReleaseAt: string;
  revisionAt: string;
  version: string;
  retrievedAt: string;
  reviewedAt: string;
  updatedAt: string;
  topics: string[];
  summary: string;
  state: RecentReviewState;
  visibility: "private" | "public";
  venue: { label: string; verification: "preprint" | "author-reported" | "verified-proceedings" };
  license: { url: string | null; reuseNotes: string };
  fullText: {
    url: string;
    sha256: string;
    readAt: string;
    appendicesInspected: boolean;
    figuresInspected: boolean;
    completenessNotes: string;
  };
  sections: Record<ReviewSection, string>;
  citations: Array<{ id: string; url: string; locator: string; supports: string }>;
  relatedLessons: string[];
  relatedProjects: string[];
  provenance: {
    aiAssisted: true;
    disclosure: string;
    independentlyReproduced: false;
    sourceCheckedAt: string;
    sourceCheckMethod: string;
  };
  approval: { approvedBy: string; approvedAt: string; evidence: string } | null;
  publishedAt: string | null;
  history: Array<{ state: RecentReviewState; at: string; evidence: string }>;
  /** Private metadata audit; does not advance editorial workflow or grant approval. */
  metadataUpdates?: Array<{
    at: string;
    fields: string[];
    evidence: string;
    migratedHistoryEntry?: { state: RecentReviewState; at: string; evidence: string };
  }>;
};

/** Public catalog metadata only. Bodies live in separately loaded approved modules. */
export type PublishedRecentPaperSummary = Omit<
  RecentPaperReview,
  "sections" | "citations" | "fullText" | "history" | "metadataUpdates"
> & { wordCount: number };

export function toPublishedRecentPaperSummary(
  review: RecentPaperReview,
): PublishedRecentPaperSummary {
  const {
    sections,
    citations: _citations,
    fullText: _fullText,
    history: _history,
    metadataUpdates: _metadataUpdates,
    ...metadata
  } = review;
  return { ...metadata, wordCount: reviewWordCount({ sections }) };
}

const DAY = 86_400_000;
const NEXT_STATES: Record<RecentReviewState, RecentReviewState[]> = {
  discovered: ["metadata-verified", "withdrawn"],
  "metadata-verified": ["full-text-read", "withdrawn"],
  "full-text-read": ["drafted", "withdrawn"],
  drafted: ["source-checked", "withdrawn"],
  "source-checked": ["editorial-pending", "needs-update", "withdrawn"],
  "editorial-pending": ["approved", "needs-update", "withdrawn"],
  approved: ["published", "needs-update", "withdrawn"],
  published: ["needs-update", "withdrawn"],
  "needs-update": ["full-text-read", "withdrawn"],
  withdrawn: [],
};
const SECTIONS: ReviewSection[] = [
  "question",
  "contribution",
  "method",
  "experiments",
  "results",
  "analysis",
  "reproducibility",
  "reading",
];

export function normalizeArxivId(value: string): string | null {
  const normalized = value
    .trim()
    .replace(/^https?:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf|html)\//i, "")
    .replace(/\.pdf$/i, "")
    .replace(/v\d+$/i, "");
  return /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})$/.test(normalized) ? normalized : null;
}

export function normalizePaperDoi(value: string): string | null {
  const normalized = value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\/|^doi:\s*/i, "")
    .toLowerCase();
  return /^10\.\d{4,9}\/\S+$/.test(normalized) ? normalized : null;
}

export function reviewWordCount(review: Pick<RecentPaperReview, "sections">): number {
  return Object.values(review.sections).join(" ").split(/\s+/).filter(Boolean).length;
}

export function paperAgeDays(firstReleaseAt: string, asOf = new Date()): number | null {
  const released = Date.parse(firstReleaseAt);
  if (!Number.isFinite(released) || released > asOf.getTime()) return null;
  return Math.floor((asOf.getTime() - released) / DAY);
}

function validTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) return false;
  const parsed = new Date(value);
  return (
    Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value.slice(0, 10)
  );
}

function safeSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      !/^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[|.*\.local$)/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

/** Structural checks do not establish scientific correctness or human approval. */
export function validateRecentPaperReview(review: RecentPaperReview): string[] {
  const errors: string[] = [];
  if (!review.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(review.slug))
    errors.push("Invalid identity or slug");
  if (
    !review.title.trim() ||
    !review.authors.length ||
    review.authors.some((author) => !author.trim())
  ) {
    errors.push("Title and source authors are required");
  }
  if (!review.arxivId && !review.doi) errors.push("A canonical arXiv ID or DOI is required");
  if (review.arxivId && normalizeArxivId(review.arxivId) !== review.arxivId)
    errors.push("Noncanonical arXiv ID");
  if (review.doi && normalizePaperDoi(review.doi) !== review.doi) errors.push("Noncanonical DOI");
  const dates = [
    review.firstReleaseAt,
    review.revisionAt,
    review.retrievedAt,
    review.reviewedAt,
    review.updatedAt,
    review.fullText.readAt,
    review.provenance.sourceCheckedAt,
  ];
  if (dates.some((date) => !validTimestamp(date))) errors.push("Invalid or missing timestamp");
  if (Date.parse(review.firstReleaseAt) > Date.parse(review.revisionAt))
    errors.push("Revision predates first release");
  if (Date.parse(review.retrievedAt) > Date.parse(review.fullText.readAt))
    errors.push("Read evidence predates retrieval");
  if (Date.parse(review.fullText.readAt) > Date.parse(review.provenance.sourceCheckedAt))
    errors.push("Source check predates reading");
  if (Date.parse(review.provenance.sourceCheckedAt) > Date.parse(review.updatedAt))
    errors.push("Update predates source check");
  if (!safeSourceUrl(review.primaryUrl) || !safeSourceUrl(review.fullText.url))
    errors.push("Unsafe source URL");
  if (!/^[a-f0-9]{64}$/.test(review.fullText.sha256))
    errors.push("Full-text evidence hash is required");
  if (!review.fullText.appendicesInspected || !review.fullText.figuresInspected)
    errors.push("Full-text inspection is incomplete");
  if (SECTIONS.some((section) => (review.sections[section] ?? "").trim().length < 80))
    errors.push("Required analysis sections are incomplete");
  if (reviewWordCount(review) < 700) errors.push("Review is below the 700-word completeness floor");
  if (
    !review.citations.length ||
    review.citations.some(
      (citation) => !safeSourceUrl(citation.url) || !citation.locator || !citation.supports,
    )
  )
    errors.push("Source locators and supported claims are required");
  if (
    !review.provenance.disclosure ||
    !review.provenance.sourceCheckMethod ||
    review.provenance.independentlyReproduced !== false
  )
    errors.push("Review provenance must distinguish reading from replication");
  const states = review.history.map((entry) => entry.state);
  for (const needed of [
    "metadata-verified",
    "full-text-read",
    "drafted",
    "source-checked",
  ] as const) {
    if (!states.includes(needed)) errors.push(`Missing ${needed} transition evidence`);
  }
  if (
    review.history.some(
      (entry, index, all) =>
        !entry.evidence ||
        !validTimestamp(entry.at) ||
        (index > 0 && Date.parse(entry.at) < Date.parse(all[index - 1].at)),
    )
  )
    errors.push("Invalid transition evidence or chronology");
  if (
    review.history.at(-1)?.state !== review.state ||
    review.history.some(
      (entry, index, all) => index > 0 && !NEXT_STATES[all[index - 1].state]?.includes(entry.state),
    )
  )
    errors.push("Unsupported state transition");
  if (
    (review.state === "approved" || review.state === "published") &&
    (!review.approval?.approvedBy.trim() ||
      !review.approval?.evidence.trim() ||
      !validTimestamp(review.approval.approvedAt))
  )
    errors.push("Actual editorial approval is required");
  if (
    review.state === "published" &&
    (review.visibility !== "public" || !review.publishedAt || !validTimestamp(review.publishedAt))
  )
    errors.push("Publication requires an explicit public state and date");
  if (
    review.approval &&
    review.publishedAt &&
    Date.parse(review.approval.approvedAt) > Date.parse(review.publishedAt)
  )
    errors.push("Publication predates approval");
  if (review.visibility === "public" && review.state !== "published")
    errors.push("Unpublished reviews cannot be public");
  return errors;
}

/** This function cannot import review bodies or private editorial content. */
export function getPublishedRecentPaperReviews(asOf = new Date()): PublishedRecentPaperSummary[] {
  const ids = new Set<string>();
  const dois = new Set<string>();
  return publishedRecentPaperReviewIndex
    .filter((review) => {
      if (
        review.state !== "published" ||
        review.visibility !== "public" ||
        !review.approval?.approvedBy.trim() ||
        !review.approval?.evidence.trim() ||
        !validTimestamp(review.approval.approvedAt) ||
        !review.publishedAt ||
        !validTimestamp(review.publishedAt) ||
        review.wordCount < 700 ||
        !safeSourceUrl(review.primaryUrl) ||
        paperAgeDays(review.firstReleaseAt, asOf) === null ||
        Date.parse(review.approval.approvedAt) > Date.parse(review.publishedAt) ||
        Date.parse(review.publishedAt) > asOf.getTime()
      )
        return false;
      const identity = review.arxivId ?? review.doi ?? review.id;
      if (ids.has(identity) || (review.doi && dois.has(review.doi))) return false;
      ids.add(identity);
      if (review.doi) dois.add(review.doi);
      return true;
    })
    .sort((a, b) => b.firstReleaseAt.localeCompare(a.firstReleaseAt));
}

export function getPublishedRecentPaperReview(slug: string): PublishedRecentPaperSummary | null {
  return getPublishedRecentPaperReviews().find((review) => review.slug === slug) ?? null;
}

export function qualifiedRecentReviewCount(
  reviews: RecentPaperReview[],
  asOf = new Date(),
  maxAgeDays = 90,
): number {
  const identities = new Set<string>();
  const dois = new Set<string>();
  for (const review of reviews) {
    const age = paperAgeDays(review.firstReleaseAt, asOf);
    if (
      review.state !== "published" ||
      review.visibility !== "public" ||
      !review.publishedAt ||
      Date.parse(review.publishedAt) > asOf.getTime() ||
      validateRecentPaperReview(review).length ||
      age === null ||
      age > maxAgeDays
    )
      continue;
    const identity = review.arxivId ?? review.doi ?? review.id;
    if (identities.has(identity) || (review.doi && dois.has(review.doi))) continue;
    identities.add(identity);
    if (review.doi) dois.add(review.doi);
  }
  return identities.size;
}
