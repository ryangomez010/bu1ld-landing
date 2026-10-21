import { eventDate, eventState } from "@/lib/event-state";
import type { PublicCatalog, PublicPaper } from "@/lib/public-library";
import type { MlEvent } from "@/lib/types";

export type HomePaper = Pick<PublicPaper, "id" | "slug" | "title" | "published_at">;
export type HomeEvent = { id: string; slug: string; title: string; when: string };

/** Keep the landing payload small and preserve unavailable versus verified-empty states. */
export function homePaperCatalog(catalog: PublicCatalog<PublicPaper>): PublicCatalog<HomePaper> {
  return {
    ...catalog,
    records: catalog.records
      .filter((paper) => paper.published && paper.review_status === "published")
      .sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0))
      .slice(0, 3)
      .map(({ id, slug, title, published_at }) => ({ id, slug, title, published_at })),
  };
}

export function homeEventCatalog(
  catalog: PublicCatalog<MlEvent>,
  now = Date.now(),
): PublicCatalog<HomeEvent> {
  const records: (HomeEvent & { start: number })[] = [];
  for (const event of catalog.records) {
    if (
      !event.published ||
      event.archived ||
      !event.verified_at ||
      !event.starts_at ||
      !event.ends_at ||
      !event.timezone ||
      eventState(event, now) !== "upcoming"
    )
      continue;
    const start = eventDate(event.starts_at);
    if (start == null) continue;
    try {
      const when = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: event.timezone,
      }).format(start);
      records.push({
        id: event.id,
        slug: event.slug,
        title: event.title,
        start,
        when: `${when} · ${event.timezone}`,
      });
    } catch {
      /* An invalid organizer timezone cannot support a confirmed preview. */
    }
  }
  return {
    ...catalog,
    records: records
      .sort((a, b) => a.start - b.start)
      .slice(0, 3)
      .map(({ start: _start, ...record }) => record),
  };
}
