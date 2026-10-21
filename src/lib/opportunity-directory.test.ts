import { describe, expect, test } from "bun:test";
import { INSTITUTION_PROGRAMS, LABS } from "@/data/institution";
import {
  filterOpportunities,
  INTEREST_STORAGE_KEY,
  OPPORTUNITIES,
  opportunityStatus,
  parseOpportunitySearch,
  readSavedInterests,
  saveInterests,
  type Opportunity,
} from "./opportunity-directory";

const now = Date.parse("2026-10-16T12:00:00Z");
const find = (search: Record<string, unknown>, savedIds?: string[]) =>
  filterOpportunities(OPPORTUNITIES, parseOpportunitySearch(search), { now, savedIds });

describe("public opportunity directory", () => {
  test("catalog aspirations never become confirmed recruitment", () => {
    expect(find({})).toHaveLength(INSTITUTION_PROGRAMS.length + LABS.length);
    expect(find({ status: "open" })).toHaveLength(0);
    expect(find({ deadline: "rolling" })).toHaveLength(0);
    for (const item of find({})) {
      expect(opportunityStatus(item, now)).toBe("interest-only");
      expect(item.operationallyConfirmed).toBe(false);
      expect(item.deadline).toBeNull();
      expect(item.location).toBe("unknown");
    }
  });
  test("historic wave stays in archive, while its successor format stays interest-only", () => {
    const archive = find({ status: "archived" });
    expect(archive.map((item) => item.id)).toEqual(["archive:ai-builder-cohort-q2-2026"]);
    expect(find({}).some((item) => item.id === "program:ai-builder-cohort")).toBe(true);
    expect(find({ status: "all" })).toHaveLength(find({}).length + archive.length);
  });
  test("typed result count respects the selected type even when another type matches", () => {
    expect(find({ q: "manifold", type: "research" }).length).toBeGreaterThan(0);
    expect(find({ q: "manifold", type: "program" })).toHaveLength(0);
  });
  test("topic, experience and commitment filters combine rather than override", () => {
    expect(
      find({
        topic: "robotics",
        type: "program",
        experience: "builders",
        commitment: "part-time",
      }).map((item) => item.slug),
    ).toEqual(["ai-builder-cohort"]);
    expect(find({ topic: "robotics", commitment: "intensive" })).toHaveLength(0);
    expect(find({ location: "unknown" })).toHaveLength(find({}).length);
  });
  test("untrusted URL values normalize, and the search stays bounded", () => {
    const normalized = parseOpportunitySearch({
      type: ["program"],
      status: "recruiting",
      topic: "invented",
      q: "  " + "x".repeat(200),
    });
    expect(normalized.type).toBe("all");
    expect(normalized.status).toBe("current");
    expect(normalized.topic).toBe("all");
    expect(normalized.q).toHaveLength(120);
  });
  test("an expired confirmed call cannot remain in open results", () => {
    const item: Opportunity = {
      ...OPPORTUNITIES[0],
      status: "open",
      operationallyConfirmed: true,
      deadline: "2026-10-16T12:00:00Z",
    };
    expect(opportunityStatus(item, now - 1)).toBe("open");
    expect(opportunityStatus(item, now)).toBe("closed");
    expect(
      filterOpportunities([item], parseOpportunitySearch({ status: "open" }), { now }),
    ).toHaveLength(0);
    expect(
      filterOpportunities([item], parseOpportunitySearch({ status: "closed" }), { now }),
    ).toHaveLength(1);
    expect(opportunityStatus({ ...item, operationallyConfirmed: false }, now - 1)).toBe(
      "interest-only",
    );
  });
  test("deadline ordering places undated records after dated records", () => {
    const items = [
      { ...OPPORTUNITIES[0], id: "unknown", name: "A", deadline: null },
      { ...OPPORTUNITIES[0], id: "later", deadline: "2026-12-01T00:00:00Z" },
      { ...OPPORTUNITIES[0], id: "earlier", deadline: "2026-11-01T00:00:00Z" },
    ];
    expect(
      filterOpportunities(items, parseOpportunitySearch({ sort: "deadline" }), { now }).map(
        (item) => item.id,
      ),
    ).toEqual(["earlier", "later", "unknown"]);
  });
  test("saved filter does not fabricate an empty list before device storage loads", () => {
    const id = find({})[0].id;
    expect(find({ saved: "saved" })).toHaveLength(find({}).length);
    expect(find({ saved: "saved" }, [])).toHaveLength(0);
    expect(find({ saved: "saved" }, [id]).map((item) => item.id)).toEqual([id]);
  });
});

describe("device-only interests", () => {
  test("saved IDs round-trip, deduplicate and ignore unknown entries", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const id = OPPORTUNITIES[0].id;
    expect(saveInterests(storage, [id, id, "unverified:role"])).toBe(true);
    expect(readSavedInterests(storage)).toEqual({ ids: [id], available: true });
    values.set(INTEREST_STORAGE_KEY, JSON.stringify([id, null, 12, "removed:role", id]));
    expect(readSavedInterests(storage).ids).toEqual([id]);
  });
  test("blocked or full storage cannot be reported as a successful save", () => {
    const storage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(readSavedInterests(storage)).toEqual({ ids: [], available: false });
    expect(saveInterests(storage, [OPPORTUNITIES[0].id])).toBe(false);
  });
  test("malformed stored data yields an explicit unavailable state", () => {
    expect(readSavedInterests({ getItem: () => "{", setItem: () => {} })).toEqual({
      ids: [],
      available: false,
    });
  });
});
