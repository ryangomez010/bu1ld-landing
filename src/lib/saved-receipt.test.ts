import { expect, test } from "bun:test";

test("bookmark receipts require strict reads, matching writes, and verified local persistence", () => {
  // Isolate the transport mock so other persistence tests keep their real modules.
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    const row = { id: "00000000-0000-4000-8000-000000000001", user_id: "private-user", item_type: "paper", item_slug: "private-paper" };
    let read = { data: null, error: null };
    let written = { data: row, error: null };
    let calls = [];
    const client = { from() {
      let operation = "read";
      const query = {
        select() { return query; }, eq() { return query; },
        maybeSingle() { calls.push("read"); return Promise.resolve(read); },
        insert() { operation = "insert"; return query; },
        delete() { operation = "delete"; return query; },
        single() { calls.push(operation); return Promise.resolve(written); },
      };
      return query;
    } };
    let remote = client;
    let configured = true;
    mock.module("./src/lib/supabase", () => ({ getSupabase: () => remote, checkSupabaseConfigured: () => configured }));
    const { loadSavedState, toggleSavedWithReceipt, toggleSaved, bulkUnsaveSavedItems } = await import("./src/lib/saved");
    const { trackPaperSave } = await import("./src/lib/learning-analytics");
    const results = {};
    const events = [];
    async function run(name, desired = true) {
      calls = [];
      const receipt = await toggleSavedWithReceipt("private-user", "paper", "private-paper", "Private title", desired);
      trackPaperSave("paper", receipt, (name, props) => events.push({ name, props }));
      results[name] = { receipt, calls: [...calls] };
    }
    await run("inserted");
    read = { data: null, error: { message: "private database detail" } };
    await run("readFailure");
    results.loadFailure = await loadSavedState("private-user", "paper", "private-paper");
    try { await toggleSaved("private-user", "paper", "private-paper", "Private title"); results.wrapperFailure = "unexpected success"; }
    catch (error) { results.wrapperFailure = error.message; }
    read = { data: null, error: null };
    for (const [name, data, error] of [
      ["insertMissing", null, null],
      ["insertWrongOwner", { ...row, user_id: "someone-else" }, null],
      ["insertWrongPaper", { ...row, item_slug: "different-paper" }, null],
      ["insertInvalidId", { ...row, id: "not-a-uuid" }, null],
      ["insertError", row, { message: "private database detail" }],
    ]) { written = { data, error }; await run(name); }
    read = { data: row, error: null };
    written = { data: row, error: null };
    results.loaded = await loadSavedState("private-user", "paper", "private-paper");
    await run("alreadySaved");
    await run("deleted", false);
    written = { data: null, error: null };
    await run("zeroRowDelete", false);
    results.bulkFailure = await bulkUnsaveSavedItems("private-user", [{ item_type: "paper", item_slug: "private-paper" }]);
    read = { data: null, error: null };
    await run("alreadyAbsent", false);
    remote = null;
    await run("backendUnavailable");
    configured = false;
    globalThis.window = {};
    const entries = new Map();
    let storageMode = "normal";
    globalThis.localStorage = {
      getItem(key) { if (storageMode === "read-denied") throw new Error("denied"); return entries.get(key) ?? null; },
      setItem(key, value) { if (storageMode === "write-denied") throw new Error("quota"); if (storageMode !== "silent-drop") entries.set(key, value); },
    };
    await run("localSaved");
    await run("localAlreadySaved");
    await run("localRemoved", false);
    for (const name of ["read-denied", "write-denied", "silent-drop"]) { storageMode = name; await run(name); }
    storageMode = "normal";
    entries.set("build:saved:private-user", "{bad json");
    await run("corruptLocal");
    results.corruptPreserved = entries.get("build:saved:private-user");
    console.log(JSON.stringify({ results, events }));
  `,
    ],
    { cwd: process.cwd(), timeout: 15000 },
  );
  expect(result.exitCode).toBe(0);
  const { results, events } = JSON.parse(result.stdout.toString());
  expect(results.inserted.receipt).toEqual({
    saved: true,
    changed: true,
    source: "synced",
    error: null,
  });
  expect(results.inserted.calls).toEqual(["read", "insert"]);
  expect(results.readFailure.calls).toEqual(["read"]);
  expect(results.alreadySaved.calls).toEqual(["read"]);
  expect(results.alreadySaved.receipt.changed).toBe(false);
  expect(results.loaded).toEqual({ saved: true, changed: false, source: "synced", error: null });
  expect(results.deleted.receipt).toEqual({
    saved: false,
    changed: true,
    source: "synced",
    error: null,
  });
  expect(results.deleted.calls).toEqual(["read", "delete"]);
  expect(results.alreadyAbsent.receipt).toEqual({
    saved: false,
    changed: false,
    source: "synced",
    error: null,
  });
  for (const key of [
    "readFailure",
    "insertMissing",
    "insertWrongOwner",
    "insertWrongPaper",
    "insertInvalidId",
    "insertError",
    "zeroRowDelete",
    "backendUnavailable",
    "read-denied",
    "write-denied",
    "silent-drop",
    "corruptLocal",
  ]) {
    expect(results[key].receipt.source).toBe("unavailable");
    expect(results[key].receipt.changed).toBe(false);
    expect(results[key].receipt.error).toBeTruthy();
    expect(results[key].receipt.error).not.toContain("private database detail");
  }
  expect(results.loadFailure.source).toBe("unavailable");
  expect(results.wrapperFailure).not.toBe("unexpected success");
  expect(results.wrapperFailure).not.toContain("private database detail");
  expect(results.bulkFailure.error).toBeTruthy();
  expect(results.localSaved.receipt).toEqual({
    saved: true,
    changed: true,
    source: "local",
    error: null,
  });
  expect(results.localAlreadySaved.receipt.changed).toBe(false);
  expect(results.localRemoved.receipt).toEqual({
    saved: false,
    changed: true,
    source: "local",
    error: null,
  });
  expect(results.corruptPreserved).toBe("{bad json");
  expect(events).toEqual([
    { name: "paper_saved", props: { item_type: "paper", source: "account_bookmark" } },
    { name: "paper_saved", props: { item_type: "paper", source: "browser_bookmark" } },
  ]);
});
