import { expect, test } from "bun:test";

test("mentorship distinguishes outages, empty rows, stale decisions and persisted decisions", () => {
  // Keep the mock client isolated from the rest of the authorization suite.
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    let connected = false;
    let response = { data: [], error: null };
    const queries = [];
    const client = { from(table) {
      const query = {
        select(value) { queries.push([table, "select", value]); return this; },
        eq(key, value) { queries.push([table, "eq", key, value]); return this; },
        gt(key, value) { queries.push([table, "gt", key, value]); return this; },
        update(value) { queries.push([table, "update", value]); return this; },
        or() { return this; }, order() { return this; }, maybeSingle() { return this; },
        abortSignal(signal) {
          queries.push([table, "bounded", signal instanceof AbortSignal]);
          return Promise.resolve(response);
        },
      };
      return query;
    }};
    mock.module("./src/lib/supabase", () => ({ getSupabase: () => connected ? client : null }));
    const { fetchMentors, fetchMyMentorProfile, fetchMyMentorshipRequests, decideMentorshipRequest } = await import("./src/lib/mentorship");
    const reads = [fetchMentors, () => fetchMyMentorProfile("mentor"), () => fetchMyMentorshipRequests("member")];
    const capture = (fn) => fn().then(data => ({ ok: true, data })).catch(() => ({ ok: false }));
    const disconnected = await Promise.all(reads.map(capture));
    connected = true;
    response = { data: null, error: { message: "permission denied" } };
    const denied = await Promise.all(reads.map(capture));
    response = { data: [], error: null };
    const empty = await fetchMentors();
    response = { data: null, error: null };
    const noProfile = await fetchMyMentorProfile("mentor");
    const staleDecision = await decideMentorshipRequest("request", "accepted", "note");
    response = { data: { id: "request" }, error: null };
    const savedDecision = await decideMentorshipRequest("request", "accepted", "note");
    console.log(JSON.stringify({ disconnected, denied, empty, noProfile, staleDecision, savedDecision, queries }));
    `,
    ],
    { cwd: process.cwd(), timeout: 15000 },
  );
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(new TextDecoder().decode(result.stdout));
  expect(output.disconnected).toEqual([{ ok: false }, { ok: false }, { ok: false }]);
  expect(output.denied).toEqual([{ ok: false }, { ok: false }, { ok: false }]);
  expect(output.empty).toEqual([]);
  expect(output.noProfile).toBeNull();
  expect(output.staleDecision.error).toContain("Reload");
  expect(output.savedDecision.error).toBeNull();
  expect(output.queries).toContainEqual(["mentor_profiles", "gt", "monthly_capacity", 0]);
  expect(output.queries).toContainEqual(["mentorship_requests", "select", "id"]);
  expect(output.queries.filter((query: unknown[]) => query[1] === "bounded").length).toBe(7);
  expect(
    output.queries
      .filter((query: unknown[]) => query[1] === "bounded")
      .every((query: unknown[]) => query[2]),
  ).toBe(true);
});
