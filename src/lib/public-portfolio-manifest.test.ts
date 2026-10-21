import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { PORTFOLIO_RECORDS, WEBSITE_DESTINATIONS } from "@/data/portfolio";
import { PUBLIC_RESEARCH_PORTFOLIO } from "@/data/research-portfolio";
import {
  generatePublicPortfolioManifestJson,
  getPublicPortfolioManifest,
  PUBLIC_PORTFOLIO_MANIFEST_PATH,
} from "@/lib/public-portfolio-manifest";

describe("public portfolio manifest", () => {
  test("stays synchronized with the typed public registries", () => {
    expect(readFileSync("public/portfolio-manifest.json", "utf8")).toBe(
      generatePublicPortfolioManifestJson(),
    );

    const manifest = getPublicPortfolioManifest();
    expect(manifest.destinations).toHaveLength(WEBSITE_DESTINATIONS.length);
    expect(manifest.portfolioIdentities).toHaveLength(PORTFOLIO_RECORDS.length);
    expect(manifest.researchAtlas).toHaveLength(PUBLIC_RESEARCH_PORTFOLIO.length);
    expect(manifest.counts.portfolioIdentities).toBe(20);
    expect(manifest.counts.researchLines).toBe(PUBLIC_RESEARCH_PORTFOLIO.length);
  });

  test("publishes stable public URLs without local or secret-bearing paths", () => {
    const serialized = generatePublicPortfolioManifestJson();
    expect(PUBLIC_PORTFOLIO_MANIFEST_PATH).toBe("/portfolio-manifest.json");
    expect(serialized).not.toMatch(/\/Volumes\/|\/Users\/|file:\/\/|localhost/i);
    expect(serialized).not.toMatch(/supabase_(service|anon)|api[_-]?key|access[_-]?token/i);

    for (const record of getPublicPortfolioManifest().portfolioIdentities) {
      expect(record.profileUrl).toBe(`https://thebu1ld.com/portfolio/${record.id}`);
    }
    for (const record of getPublicPortfolioManifest().researchAtlas) {
      expect(record.profileUrl).toBe(`https://thebu1ld.com/research-atlas/${record.slug}`);
    }
  });

  test("keeps negative and incomplete evidence language in the export", () => {
    const manifest = getPublicPortfolioManifest();
    expect(manifest.evidenceNotice).toContain("distinct from scientific validation");
    expect(
      manifest.researchAtlas.some((record) => /negative|null|failed/i.test(record.publicStatus)),
    ).toBe(true);
    expect(manifest.portfolioIdentities.every((record) => record.limitations.length > 0)).toBe(
      true,
    );
  });
});
