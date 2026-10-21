import { expect, test } from "bun:test";

test("public catalog distinguishes empty results, missing service, and failed requests without exposing private columns", () => {
  // Keep module mocks in their own process so other authorization tests use real modules.
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    let connected = false;
    let demo = true;
    let response = { data: [], error: null };
    let rejected = false;
    const requests = [];
    const client = {
      from(table) { requests.push(["from", table]); return this; },
      select(columns) { requests.push(["select", columns]); return this; },
      eq(key, value) { requests.push(["eq", key, value]); return this; },
      order() { return this; },
      async abortSignal() { if (rejected) throw new Error("timeout"); return response; },
    };
    mock.module("./src/lib/supabase", () => ({
      getSupabase: () => connected ? client : null,
      checkSupabaseConfigured: () => connected,
    }));
    mock.module("./src/lib/public-supabase", () => ({ getPublicSupabase: () => connected ? client : null }));
    mock.module("./src/lib/supabase-fallback", () => ({
      isDemoMode: () => demo,
      withSeedFallback: (rows, seeds) => rows.length ? rows : demo ? seeds : [],
      resolveSeedItem: (item, fallback) => item ?? (demo ? fallback() : null),
    }));
    const { fetchProjects } = await import("./src/lib/projects");
    const strict = () => fetchProjects(undefined, { throwOnUnavailable: true })
      .then((rows) => ({ ok: true, ids: rows.map((row) => row.id) }))
      .catch(() => ({ ok: false }));
    const unavailable = await strict();
    connected = true;
    const empty = await strict();
    demo = false;
    response = { data: [{ id: "published-1", slug: "test", title: "Test", description: "Test", status: "open", type: "research" }], error: null };
    const loaded = await strict();
    response = { data: null, error: { message: "network failure" } };
    const failure = await strict();
    rejected = true;
    const timeout = await strict();
    connected = false;
    const legacyEmpty = await fetchProjects();
    console.log(JSON.stringify({ unavailable, empty, loaded, failure, timeout, legacyEmpty, requests }));
  `,
    ],
    { cwd: process.cwd(), timeout: 15000 },
  );

  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.unavailable).toEqual({ ok: false });
  expect(output.empty).toEqual({ ok: true, ids: [] });
  expect(output.loaded).toEqual({ ok: true, ids: ["published-1"] });
  expect(output.failure).toEqual({ ok: false });
  expect(output.timeout).toEqual({ ok: false });
  expect(output.legacyEmpty).toEqual([]);
  expect(output.requests).toContainEqual(["eq", "published", true]);
  for (const request of output.requests) {
    if (request[0] === "select") {
      expect(request[1]).not.toContain("workspace");
      expect(request[1]).not.toContain("lead_id");
    }
  }
});
