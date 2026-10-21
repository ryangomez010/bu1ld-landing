import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateSitemapXml } from "../src/lib/sitemap";

const sitemapPath = resolve(process.cwd(), "public/sitemap.xml");
const generated = generateSitemapXml();

if (process.argv.includes("--check")) {
  const current = readFileSync(sitemapPath, "utf8");
  if (current !== generated) {
    console.error("public/sitemap.xml is out of date. Run `bun run sitemap:generate`.");
    process.exit(1);
  }
  console.log("Sitemap is synchronized with the public route registries.");
} else {
  writeFileSync(sitemapPath, generated);
  console.log(`Generated ${sitemapPath}.`);
}
