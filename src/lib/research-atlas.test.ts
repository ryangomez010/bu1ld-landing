import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { PORTFOLIO_RECORDS } from "@/data/portfolio";
import {
  getRelatedResearchItems,
  getResearchForPortfolioRecord,
  PUBLIC_RESEARCH_PORTFOLIO,
  RESEARCH_ATLAS_SOURCE_REVISION,
} from "@/data/research-portfolio";

describe("public research atlas", () => {
  test("preserves and expands the canonical atlas without duplicate slugs", () => {
    expect(RESEARCH_ATLAS_SOURCE_REVISION).toBe("a5464067d3f154f306d7e3d11d66edcda3e347ef");
    expect(PUBLIC_RESEARCH_PORTFOLIO.length).toBeGreaterThanOrEqual(33);
    expect(new Set(PUBLIC_RESEARCH_PORTFOLIO.map((project) => project.slug)).size).toBe(
      PUBLIC_RESEARCH_PORTFOLIO.length,
    );
  });

  test("keeps every public claim bounded and navigable", () => {
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      expect(project.title.length).toBeGreaterThan(0);
      expect(project.summary.length).toBeGreaterThan(0);
      expect(project.publicStatus.length).toBeGreaterThan(0);
      expect(project.evidenceBoundary.length).toBeGreaterThan(0);
      expect(project.tags.length).toBeGreaterThan(0);
      if (project.repositoryUrl) {
        expect(project.repositoryUrl.startsWith("https://github.com/")).toBe(true);
      }
    }
  });

  test("connects only declared one-to-one control-plane identities", () => {
    const ids = new Set(PORTFOLIO_RECORDS.map((record) => record.id));
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      if (project.portfolioRecordId) {
        expect(ids.has(project.portfolioRecordId)).toBe(true);
        expect(getResearchForPortfolioRecord(project.portfolioRecordId)).toContain(project);
      }
    }
  });

  test("builds bounded related-work paths without returning the current record", () => {
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      const related = getRelatedResearchItems(project.slug);
      expect(related.length).toBeLessThanOrEqual(3);
      expect(related.some((item) => item.slug === project.slug)).toBe(false);
      expect(new Set(related.map((item) => item.slug)).size).toBe(related.length);
    }

    expect(getRelatedResearchItems("missing-record")).toEqual([]);
    expect(getRelatedResearchItems("neurocad", 0)).toEqual([]);
  });

  test("keeps atlas discovery state shareable and links both registries", () => {
    const atlas = readFileSync("src/routes/research-atlas/index.tsx", "utf8");
    const detail = readFileSync("src/routes/research-atlas/$slug.tsx", "utf8");
    const portfolio = readFileSync("src/routes/portfolio/$projectId.tsx", "utf8");

    expect(atlas).toContain("validateSearch");
    expect(atlas).toContain("Follow a research path");
    expect(detail).toContain("Continue through related work");
    expect(portfolio).toContain("Explicit atlas connection");
  });

  test("includes every research page in navigation and the sitemap", () => {
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    const navigation = readFileSync("src/lib/public-navigation.ts", "utf8");
    const footer = readFileSync("src/components/landing/SiteFooter.tsx", "utf8");

    expect(navigation).toContain('{ label: "Research", to: "/research-atlas" }');
    expect(footer).toContain('to="/research-atlas"');
    expect(sitemap).toContain("https://thebu1ld.com/research-atlas");
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      expect(sitemap).toContain(`https://thebu1ld.com/research-atlas/${project.slug}`);
    }
  });
});
