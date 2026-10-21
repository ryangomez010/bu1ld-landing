import { expect, test } from "bun:test";
import { applicationAnalyticsProps, applicationReceiptMatches } from "./application-analytics";

const userId = "11111111-1111-4111-8111-111111111111";
const opportunityId = "22222222-2222-4222-8222-222222222222";
const receipt = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: userId,
  project_id: opportunityId,
  status: "pending",
  created_at: "2026-10-16T12:00:00Z",
};

test("application confirmation rejects missing, mismatched, local and malformed receipts", () => {
  expect(applicationReceiptMatches(receipt, "project", userId, opportunityId)).toBe(true);
  for (const invalid of [
    null,
    [],
    {},
    { ...receipt, id: "local-app-1" },
    { ...receipt, user_id: opportunityId },
    { ...receipt, project_id: userId },
    { ...receipt, status: "accepted" },
    { ...receipt, created_at: "not-a-date" },
    { ...receipt, created_at: null },
  ]) {
    expect(applicationReceiptMatches(invalid, "project", userId, opportunityId)).toBe(false);
  }
  expect(applicationReceiptMatches(receipt, "program", userId, opportunityId)).toBe(false);
  expect(
    applicationReceiptMatches(
      { ...receipt, program_id: opportunityId },
      "program",
      userId,
      opportunityId,
    ),
  ).toBe(true);
  expect(applicationAnalyticsProps("project")).toEqual({
    opportunity_kind: "project",
    application_path: "internal",
  });
});

test("only durable matching remote submissions emit completion and pending pitch edits retain owner filters", () => {
  // Isolate module mocks from the remaining authorization and privacy tests.
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    let connected = true;
    let response = { data: null, error: null };
    const events = [];
    const queries = [];
    const client = {
      async rpc(name, args) { queries.push(["rpc", name, args]); return response; },
      from(table) { queries.push(["from", table]); return this; },
      insert(value) { queries.push(["insert", value]); return this; },
      update(value) { queries.push(["update", value]); return this; },
      select(value) { queries.push(["select", value]); return this; },
      eq(key, value) { queries.push(["eq", key, value]); return this; },
      async single() { return response; },
      then(resolve, reject) { return Promise.resolve(response).then(resolve, reject); },
    };
    mock.module("./src/lib/supabase", () => ({ getSupabase: () => connected ? client : null, checkSupabaseConfigured: () => connected }));
    mock.module("./src/lib/analytics", () => ({ trackEvent: (name, props) => events.push({ name, props }) }));
    const { applyToProject, updateApplicationPitch } = await import("./src/lib/projects");
    const { applyToProgram } = await import("./src/lib/programs");
    const userId = ${JSON.stringify(userId)};
    const opportunityId = ${JSON.stringify(opportunityId)};
    const receipt = ${JSON.stringify(receipt)};
    const project = { id: opportunityId, slug: "test", title: "Test", status: "open", description: "Test", tags: [], skills_needed: [], published: true };
    const pitch = "Private applicant pitch and answers must never enter analytics.";
    const submitProject = () => applyToProject(userId, project, pitch, {}, [{ questionId: opportunityId, answer: "Private answer" }]);
    const submitProgram = () => applyToProgram(userId, opportunityId, pitch);
    const failures = [];
    for (const submit of [submitProject, submitProgram]) {
      for (const next of [
        { data: null, error: null },
        { data: { ...receipt, program_id: opportunityId, user_id: opportunityId }, error: null },
        { data: receipt, error: { message: "denied" } },
      ]) {
        response = next;
        failures.push(await submit());
      }
    }
    const beforeSuccess = events.length;
    response = { data: receipt, error: null };
    const savedProject = await submitProject();
    response = { data: { ...receipt, program_id: opportunityId }, error: null };
    const savedProgram = await submitProgram();
    const beforeEdit = queries.length;
    response = { data: null, error: null };
    const edited = await updateApplicationPitch(userId, receipt.id, "Revised pending pitch.");
    const editQueries = queries.slice(beforeEdit);
    const emptyPitch = await updateApplicationPitch(userId, receipt.id, " ");
    const values = new Map();
    globalThis.window = {};
    globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    connected = false;
    const local = await submitProject();
    const unavailableProgram = await submitProgram();
    console.log(JSON.stringify({ failures, beforeSuccess, savedProject, savedProgram, edited, editQueries, emptyPitch, local, unavailableProgram, events, queries }));
  `,
    ],
    { cwd: process.cwd(), timeout: 15000 },
  );
  expect(result.stderr.toString()).toBe("");
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.beforeSuccess).toBe(0);
  for (const failure of output.failures) expect(failure.error).toBeTruthy();
  expect(output.savedProject).toEqual({ error: null });
  expect(output.savedProgram).toEqual({ error: null });
  expect(output.local).toEqual({ error: null });
  expect(output.unavailableProgram.error).toBeTruthy();
  expect(output.events).toEqual([
    {
      name: "application_submitted",
      props: { opportunity_kind: "project", application_path: "internal" },
    },
    {
      name: "application_submitted",
      props: { opportunity_kind: "program", application_path: "internal" },
    },
  ]);
  expect(output.queries).toContainEqual(["select", "id, program_id, user_id, status, created_at"]);
  expect(output.edited).toEqual({ error: null });
  expect(output.emptyPitch.error).toBe("Pitch is required.");
  expect(output.editQueries).toContainEqual(["eq", "id", receipt.id]);
  expect(output.editQueries).toContainEqual(["eq", "user_id", userId]);
  expect(output.editQueries).toContainEqual(["eq", "status", "pending"]);
  expect(output.editQueries.find((query: unknown[]) => query[0] === "update")[1].pitch).toBe(
    "Revised pending pitch.",
  );
});
