import { expect, test } from "bun:test";
import { homeEventCatalog, homePaperCatalog } from "./home-library";
import type { MlEvent } from "./types";
import type { PublicPaper } from "./public-library";

const now = Date.parse("2026-10-16T00:00:00Z");
const event = {
  id: "event",
  slug: "event",
  title: "Confirmed event",
  published: true,
  start_date: null,
  end_date: null,
  starts_at: "2026-10-17T12:00:00Z",
  ends_at: "2026-10-17T13:00:00Z",
  timezone: "Asia/Kolkata",
  verified_at: "2026-10-15T00:00:00Z",
  prep_notes: "Private notes are never a homepage field",
  resources: [],
  deadlines: [],
} as MlEvent;

test("homepage event preview excludes unconfirmed, cancelled, archived and expired records", () => {
  const records = [
    event,
    { ...event, id: "cancelled", operational_state: "cancelled" as const },
    { ...event, id: "postponed", operational_state: "postponed" as const },
    { ...event, id: "archived", archived: true },
    { ...event, id: "unverified", verified_at: null },
    { ...event, id: "no-end", ends_at: null },
    { ...event, id: "zone", timezone: "unknown" },
    { ...event, id: "private", published: false },
  ];
  const preview = homeEventCatalog({ state: "ready", records, checkedAt: "now" }, now);
  expect(preview.records).toHaveLength(1);
  expect(preview.records[0]).toMatchObject({
    id: "event",
    slug: "event",
    title: "Confirmed event",
  });
  expect(preview.records[0].when).toContain("17 Oct 2026");
  expect(preview.records[0].when).toContain("17:30 · Asia/Kolkata");
  expect(JSON.stringify(preview)).not.toContain("prep_notes");
  expect(
    homeEventCatalog(
      { state: "ready", records: [event], checkedAt: "now" },
      Date.parse("2026-10-18T00:00:00Z"),
    ).records,
  ).toEqual([]);
});

test("homepage preserves missing-provider states and sends only a bounded published metadata preview", () => {
  expect(
    homeEventCatalog({ state: "unavailable", records: [], message: "Unavailable" }, now),
  ).toEqual({ state: "unavailable", records: [], message: "Unavailable" });
  const papers = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    slug: String(i),
    title: "Review",
    published: true,
    review_status: "published",
    published_at: `2026-10-${16 + i}`,
    review_body: "Not part of the landing payload",
  })) as PublicPaper[];
  const preview = homePaperCatalog({
    state: "partial",
    records: [
      ...papers,
      { ...papers[0], id: "undated", published_at: "null" },
      { ...papers[0], id: "draft", published: false, review_status: "draft" },
    ],
    message: "Live catalog unavailable",
  });
  expect(preview.state).toBe("partial");
  expect(preview.records.map((paper) => paper.id)).toEqual(["4", "3", "2"]);
  expect(JSON.stringify(preview)).not.toContain("review_body");
  expect(papers[0].id).toBe("0");
});
