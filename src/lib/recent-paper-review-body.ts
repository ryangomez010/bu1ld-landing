import {
  getPublishedRecentPaperReview,
  validateRecentPaperReview,
  type RecentPaperReview,
} from "@/lib/recent-paper-reviews";

// Vite emits separate chunks; listing papers never downloads these bodies.
// This glob intentionally excludes the private research/ editorial directory.
const approvedBodies = import.meta.glob<RecentPaperReview>(
  "/src/content/paper-reviews/bodies/*.json",
  { import: "default" },
);

export async function loadPublishedRecentPaperReview(
  slug: string,
): Promise<RecentPaperReview | null> {
  const summary = getPublishedRecentPaperReview(slug);
  if (!summary) return null;
  const load = approvedBodies[`/src/content/paper-reviews/bodies/${summary.slug}.json`];
  if (!load) return null;
  const review = await load();
  if (
    review.id !== summary.id ||
    review.slug !== summary.slug ||
    review.state !== "published" ||
    review.visibility !== "public" ||
    review.publishedAt !== summary.publishedAt ||
    review.version !== summary.version ||
    validateRecentPaperReview(review).length
  )
    return null;
  return review;
}
