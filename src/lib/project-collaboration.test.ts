import { describe, expect, test } from "bun:test";

import { canReviewContribution } from "./project-collaboration";
import type { ProjectContribution } from "./types";

const base: ProjectContribution = {
  id: "c1",
  project_id: "p1",
  milestone_id: null,
  contributor_id: "author",
  contribution_type: "research",
  title: "Result",
  summary: "A verified contribution summary that is long enough.",
  evidence_url: null,
  visibility: "team",
  verification_status: "submitted",
  verified_by: null,
  verified_at: null,
  assigned_reviewer_id: "reviewer-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("canReviewContribution", () => {
  test("allows project lead or admin", () => {
    expect(canReviewContribution(base, "anyone", true)).toBe(true);
  });

  test("allows the assigned reviewer", () => {
    expect(canReviewContribution(base, "reviewer-1", false)).toBe(true);
  });

  test("denies unassigned members", () => {
    expect(canReviewContribution(base, "other-member", false)).toBe(false);
  });

  test("denies anonymous users", () => {
    expect(canReviewContribution(base, undefined, false)).toBe(false);
  });

  test("denies self-review even for leads and admins", () => {
    expect(canReviewContribution(base, "author", true)).toBe(false);
  });

  test("denies self-review when assigned as own reviewer", () => {
    expect(
      canReviewContribution({ ...base, assigned_reviewer_id: "author" }, "author", false),
    ).toBe(false);
  });
});
