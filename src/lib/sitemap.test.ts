import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { PORTFOLIO_RECORDS } from "@/data/portfolio";
import { PUBLIC_RESEARCH_PORTFOLIO } from "@/data/research-portfolio";
import { generateSitemapXml, getPublicSitemapEntries } from "@/lib/sitemap";

describe("public sitemap", () => {
  test("is generated exactly from the public route registries", () => {
    expect(readFileSync("public/sitemap.xml", "utf8")).toBe(generateSitemapXml());
  });

  test("contains every canonical profile and atlas record exactly once", () => {
    const entries = getPublicSitemapEntries();
    const paths = entries.map((entry) => entry.path);

    expect(paths).toContain("/guides");
    expect(paths).toContain("/papers");
    expect(paths).toContain("/events");
    expect(paths).toContain("/forms");
    expect(new Set(paths).size).toBe(paths.length);
    for (const record of PORTFOLIO_RECORDS) {
      expect(paths.filter((path) => path === `/portfolio/${record.id}`)).toHaveLength(1);
    }
    for (const item of PUBLIC_RESEARCH_PORTFOLIO) {
      expect(paths.filter((path) => path === `/research-atlas/${item.slug}`)).toHaveLength(1);
    }
  });

  test("excludes private, authentication, and member surfaces", () => {
    const paths = getPublicSitemapEntries().map((entry) => entry.path);
    for (const privatePath of [
      "/login",
      "/signup",
      "/dashboard",
      "/workspace",
      "/admin",
      "/onboarding",
    ]) {
      expect(paths).not.toContain(privatePath);
    }
  });
});
