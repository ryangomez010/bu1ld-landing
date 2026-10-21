import { expect, test } from "bun:test";

test("public publications and evidence distinguish confirmed empty data from unavailable or partial data", () => {
  // Isolate Supabase mocks from authorization tests and concurrent test modules.
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    let connected = false;
    let rejected = false;
    let responses = {};
    const requests = [];
    const client = {
      from(table) {
        const query = {
          select(columns) { requests.push([table, "select", columns]); return this; },
          eq(key, value) { requests.push([table, "eq", key, value]); return this; },
          in() { return this; }, order() { return this; }, limit() { return this; },
          async abortSignal(signal) {
            requests.push([table, "bounded", signal instanceof AbortSignal]);
            if (rejected) throw new Error("timeout");
            return responses[table] ?? { data: [], error: null };
          },
        };
        return query;
      },
    };
    mock.module("./src/lib/supabase", () => ({ getSupabase: () => connected ? client : null, checkSupabaseConfigured: () => connected }));
    mock.module("./src/lib/supabase-fallback", () => ({
      isDemoMode: () => true,
      withSeedFallback: (rows, seeds) => rows.length ? rows : seeds,
      resolveSeedItem: (item, fallback) => item ?? fallback(),
    }));
    const { fetchPublicPapers } = await import("./src/lib/content");
    const { fetchVerifiedInstitutionalClaims } = await import("./src/lib/institutional-claims");
    const { fetchPublicProjectOutputs } = await import("./src/lib/project-collaboration");
    const calls = [
      () => fetchPublicPapers({ throwOnUnavailable: true }),
      () => fetchVerifiedInstitutionalClaims({ throwOnUnavailable: true }),
      () => fetchPublicProjectOutputs(24, { throwOnUnavailable: true }),
    ];
    const capture = (call) => call().then(rows => ({ ok: true, count: rows.length })).catch(() => ({ ok: false }));
    const run = () => Promise.all(calls.map(capture));
    const unavailable = await run();
    const legacyUnavailable = [
      (await fetchPublicPapers()).length > 0,
      (await fetchVerifiedInstitutionalClaims()).length,
      (await fetchPublicProjectOutputs()).length,
    ];
    connected = true;
    const empty = await run();
    responses = {
      papers: { data: [{ id: "paper", slug: "paper", title: "A published review", published: true, review_status: "published" }], error: null },
      institutional_claims: { data: [{ id: "claim", claim_type: "outcome", statement: "Verified", status: "verified" }], error: null },
      project_milestones: { data: [{ id: "milestone", project_id: "project", title: "Published output", status: "completed", visibility: "public", updated_at: "2026-10-16" }], error: null },
      projects: { data: [{ id: "project", slug: "project", title: "Project", type: "research" }], error: null },
    };
    const loaded = await run();
    responses.project_contributions = { data: null, error: { message: "partial failure" } };
    const partial = await capture(calls[2]);
    responses.project_contributions = { data: [], error: null };
    responses.projects = { data: null, error: { message: "project lookup failure" } };
    const joinFailure = await capture(calls[2]);
    responses = Object.fromEntries(["papers", "institutional_claims", "project_milestones", "project_contributions"].map(table => [table, { data: null, error: { message: "request failed" } }]));
    const failures = await run();
    rejected = true;
    const timeouts = await run();
    console.log(JSON.stringify({ unavailable, legacyUnavailable, empty, loaded, partial, joinFailure, failures, timeouts, requests }));
  `,
    ],
    { cwd: process.cwd(), timeout: 15_000 },
  );

  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  for (const result of [output.unavailable, output.failures, output.timeouts]) {
    expect(result).toEqual([{ ok: false }, { ok: false }, { ok: false }]);
  }
  expect(output.empty).toEqual(Array.from({ length: 3 }, () => ({ ok: true, count: 0 })));
  expect(output.loaded).toEqual(Array.from({ length: 3 }, () => ({ ok: true, count: 1 })));
  expect(output.legacyUnavailable).toEqual([true, 0, 0]);
  expect(output.partial).toEqual({ ok: false });
  expect(output.joinFailure).toEqual({ ok: false });
  for (const request of [
    ["papers", "eq", "published", true],
    ["papers", "eq", "review_status", "published"],
    ["institutional_claims", "eq", "status", "verified"],
    ["project_milestones", "eq", "visibility", "public"],
    ["project_milestones", "eq", "status", "completed"],
    ["project_contributions", "eq", "visibility", "public"],
    ["project_contributions", "eq", "verification_status", "verified"],
    ["projects", "eq", "published", true],
  ])
    expect(output.requests).toContainEqual(request);
  for (const table of [
    "papers",
    "institutional_claims",
    "project_milestones",
    "project_contributions",
    "projects",
  ]) {
    expect(output.requests).toContainEqual([table, "bounded", true]);
  }
});
