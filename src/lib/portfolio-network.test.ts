import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  BOUND_SOURCE_COUNT,
  getPortfolioRecord,
  PORTFOLIO_RECORDS,
  UNRESOLVED_SOURCE_COUNT,
  WEBSITE_DESTINATIONS,
} from "@/data/portfolio";

type SourceBindings = {
  projects: Array<{
    id: string;
    name: string;
    classification: string;
    evidence_level: string;
    source_status: string;
  }>;
};

const bindings = JSON.parse(
  readFileSync("research/SOURCE_BINDINGS.json", "utf8"),
) as SourceBindings;

describe("portfolio network", () => {
  test("stays synchronized with the canonical source-binding projection", () => {
    expect(PORTFOLIO_RECORDS).toHaveLength(bindings.projects.length);
    expect(new Set(PORTFOLIO_RECORDS.map((record) => record.id)).size).toBe(
      PORTFOLIO_RECORDS.length,
    );

    for (const project of bindings.projects) {
      const record = PORTFOLIO_RECORDS.find((candidate) => candidate.id === project.id);
      expect(record).toBeDefined();
      expect(record?.name).toBe(project.name);
      expect(record?.classification).toBe(project.classification);
      expect(record?.evidenceLevel).toBe(project.evidence_level);
      expect(record?.sourceStatus).toBe(project.source_status);
    }
  });

  test("retains the evidence-bound source totals", () => {
    expect(BOUND_SOURCE_COUNT).toBe(17);
    expect(UNRESOLVED_SOURCE_COUNT).toBe(3);
  });

  test("gives every canonical identity a complete public profile", () => {
    for (const record of PORTFOLIO_RECORDS) {
      expect(getPortfolioRecord(record.id)).toBe(record);
      expect(record.category.length).toBeGreaterThan(0);
      expect(record.objective.length).toBeGreaterThan(0);
      expect(record.implemented.length).toBeGreaterThan(0);
      expect(record.intendedOutput.length).toBeGreaterThan(0);
      expect(record.limitations.length).toBeGreaterThan(0);
    }
  });

  test("publishes only https destinations and keeps owner-only sites private", () => {
    expect(WEBSITE_DESTINATIONS.map((site) => site.id)).toEqual([
      "bu1ld-nexus",
      "financemeta-public",
      "financemeta-member",
      "iyern",
      "vertexed",
      "obscured-records-agent",
    ]);

    for (const site of WEBSITE_DESTINATIONS) {
      expect(site.repositoryUrl.startsWith("https://github.com/")).toBe(true);
      if (site.publicUrl) expect(site.publicUrl.startsWith("https://")).toBe(true);
      if (site.availability === "private") expect(site.publicUrl).toBeNull();
    }
  });

  test("links the network from every public navigation layer", () => {
    expect(readFileSync("src/data/landing.ts", "utf8")).toContain(
      '["Research atlas", "/research-atlas"]',
    );
    expect(readFileSync("src/components/institution/InstitutionLayout.tsx", "utf8")).toContain(
      "<SiteHeader />",
    );
    expect(readFileSync("src/lib/public-navigation.ts", "utf8")).toContain(
      '{ label: "Research", to: "/research-atlas" }',
    );
    expect(readFileSync("src/components/landing/SiteFooter.tsx", "utf8")).toContain(
      'to="/network"',
    );
    expect(readFileSync("public/sitemap.xml", "utf8")).toContain("https://thebu1ld.com/network");
    expect(readFileSync("src/routes/network.tsx", "utf8")).toContain('to="/portfolio/$projectId"');

    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    for (const record of PORTFOLIO_RECORDS) {
      expect(sitemap).toContain(`https://thebu1ld.com/portfolio/${record.id}`);
    }
  });

  test("keeps network discovery state shareable and recoverable", () => {
    const network = readFileSync("src/routes/network.tsx", "utf8");
    expect(network).toContain("validateSearch");
    expect(network).toContain("Search canonical portfolio identities");
    expect(network).toContain("Reset network");
    expect(network).toContain('aria-live="polite"');
  });
});
