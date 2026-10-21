import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { initializePortfolio, validateStateTree } from "../../scripts/research-pipeline-lib.mjs";

describe("research pipeline", () => {
  test("initializes bound and unresolved projects without inventing completion", () => {
    const root = mkdtempSync(join(tmpdir(), "research-pipeline-"));
    const source = join(root, "source");
    mkdirSync(source);
    writeFileSync(join(source, "README.md"), "real source\n");
    const bindingsPath = join(root, "bindings.json");
    writeFileSync(
      bindingsPath,
      JSON.stringify({
        projects: [
          {
            id: "found",
            name: "Found",
            classification: "RESEARCH",
            evidence_level: "E2",
            source_path: source,
            source_status: "BOUND_DISCOVERED_REPOSITORY",
            binding_note: "fixture",
          },
          {
            id: "missing",
            name: "Missing",
            classification: "RESEARCH",
            evidence_level: "E0",
            source_path: null,
            source_status: "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY",
            binding_note: "fixture",
          },
        ],
      }),
    );
    const result = initializePortfolio({
      now: "2026-10-10T00:00:00.000Z",
      bindingsPath,
      outputRoot: join(root, "pipeline"),
      stateRoot: join(root, "states"),
    });

    expect(result.summary.project_count).toBe(2);
    expect(result.summary.bound_source_count).toBe(1);
    expect(result.summary.unresolved_source_count).toBe(1);
    expect(result.summary.research_complete_count).toBe(0);
    expect(validateStateTree(join(root, "states"))).toEqual([]);
  });

  test("does not overwrite existing canonical state on a second initialization", () => {
    const root = mkdtempSync(join(tmpdir(), "research-pipeline-preserve-"));
    const bindingsPath = join(root, "bindings.json");
    writeFileSync(
      bindingsPath,
      JSON.stringify({
        projects: [
          {
            id: "preserved",
            name: "Preserved",
            classification: "RESEARCH",
            evidence_level: "E0",
            source_path: null,
            source_status: "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY",
            binding_note: "fixture",
          },
        ],
      }),
    );
    const options = {
      now: "2026-10-10T00:00:00.000Z",
      bindingsPath,
      outputRoot: join(root, "pipeline"),
      stateRoot: join(root, "states"),
    };
    initializePortfolio(options);
    const statePath = join(root, "states", "preserved", "STATE.json");
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    state.research_contract.decisions.push({ decision: "user work" });
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

    initializePortfolio({ ...options, now: "2026-10-10T01:00:00.000Z" });
    const after = JSON.parse(readFileSync(statePath, "utf8"));
    expect(after.research_contract.decisions.at(-1).decision).toBe("user work");
  });
});
