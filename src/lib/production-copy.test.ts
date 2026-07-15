import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const sourceRoot = resolve(import.meta.dir, "..");
const blocked = [
  /Supabase is not configured yet/i,
  /Supabase is not configured/i,
  /Add Supabase env vars/i,
  /Copy\s+.*\.env\.example/i,
  /role\s*=\s*['"]admin['"]/i,
  /phase2\.sql/i,
  /Generate draft/i,
  /coming soon/i,
  /lorem ipsum/i,
  /\bTBD\b/i,
  /sample issue/i,
  /not implemented/i,
];

function collectFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  if (!stat.isDirectory()) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(path, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
}

describe("production copy", () => {
  test("does not expose setup instructions or placeholder language in the app", () => {
    const offenders = collectFiles(sourceRoot)
      .filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith("production-copy.test.ts"))
      .flatMap((file) => {
        const text = readFileSync(file, "utf8");
        return blocked
          .filter((pattern) => pattern.test(text))
          .map((pattern) => `${file.replace(`${sourceRoot}/`, "")}: ${pattern}`);
      });

    expect(offenders).toEqual([]);
  });
});
