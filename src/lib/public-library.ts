import { getPublishedRecentPaperReviews } from "@/lib/recent-paper-reviews";
import { getPublicSupabase } from "@/lib/public-supabase";
import type { PublishedRecentPaperSummary, RecentPaperReview } from "@/lib/recent-paper-reviews";
import type { MlEvent, Paper } from "@/lib/types";

export type PublicCatalog<T> =
  | { state: "ready"; records: T[]; checkedAt: string }
  | { state: "unavailable" | "partial"; records: T[]; message: string };

export async function publicEvents(timeoutMs = 8000): Promise<PublicCatalog<MlEvent>> {
  try {
    const db = getPublicSupabase();
    if (!db)
      return {
        state: "unavailable",
        records: [],
        message:
          "The event calendar is unavailable. Dates and registration cannot be confirmed here yet.",
      };
    // Public event copy only. No participant lists, meeting credentials or internal prep notes.
    const { data, error } = await db
      .from("events")
      .select(
        "id,slug,title,summary,location,start_date,end_date,topics,url,published,created_at,updated_at,starts_at,ends_at,timezone,operational_state,archived,registration_mode,registration_state,registration_opens_at,registration_deadline,registration_url,capacity,waitlist_enabled,organizer,eligibility,format_details,price_details,agenda,contact_url,source_url,verified_at,public_materials",
      )
      .eq("published", true)
      .order("start_date")
      .abortSignal(AbortSignal.timeout(Math.max(250, Math.min(8000, timeoutMs))));
    if (error) throw error;
    return {
      state: "ready",
      records: (data ?? []).map((record) => ({
        ...record,
        prep_notes: null,
        resources: [],
        deadlines: [],
      })),
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      state: "unavailable",
      records: [],
      message:
        "The event calendar could not be loaded. Retry before relying on dates or availability.",
    };
  }
}

export type PublicPaper = Paper & {
  relatedLessons?: string[];
  firstReleaseAt?: string;
  versionReviewed?: string;
  aiDisclosure?: string;
};
// Deliberately excludes article bodies and internal editorial/reviewer fields.
const PAPER_METADATA_COLUMNS =
  "id,slug,title,authors,year,arxiv_url,source_url,tags,is_classic,summary,published,review_status,published_at,created_at,updated_at,venue";

function staticPaper(review: PublishedRecentPaperSummary): PublicPaper {
  return {
    id: review.id,
    slug: review.slug,
    title: review.title,
    authors: review.authors.join(", "),
    year: Number(review.firstReleaseAt.slice(0, 4)),
    arxiv_url: review.primaryUrl,
    source_url: review.primaryUrl,
    tags: review.topics,
    is_classic: Date.now() - Date.parse(review.firstReleaseAt) > 90 * 86400000,
    summary: review.summary,
    review_body: "",
    published: true,
    review_status: "published",
    published_at: review.publishedAt!,
    created_at: review.reviewedAt,
    updated_at: review.updatedAt,
    venue: `${review.venue.label} (${review.venue.verification})`,
    firstReleaseAt: review.firstReleaseAt,
    versionReviewed: review.version,
    aiDisclosure: review.provenance.disclosure,
    relatedLessons: review.relatedLessons,
  };
}
function livePaper(record: Record<string, unknown>): PublicPaper {
  const nullable = (key: string) => (record[key] == null ? null : String(record[key]));
  return {
    id: String(record.id),
    slug: String(record.slug),
    title: String(record.title),
    authors: nullable("authors"),
    year: record.year == null ? null : Number(record.year),
    arxiv_url: nullable("arxiv_url"),
    source_url: nullable("source_url"),
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    is_classic: record.is_classic === true,
    summary: nullable("summary"),
    review_body: typeof record.review_body === "string" ? record.review_body : "",
    published: record.published === true,
    review_status: "published",
    published_at: String(record.published_at),
    created_at: String(record.created_at),
    updated_at: String(record.updated_at),
    venue: nullable("venue"),
  };
}
function reviewMarkdown(review: RecentPaperReview): string {
  return (
    Object.entries(review.sections)
      .map(([heading, body]) => `## ${heading[0].toUpperCase()}${heading.slice(1)}\n\n${body}`)
      .join("\n\n") +
    "\n\n## Source evidence\n\n" +
    review.citations
      .map((citation) => `- [${citation.locator}](${citation.url}) — ${citation.supports}`)
      .join("\n") +
    `\n\n${review.provenance.disclosure}`
  );
}
export async function publicPapers(timeoutMs = 8000): Promise<PublicCatalog<PublicPaper>> {
  const approved = getPublishedRecentPaperReviews().map(staticPaper);
  try {
    const db = getPublicSupabase();
    if (!db) throw new Error("Public database unavailable");
    const { data, error } = await db
      .from("papers")
      .select(PAPER_METADATA_COLUMNS)
      .eq("published", true)
      .eq("review_status", "published")
      .order("published_at", { ascending: false })
      .abortSignal(AbortSignal.timeout(Math.max(250, Math.min(8000, timeoutMs))));
    if (error) throw error;
    const records = (data ?? []).map((record) => livePaper(record as Record<string, unknown>));
    return {
      state: "ready",
      records: [
        ...approved,
        ...records.filter(
          (record) =>
            record.published &&
            !approved.some(
              (review) =>
                review.slug === record.slug ||
                (review.arxiv_url &&
                  record.arxiv_url &&
                  review.arxiv_url.replace(/v\d+$/, "") === record.arxiv_url.replace(/v\d+$/, "")),
            ),
        ),
      ],
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      state: approved.length ? "partial" : "unavailable",
      records: approved,
      message: approved.length
        ? "Showing verified published reviews bundled with this site. The live catalog is unavailable, so additional reviews may be missing."
        : "Published paper reviews could not be loaded. This is an unavailable catalog, not a confirmed empty library.",
    };
  }
}

/** Fetch only the requested public body, never the complete article corpus. */
export async function publicPaperBySlug(slug: string): Promise<PublicCatalog<PublicPaper>> {
  const summary = getPublishedRecentPaperReviews().find((review) => review.slug === slug);
  if (summary) {
    try {
      const { loadPublishedRecentPaperReview } = await import("@/lib/recent-paper-review-body");
      const review = await loadPublishedRecentPaperReview(slug);
      if (!review) throw new Error("Approved article body unavailable");
      return {
        state: "ready",
        records: [{ ...staticPaper(summary), review_body: reviewMarkdown(review) }],
        checkedAt: new Date().toISOString(),
      };
    } catch {
      return {
        state: "unavailable",
        records: [],
        message: "This published review's article body could not be loaded. Please retry.",
      };
    }
  }
  try {
    const db = getPublicSupabase();
    if (!db) throw new Error("Public database unavailable");
    const { data, error } = await db
      .from("papers")
      .select(`${PAPER_METADATA_COLUMNS},review_body`)
      .eq("slug", slug)
      .eq("published", true)
      .eq("review_status", "published")
      .abortSignal(AbortSignal.timeout(8000))
      .maybeSingle();
    if (error) throw error;
    return {
      state: "ready",
      records: data ? [livePaper(data as Record<string, unknown>)] : [],
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      state: "unavailable",
      records: [],
      message: "This review could not be reached. Its publication state cannot be confirmed.",
    };
  }
}
