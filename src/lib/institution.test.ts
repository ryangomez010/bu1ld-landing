import { describe, expect, test } from "bun:test";

import { COMPETITIONS, getLab, INSTITUTION_PROGRAMS, LABS } from "@/data/institution";

describe("institution catalog", () => {
  test("six labs cover requested research areas", () => {
    expect(LABS).toHaveLength(6);
    expect(LABS.map((l) => l.slug)).toEqual([
      "scientific-discovery",
      "mathematical-intelligence",
      "robotics",
      "computational-finance",
      "real-world-ai",
      "emerging",
    ]);
  });

  test("programs include fellowship, incubation, cohort, competitions", () => {
    const kinds = new Set(INSTITUTION_PROGRAMS.map((p) => p.kind));
    expect(kinds.has("fellowship")).toBe(true);
    expect(kinds.has("incubation")).toBe(true);
    expect(kinds.has("cohort")).toBe(true);
    expect(kinds.has("competition")).toBe(true);
  });

  test("competitions link to labs", () => {
    for (const c of COMPETITIONS) {
      if (c.labSlug) expect(getLab(c.labSlug)).toBeDefined();
    }
  });

  test("apply hrefs are relative institution paths", () => {
    for (const p of INSTITUTION_PROGRAMS) {
      expect(p.applyHref.startsWith("/")).toBe(true);
    }
  });
});
