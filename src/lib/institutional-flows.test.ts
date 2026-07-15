import { describe, expect, test } from "bun:test";

import { programApplicationState } from "./programs";
import { isProjectLead } from "./projects";
import type { Program } from "./types";

const baseProgram: Program = {
  id: "program-1",
  slug: "technical-cohort",
  title: "Technical cohort",
  program_type: "cohort",
  summary: "A cohort with an explicit research or builder output.",
  application_instructions: null,
  starts_at: null,
  ends_at: null,
  capacity: 12,
  published: true,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

describe("institutional authorization helpers", () => {
  test("treats admins and explicit project leads as project leads", () => {
    expect(isProjectLead("admin")).toBe(true);
    expect(isProjectLead("project_lead")).toBe(true);
  });

  test("allows the institutional project_lead role without broadening ordinary members", () => {
    expect(isProjectLead("member", ["project_lead"])).toBe(true);
    expect(isProjectLead("member", ["researcher", "mentor"])).toBe(false);
    expect(isProjectLead(undefined, ["researcher"])).toBe(false);
  });
});

describe("program application windows", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  test("opens programs without explicit application windows", () => {
    expect(programApplicationState(baseProgram, now)).toBe("open");
  });

  test("marks future windows as upcoming", () => {
    expect(
      programApplicationState(
        {
          ...baseProgram,
          applications_open_at: "2026-07-20T00:00:00.000Z",
          applications_close_at: "2026-08-01T00:00:00.000Z",
        },
        now,
      ),
    ).toBe("upcoming");
  });

  test("marks active windows as open", () => {
    expect(
      programApplicationState(
        {
          ...baseProgram,
          applications_open_at: "2026-07-01T00:00:00.000Z",
          applications_close_at: "2026-08-01T00:00:00.000Z",
        },
        now,
      ),
    ).toBe("open");
  });

  test("closes programs at the close timestamp", () => {
    expect(
      programApplicationState(
        {
          ...baseProgram,
          applications_open_at: "2026-07-01T00:00:00.000Z",
          applications_close_at: "2026-07-15T12:00:00.000Z",
        },
        now,
      ),
    ).toBe("closed");
  });
});
