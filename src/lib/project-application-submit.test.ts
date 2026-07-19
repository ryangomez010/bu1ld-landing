import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("project application submission contract", () => {
  test("uses the atomic RPC instead of a split application/answer write", () => {
    const source = readFileSync("src/lib/projects.ts", "utf8");
    const start = source.indexOf("export async function applyToProject");
    const end = source.indexOf("export async function fetchMyApplicationStatusMap");
    const implementation = source.slice(start, end);

    expect(implementation).toContain('supabase.rpc("submit_project_application"');
    expect(implementation).not.toContain('.from("project_applications")');
    expect(implementation).not.toContain("saveApplicationAnswers");
  });

  test("keeps client and database pitch limits aligned", () => {
    const source = readFileSync("src/lib/projects.ts", "utf8");
    const sql = readFileSync("supabase/phase33.sql", "utf8");
    expect(source).toContain("safePitch.length < 20");
    expect(sql).toContain("char_length(safe_pitch) not between 20 and 4000");
  });
});
