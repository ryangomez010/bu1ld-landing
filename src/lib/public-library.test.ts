import { expect, test } from "bun:test";

test("anonymous catalogs separate outages from empty results and fetch only public fields", () => {
  // A process boundary prevents Supabase module mocks leaking into authorization tests.
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
      import { mock } from "bun:test";
      let connected = false;
      let invalidConfiguration = false;
      let response = { data: [], error: null };
      const requests = [];
      const client = { from(table) {
        const q = {
          select(columns) { requests.push({ table, columns }); return this; },
          eq(key, value) { requests.push({ table, key, value }); return this; },
          order() { return this; },
          abortSignal(signal) { requests.push({ table, bounded: signal instanceof AbortSignal }); return this; },
          maybeSingle() { return Promise.resolve(response); },
          then(resolve, reject) { return Promise.resolve(response).then(resolve, reject); },
        };
        return q;
      }};
      mock.module("./src/lib/public-supabase", () => ({ getPublicSupabase: () => {
        if (invalidConfiguration) throw new Error("Invalid supabaseUrl: private diagnostic");
        return connected ? client : null;
      } }));
      const { publicEvents, publicPapers, publicPaperBySlug } = await import("./src/lib/public-library");
      const read = () => Promise.all([publicEvents(), publicPapers(), publicPaperBySlug("example")]);
      const absent = await read();
      invalidConfiguration = true;
      const malformed = await read();
      invalidConfiguration = false;
      connected = true;
      const empty = await Promise.all([publicEvents(), publicPapers()]);
      response = { data: null, error: null };
      const missing = await publicPaperBySlug("missing");
      response = { data: null, error: { message: "permission denied: private diagnostic" } };
      const failed = await read();
      response = { data: [{ id: "event", slug: "event", published: true }], error: null };
      const events = await publicEvents();
      response = { data: { id: "review", slug: "example", title: "Review", published: true, review_status: "published", review_body: "Requested public article" }, error: null };
      const article = await publicPaperBySlug("example");
      console.log(JSON.stringify({ absent, malformed, empty, missing, failed, events, article, requests }));
    `,
    ],
    { cwd: process.cwd(), timeout: 15_000 },
  );
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  for (const catalog of [...output.absent, ...output.malformed, ...output.failed]) {
    expect(catalog.state).toBe("unavailable");
    expect(catalog.message).not.toContain("private diagnostic");
  }
  for (const catalog of [...output.empty, output.missing]) {
    expect(catalog.state).toBe("ready");
    expect(catalog.records).toEqual([]);
  }
  expect(output.events.records[0].prep_notes).toBeNull();
  expect(output.events.records[0].resources).toEqual([]);
  expect(output.article.records[0].review_body).toBe("Requested public article");
  const projections = output.requests.filter((request: { columns?: string }) => request.columns);
  for (const request of projections) {
    expect(request.columns).not.toContain("*");
    expect(request.columns).not.toContain("reviewer_notes");
    expect(request.columns).not.toContain("prep_notes");
    expect(request.columns).not.toContain("resources");
  }
  expect(
    projections.some(
      (request: { table: string; columns: string }) =>
        request.table === "papers" && !request.columns.includes("review_body"),
    ),
  ).toBe(true);
  for (const table of ["events", "papers"]) {
    expect(output.requests).toContainEqual({ table, key: "published", value: true });
    expect(output.requests).toContainEqual({ table, bounded: true });
  }
  expect(output.requests).toContainEqual({
    table: "papers",
    key: "review_status",
    value: "published",
  });
  expect(output.requests).toContainEqual({ table: "papers", key: "slug", value: "example" });
});
