import { describe, expect, test } from "bun:test";

import { buildMemberOpportunities, filterMemberOpportunities } from "./member-opportunities";
import type { Job, MlEvent, Program, Project } from "./types";

const project: Project = {
  id: "p1",
  slug: "open-project",
  title: "Open project",
  description: "A bounded research project.",
  type: "research",
  status: "open",
  skills_needed: [],
  tags: ["ml"],
  lead_id: "lead",
  lead_name: "Lead",
  capacity: 3,
  team_count: 1,
  published: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};
const program: Program = {
  id: "g1",
  slug: "cohort",
  title: "Cohort",
  program_type: "cohort",
  summary: "A live cohort.",
  application_instructions: null,
  starts_at: null,
  ends_at: null,
  capacity: 10,
  applications_open_at: "2026-10-01T00:00:00Z",
  applications_close_at: "2026-11-01T00:00:00Z",
  published: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};
const job: Job = {
  id: "j1",
  slug: "research-role",
  title: "Research role",
  company: "BU1LD",
  location: "Remote",
  source: "internal",
  employment_type: "Part-time",
  description: "A scoped role.",
  url: null,
  tags: ["research"],
  published: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};
const event: MlEvent = {
  id: "e1",
  slug: "reading-group",
  title: "Reading group",
  summary: "Discuss a paper.",
  location: null,
  start_date: "2026-10-25",
  end_date: "2026-10-25",
  topics: ["research"],
  prep_notes: null,
  resources: [],
  deadlines: [],
  url: null,
  published: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  starts_at: "2026-10-25T10:00:00Z",
  ends_at: "2026-10-25T11:00:00Z",
  registration_state: "open",
  verified_at: "2026-10-01T00:00:00Z",
};

describe("member opportunities", () => {
  test("uses only live record state to choose an actionable call to action", () => {
    const records = buildMemberOpportunities(
      { projects: [project], programs: [program], jobs: [job], events: [event] },
      new Date("2026-10-20T00:00:00Z"),
    );
    expect(records.map((record) => `${record.kind}:${record.state}`)).toEqual([
      "project:actionable",
      "program:actionable",
      "job:actionable",
      "event:actionable",
    ]);
    expect(records.find((record) => record.kind === "project")?.href).toBe(
      "/projects/open-project",
    );
  });

  test("does not promote full, closed, or operationally unconfirmed records as available", () => {
    const records = buildMemberOpportunities(
      {
        projects: [{ ...project, capacity: 1, team_count: 1 }],
        programs: [{ ...program, applications_close_at: "2026-10-15T00:00:00Z" }],
        jobs: [],
        events: [{ ...event, verified_at: null }],
      },
      new Date("2026-10-20T00:00:00Z"),
    );
    expect(records.map((record) => record.state)).toEqual(["browse", "browse", "upcoming"]);
  });

  test("combines type, operational state, and bounded text search", () => {
    const records = buildMemberOpportunities(
      { projects: [project], programs: [program], jobs: [job], events: [event] },
      new Date("2026-10-20T00:00:00Z"),
    );
    expect(
      filterMemberOpportunities(records, { kind: "job", state: "actionable", query: "remote" }).map(
        (item) => item.id,
      ),
    ).toEqual(["job:j1"]);
    expect(
      filterMemberOpportunities(records, { kind: "all", state: "browse", query: "" }),
    ).toHaveLength(0);
  });
});
