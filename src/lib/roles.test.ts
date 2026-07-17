import { afterEach, describe, expect, test } from "bun:test";

import {
  describeAccess,
  hasInstitutionalRole,
  isAdministrator,
  isLabLead,
  isProjectLead,
  isReviewer,
} from "./roles";
import type { Profile } from "./types";

function profile(partial: Partial<Profile>): Profile {
  return {
    id: "u1",
    full_name: "Test",
    bio: null,
    background: null,
    interests: [],
    github_url: null,
    linkedin_url: null,
    timezone: null,
    onboarding_completed: true,
    role: "member",
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("roles", () => {
  afterEach(() => {});

  test("visitor has no access", () => {
    const access = describeAccess(null);
    expect(access.memberRole).toBe("visitor");
    expect(access.canAdmin).toBe(false);
  });

  test("legacy admin is administrator", () => {
    expect(isAdministrator(profile({ role: "admin" }))).toBe(true);
    expect(isProjectLead(profile({ role: "admin" }))).toBe(true);
    expect(isReviewer(profile({ role: "admin" }))).toBe(true);
  });

  test("institutional administrator grants admin UI access", () => {
    const p = profile({ institutional_roles: ["administrator"] });
    expect(isAdministrator(p)).toBe(true);
    expect(isLegacySafe(p)).toBe(false);
  });

  test("project_lead legacy and institutional", () => {
    expect(isProjectLead(profile({ role: "project_lead" }))).toBe(true);
    expect(isProjectLead(profile({ institutional_roles: ["project_lead"] }))).toBe(true);
    expect(isProjectLead(profile({ institutional_roles: ["lab_lead"] }))).toBe(true);
  });

  test("reviewer and lab_lead helpers", () => {
    expect(isReviewer(profile({ institutional_roles: ["reviewer"] }))).toBe(true);
    expect(isLabLead(profile({ institutional_roles: ["lab_lead"] }))).toBe(true);
    expect(hasInstitutionalRole(profile({ institutional_roles: ["mentor"] }), "mentor")).toBe(true);
  });
});

function isLegacySafe(p: Profile): boolean {
  return p.role === "admin";
}
