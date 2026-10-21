import { describe, expect, test } from "bun:test";

import {
  COMPETITIONS,
  getLab,
  INSTITUTION_OVERVIEW,
  INSTITUTION_PROGRAMS,
  LABS,
  PARTNERSHIPS,
} from "@/data/institution";

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

  test("organization snapshot preserves scope and qualifies relationship claims", () => {
    expect(INSTITUTION_OVERVIEW.metrics.map((metric) => metric.value)).toEqual([
      "5,500+",
      "1,000+",
      "Dozens",
    ]);
    expect(INSTITUTION_OVERVIEW.metrics.every((metric) => metric.provenance.length > 0)).toBe(true);
    expect(INSTITUTION_OVERVIEW.researchDomains).toHaveLength(5);
    expect(INSTITUTION_OVERVIEW.activeInitiatives).toEqual(
      expect.arrayContaining(["APEN", "META-APEN", "LAM-JEPA", "FIM", "NeuroCAD", "ATG"]),
    );
    expect(INSTITUTION_OVERVIEW.collaborationNetwork).toEqual(
      expect.arrayContaining([
        "Microsoft",
        "Lambda",
        "Neon",
        "NVIDIA Inception",
        "NSRI",
        "Syntica",
      ]),
    );
    expect(INSTITUTION_OVERVIEW.qualification).toContain("does not imply university endorsement");
    expect(PARTNERSHIPS.some((partner) => partner.status === "mixed")).toBe(true);
  });

  test("apply hrefs are relative institution paths", () => {
    for (const p of INSTITUTION_PROGRAMS) {
      expect(p.applyHref.startsWith("/")).toBe(true);
      expect(p.objective.length).toBeGreaterThan(20);
      expect(p.commitment.length).toBeGreaterThan(10);
      expect(p.timeline.length).toBeGreaterThan(10);
      expect(["open", "rolling", "upcoming", "closed", "interest-only"]).toContain(p.status);
    }
  });
});
