import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { memberWorkspaceStats } from "./project-collaboration";

describe("memberWorkspaceStats", () => {
  test("keeps verification states separate", () => {
    expect(
      memberWorkspaceStats([
        { verification_status: "submitted" },
        { verification_status: "verified" },
        { verification_status: "verified" },
        { verification_status: "needs_changes" },
      ]),
    ).toEqual({ total: 4, submitted: 1, verified: 2, needsChanges: 1 });
  });

  test("reports an honest empty state", () => {
    expect(memberWorkspaceStats([])).toEqual({
      total: 0,
      submitted: 0,
      verified: 0,
      needsChanges: 0,
    });
  });

  test("keeps the workspace member-only and evidence-gated", () => {
    const route = readFileSync("src/routes/workspace.tsx", "utf8");
    expect(route).toContain("<RequireMember>");
    expect(route).toContain("Submit for verification");
    expect(route).toContain("is not a verified outcome");
    expect(route).toContain("resubmitContribution");
    expect(route).not.toContain("verifyContribution(");
  });

  test("accepts a bounded project slug so a member can open the right evidence log", () => {
    const route = readFileSync("src/routes/workspace.tsx", "utf8");
    const applicationSteps = readFileSync("src/components/member/ApplicationNextSteps.tsx", "utf8");

    expect(route).toContain("validateSearch");
    expect(route).toContain("search.project");
    expect(route).toContain("project.slug === search.project");
    expect(applicationSteps).toContain('to="/workspace"');
    expect(applicationSteps).toContain("search={{ project: projectSlug }}");
  });
});
