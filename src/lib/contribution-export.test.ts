import { describe, expect, test } from "bun:test";

import { serializeContributionExport, type ContributionExportRow } from "./contribution-export";

const row: ContributionExportRow = {
  id: "contribution-1",
  project_id: "project-1",
  title: "Reproduction report",
  contribution_type: "research",
  verification_status: "verified",
  evidence_url: "https://example.org/report",
  summary: "Reproduced the baseline and documented the observed failure boundary.",
  verified_at: "2026-07-18T12:00:00.000Z",
  created_at: "2026-07-17T12:00:00.000Z",
};

describe("contribution export", () => {
  test("serializes provenance and verification state", () => {
    const exportedAt = "2026-07-18T13:00:00.000Z";
    const parsed = JSON.parse(serializeContributionExport([row], exportedAt));

    expect(parsed.exported_at).toBe(exportedAt);
    expect(parsed.rows).toEqual([row]);
  });

  test("supports an honest empty export", () => {
    const parsed = JSON.parse(serializeContributionExport([], "2026-07-18T13:00:00.000Z"));
    expect(parsed.rows).toEqual([]);
  });
});
