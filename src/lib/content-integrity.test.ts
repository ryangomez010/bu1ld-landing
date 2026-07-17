import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const root = resolve(import.meta.dir, "../..");

const claimRiskPatterns = [
  /\bMIT\b/,
  /\bStanford\b/,
  /\bUC Physics\b/i,
  /\bpaying (customers|teams|users)\b/i,
  /\bspun out\b/i,
  /\bA100\b/,
  /\bunder \d+ hours?\b/i,
];

describe("seed content integrity", () => {
  test("does not ship unsupported affiliation, customer, or benchmark-style claims", () => {
    const files = [
      resolve(root, "src/data/seed/projects.ts"),
      resolve(root, "src/data/seed/content.ts"),
      resolve(root, "supabase/seed-data.sql"),
    ];

    const offenders = files.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return claimRiskPatterns
        .filter((pattern) => pattern.test(text))
        .map((pattern) => `${file.replace(`${root}/`, "")}: ${pattern}`);
    });

    expect(offenders).toEqual([]);
  });
});
