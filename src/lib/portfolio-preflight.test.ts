import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

const preflight = await import("../../scripts/portfolio-preflight-lib.mjs");

describe("portfolio preflight", () => {
  test("summarizes git status without hiding deletes or untracked files", () => {
    const summary = preflight.summarizeGitStatus(" M src/app.ts\n D src/old.ts\n?? docs/new.md\n");

    expect(summary.dirty).toBe(true);
    expect(summary.dirty_count).toBe(3);
    expect(summary.deleted_count).toBe(1);
    expect(summary.untracked_count).toBe(1);
  });

  test("detects placeholder and secret-like literals without exposing values", () => {
    const risks = preflight.detectTextRisks(
      'TODO replace SUPABASE_SERVICE_ROLE_KEY="super-secret-service-role-value" before release',
    );

    expect(risks.placeholders.length).toBeGreaterThan(0);
    expect(risks.secrets.length).toBeGreaterThan(0);
    expect(JSON.stringify(risks)).not.toContain("before release");
  });

  test("ignores form placeholder attributes and bare env var names", () => {
    const risks = preflight.detectTextRisks(
      'placeholder="Skill or tag"\nSet SUPABASE_SERVICE_ROLE_KEY in the dashboard',
    );
    expect(risks.placeholders).toEqual([]);
    expect(risks.secrets).toEqual([]);
  });

  test("finds broken local Markdown links", () => {
    const root = mkdtempSync(join(tmpdir(), "portfolio-preflight-"));
    mkdirSync(join(root, "docs"));
    writeFileSync(
      join(root, "docs", "README.md"),
      "[Missing](./missing.md)\n[External](https://example.com)\n",
    );

    const broken = preflight.findBrokenMarkdownLinks(root);

    expect(broken).toEqual([{ file: "docs/README.md", target: "./missing.md" }]);
  });

  test("maps registry entries to repository roots", () => {
    const root = mkdtempSync(join(tmpdir(), "portfolio-registry-"));
    const registryPath = join(root, "PROJECT_REGISTRY.yaml");
    writeFileSync(
      registryPath,
      [
        "projects:",
        "  - id: sample",
        `    path: ${root}`,
        "    classification: PRODUCT",
        "    evidence_level: E4",
        "    recommended_final_disposition: PRODUCT",
        "    missing_work:",
        "      - run live role smoke",
        "",
      ].join("\n"),
    );

    const registry = preflight.parseRegistry(registryPath);
    const entry = preflight.registryEntryForRoot(registry, root);

    expect(entry.id).toBe("sample");
    expect(entry.evidence_level).toBe("E4");
    expect(entry.missing_work).toContain("run live role smoke");
  });

  test("release blockers include dirty state, broken links, secret risks, and registry work", () => {
    const project = {
      git: { dirty: true, dirty_count: 2 },
      package_json_present: true,
      commands: { test: "bun test" },
      classification: "PRODUCT",
      migrations: { sql_count: 0 },
      risks: { secret_risk_count: 1 },
      broken_markdown_links: [{ file: "README.md", target: "./missing.md" }],
      registry_missing_work: ["run live role smoke"],
      evidence_level: "E4",
    };

    const blockers = preflight.projectReleaseBlockers(project);

    expect(blockers).toContain("2 dirty git entries require review");
    expect(blockers).toContain("package project has no build command");
    expect(blockers).toContain("product registry entry has no detected SQL migrations");
    expect(blockers).toContain("secret-like literals require human review");
    expect(blockers).toContain("1 broken local Markdown links detected");
    expect(blockers).toContain("run live role smoke");
  });
});
