import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { generatePublicPortfolioManifestJson } from "../src/lib/public-portfolio-manifest";

const manifestPath = resolve(process.cwd(), "public/portfolio-manifest.json");
const generated = generatePublicPortfolioManifestJson();

if (process.argv.includes("--check")) {
  const current = readFileSync(manifestPath, "utf8");
  if (current !== generated) {
    console.error(
      "public/portfolio-manifest.json is out of date. Run `bun run manifest:generate`.",
    );
    process.exit(1);
  }
  console.log("Public portfolio manifest is synchronized with its typed registries.");
} else {
  writeFileSync(manifestPath, generated);
  console.log(`Generated ${manifestPath}.`);
}
