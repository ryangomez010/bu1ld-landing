import { describe, expect, test } from "bun:test";
import {
  createReadingProgressStore,
  normalizeReadingProgress,
  readingViewportPercent,
  sourceAfterProgressLoad,
  type ProgressRemote,
} from "./reading-progress-store";

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}
function remoteStore() {
  const rows = new Map<string, Record<string, number>>();
  const writes: [string, string, number][] = [];
  const remote: ProgressRemote = {
    load: async (user, slug) => {
      const values = rows.get(user) ?? {};
      return slug ? { [slug]: values[slug] ?? 0 } : { ...values };
    },
    save: async (user, slug, percent) => {
      writes.push([user, slug, percent]);
      rows.set(user, { ...rows.get(user), [slug]: percent });
    },
  };
  return { remote, rows, writes };
}

describe("reading progress persistence", () => {
  test("resolves late loading state without hiding newer saves", () => {
    expect(sourceAfterProgressLoad("loading", 70, { percent: 10, source: "synced" }, 70)).toBe(
      "local",
    );
    expect(sourceAfterProgressLoad("loading", 70, { percent: 10, source: "synced" }, 0)).toBe(
      "unavailable",
    );
    expect(sourceAfterProgressLoad("loading", 10, { percent: 70, source: "synced" }, 0)).toBe(
      "synced",
    );
    expect(sourceAfterProgressLoad("saving", 70, { percent: 10, source: "synced" }, 70)).toBe(
      "saving",
    );
    expect(sourceAfterProgressLoad("synced", 70, { percent: 10, source: "local" }, 70)).toBe(
      "synced",
    );
    expect(sourceAfterProgressLoad("loading", 0, { percent: 0, source: "unavailable" }, 0)).toBe(
      "unavailable",
    );
  });

  test("retains local writes made during slow loads with missing server rows or errors", async () => {
    for (const fail of [false, true]) {
      const storage = memoryStorage();
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const store = createReadingProgressStore({
        storage: () => storage,
        remote: () => ({
          load: async () => {
            await gate;
            if (fail) throw new Error("offline");
            return {};
          },
          save: async () => {},
        }),
      });
      const pending = store.load("alice");
      store.setLocal("alice", "new-article", 75);
      store.setLocal("bob", "private-article", 100);
      release();
      expect(await pending).toEqual({ values: { "new-article": 75 }, source: "local" });
    }
  });

  test("sanitizes corrupt, nonfinite, and out-of-range values", () => {
    for (const input of [NaN, Infinity, "NaN", "broken", undefined, {}, true])
      expect(normalizeReadingProgress(input)).toBe(0);
    expect(normalizeReadingProgress(-20)).toBe(0);
    expect(normalizeReadingProgress(130)).toBe(100);
    expect(normalizeReadingProgress("42.6")).toBe(43);
  });

  test("calculates progress against article content, including short articles", () => {
    expect(readingViewportPercent(900, 1000, 800)).toBe(0);
    expect(readingViewportPercent(300, 1000, 800)).toBe(50);
    expect(readingViewportPercent(-400, 1000, 800)).toBe(100);
    expect(readingViewportPercent(200, 300, 800)).toBe(100);
    expect(readingViewportPercent(0, 0, 800)).toBe(0);
    expect(readingViewportPercent(NaN, 1000, 800)).toBe(0);
  });

  test("keeps local progress monotonic and isolated between accounts", async () => {
    const storage = memoryStorage();
    const store = createReadingProgressStore({ storage: () => storage, remote: () => null });
    store.setLocal("alice", "ml-lora", 80);
    store.setLocal("alice", "ml-lora", 30);
    store.setLocal("bob", "ml-lora", 20);
    storage.setItem("build:read:alice:bad", "NaN");
    storage.setItem("unrelated", "100");
    expect(await store.load("alice")).toEqual({
      values: { "ml-lora": 80, bad: 0 },
      source: "local",
    });
    expect((await store.load("bob")).values).toEqual({ "ml-lora": 20 });
  });

  test("merges newer device progress instead of replacing it with stale server rows", async () => {
    const server = remoteStore();
    server.rows.set("alice", { article: 30 });
    const store = createReadingProgressStore({
      storage: () => storage,
      remote: () => server.remote,
    });
    const storage = memoryStorage();
    store.setLocal("alice", "article", 80);
    expect(await store.load("alice", "article")).toEqual({
      values: { article: 80 },
      source: "local",
    });
    expect(await store.save("alice", "article", 60)).toEqual({ percent: 80, source: "synced" });
    expect(server.writes).toEqual([["alice", "article", 80]]);
  });

  test("caches newer account progress for later offline reading", async () => {
    const storage = memoryStorage();
    const server = remoteStore();
    server.rows.set("alice", { article: 95 });
    const store = createReadingProgressStore({
      storage: () => storage,
      remote: () => server.remote,
    });
    store.setLocal("alice", "article", 20);
    expect(await store.load("alice")).toEqual({ values: { article: 95 }, source: "synced" });
    expect(store.getLocal("alice", "article")).toBe(95);
    expect(await store.save("alice", "article", 30)).toEqual({ percent: 95, source: "synced" });
    expect(server.writes).toHaveLength(0);
  });

  test("preserves an offline save and never overwrites a server value after a failed read", async () => {
    const storage = memoryStorage();
    let writes = 0;
    const store = createReadingProgressStore({
      storage: () => storage,
      remote: () => ({
        load: async () => {
          throw new Error("offline");
        },
        save: async () => {
          writes++;
        },
      }),
    });
    expect(await store.save("alice", "article", 64)).toEqual({ percent: 64, source: "local" });
    expect(writes).toBe(0);
    expect((await store.load("alice")).values.article).toBe(64);
  });

  test("distinguishes a failed account write from successful synchronization", async () => {
    const storage = memoryStorage();
    const store = createReadingProgressStore({
      storage: () => storage,
      remote: () => ({
        load: async () => ({}),
        save: async () => {
          throw new Error("write denied");
        },
      }),
    });
    expect(await store.save("alice", "article", 100)).toEqual({ percent: 100, source: "local" });
    expect(store.getLocal("alice", "article")).toBe(100);
  });

  test("reports total storage failure without throwing away the readable page", async () => {
    const store = createReadingProgressStore({
      storage: () => {
        throw new Error("blocked");
      },
      remote: () => null,
    });
    expect(await store.load("alice")).toEqual({ values: {}, source: "unavailable" });
    expect(await store.save("alice", "article", 90)).toEqual({
      percent: 90,
      source: "unavailable",
    });
  });

  test("can sync when local writes exceed quota", async () => {
    const server = remoteStore();
    const storage = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error("quota");
      },
    };
    const store = createReadingProgressStore({
      storage: () => storage,
      remote: () => server.remote,
    });
    expect(await store.save("alice", "article", 100)).toEqual({ percent: 100, source: "synced" });
    expect(server.rows.get("alice")?.article).toBe(100);
  });

  test("serializes overlapping writes and retains the latest progress during slow requests", async () => {
    const storage = memoryStorage();
    const server = remoteStore();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let loads = 0;
    const store = createReadingProgressStore({
      storage: () => storage,
      remote: () => ({
        ...server.remote,
        load: async (user, slug) => {
          if (++loads === 1) await gate;
          return server.remote.load(user, slug);
        },
      }),
    });
    const first = store.save("alice", "article", 40);
    await Promise.resolve();
    const second = store.save("alice", "article", 100);
    expect(store.getLocal("alice", "article")).toBe(100);
    release();
    await Promise.all([first, second]);
    expect(server.rows.get("alice")?.article).toBe(100);
    expect(server.writes.every(([, , percent]) => percent === 100)).toBe(true);
  });
});
