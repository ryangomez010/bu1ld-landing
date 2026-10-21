import type { PublishedRecentPaperSummary } from "@/lib/recent-paper-reviews";

// Metadata-only public index. Private drafts and source caches under research/
// must never be imported here. Add entries only after recorded human approval
// and authorized publication; the matching body belongs in ./bodies/<slug>.json.
export const publishedRecentPaperReviewIndex: PublishedRecentPaperSummary[] = [];
