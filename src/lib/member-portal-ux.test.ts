import { describe, expect, test } from "bun:test";
import {
  activeMemberDestination,
  MEMBER_NAV_GROUPS,
  memberRoleNavigation,
} from "./member-navigation";
import { filterWorkspaceEvidence } from "./workspace-view";

const destinations = MEMBER_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to));

describe("member navigation", () => {
  test("chooses only the deepest matching destination", () => {
    expect(activeMemberDestination("/saved/collections", destinations)).toBe("/saved/collections");
    expect(activeMemberDestination("/research/highlights/", destinations)).toBe(
      "/research/highlights",
    );
    expect(activeMemberDestination("/projects/example", destinations)).toBe("/projects");
    expect(
      activeMemberDestination("/projects/manage/example", [...destinations, "/projects/manage"]),
    ).toBe("/projects/manage");
  });

  test("matches path segments rather than partial names", () => {
    expect(activeMemberDestination("/research-atlas", destinations)).toBeNull();
    expect(activeMemberDestination("/membership", destinations)).toBeNull();
    expect(activeMemberDestination("/savedness", destinations)).toBeNull();
    expect(activeMemberDestination("/dashboard/", destinations)).toBe("/dashboard");
  });

  test("shows management destinations only for the matching role", () => {
    expect(memberRoleNavigation(null)).toEqual([]);
    expect(memberRoleNavigation({ role: "member", institutional_roles: [] })).toEqual([]);
    expect(
      memberRoleNavigation({ role: "member", institutional_roles: ["reviewer"] }).map(
        (item) => item.to,
      ),
    ).toEqual(["/research/submit"]);
    expect(
      memberRoleNavigation({ role: "project_lead", institutional_roles: [] }).map(
        (item) => item.to,
      ),
    ).toEqual(["/projects/manage"]);
    expect(
      memberRoleNavigation({ role: "admin", institutional_roles: [] }).map((item) => item.to),
    ).toEqual(["/projects/manage", "/research/submit", "/admin"]);
  });
});

const entries = [
  {
    project_id: "alpha",
    verification_status: "needs_changes" as const,
    title: "Baseline run",
    summary: "Three fixed seeds",
    milestone_title: "Reproduction",
    contribution_type: "experiment" as const,
    verification_note: "Attach the raw artifact",
  },
  {
    project_id: "alpha",
    verification_status: "verified" as const,
    title: "Keyboard review",
    summary: "Navigation audit",
    milestone_title: null,
    contribution_type: "review" as const,
    verification_note: null,
  },
  {
    project_id: "beta",
    verification_status: "submitted" as const,
    title: "Baseline run",
    summary: "Three fixed seeds",
    milestone_title: null,
    contribution_type: "experiment" as const,
    verification_note: null,
  },
];

describe("workspace evidence filters", () => {
  test("combines project, status, and words from reviewer notes and milestones", () => {
    expect(
      filterWorkspaceEvidence(entries, "alpha", "needs_changes", "  RAW reproduction "),
    ).toEqual([entries[0]]);
    expect(filterWorkspaceEvidence(entries, "alpha", "verified", "raw")).toEqual([]);
    expect(filterWorkspaceEvidence(entries, "beta", "all", "baseline")).toEqual([entries[2]]);
  });

  test("clearing filters restores the selected project's full log without changing records", () => {
    const original = structuredClone(entries);
    expect(filterWorkspaceEvidence(entries, "alpha", "all", "  ")).toEqual(entries.slice(0, 2));
    expect(entries).toEqual(original);
    expect(filterWorkspaceEvidence([], "alpha", "all", "")).toEqual([]);
    expect(filterWorkspaceEvidence(entries, "missing", "all", "")).toEqual([]);
  });
});
