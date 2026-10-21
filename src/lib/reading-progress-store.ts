export type ProgressSource = "synced" | "local" | "unavailable";
export type ProgressSnapshot = { values: Record<string, number>; source: ProgressSource };
export type ProgressSave = { percent: number; source: ProgressSource };
export type ReaderSaveState = ProgressSource | "loading" | "saving";

/** A late initial read must not hide a newer save or leave the reader loading forever. */
export function sourceAfterProgressLoad(
  current: ReaderSaveState,
  currentPercent: number,
  loaded: ProgressSave,
  localPercent: number,
): ReaderSaveState {
  if (current !== "loading") return current;
  if (loaded.percent >= currentPercent) return loaded.source;
  return localPercent >= currentPercent ? "local" : "unavailable";
}

type StoragePort = Pick<Storage, "getItem" | "setItem" | "key" | "length">;
export type ProgressRemote = {
  load: (userId: string, slug?: string) => Promise<Record<string, number>>;
  save: (userId: string, slug: string, percent: number) => Promise<void>;
};

export function normalizeReadingProgress(value: unknown): number {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : 0;
}

export function readingViewportPercent(top: number, height: number, viewport: number): number {
  if (![top, height, viewport].every(Number.isFinite) || height <= 0 || viewport <= 0) return 0;
  return normalizeReadingProgress(((viewport - top) / height) * 100);
}

/** The storage and transport boundaries are injectable so failure paths are testable. */
export function createReadingProgressStore(deps: {
  storage: () => StoragePort | null;
  remote: () => ProgressRemote | null;
}) {
  const queues = new Map<string, Promise<ProgressSave>>();
  const key = (userId: string, slug: string) => `build:read:${userId}:${slug}`;
  function storage() {
    try {
      const target = deps.storage();
      target?.getItem("build:read:access-check");
      return target;
    } catch {
      return null;
    }
  }
  function remoteClient() {
    try {
      return deps.remote();
    } catch {
      return null;
    }
  }
  function getLocal(userId: string, slug: string): number {
    try {
      return normalizeReadingProgress(storage()?.getItem(key(userId, slug)));
    } catch {
      return 0;
    }
  }
  function setLocal(userId: string, slug: string, percent: number): boolean {
    try {
      const target = storage();
      if (!target) return false;
      target.setItem(
        key(userId, slug),
        String(Math.max(getLocal(userId, slug), normalizeReadingProgress(percent))),
      );
      return true;
    } catch {
      return false;
    }
  }
  function localValues(userId: string, slug?: string) {
    const values: Record<string, number> = {};
    if (slug) {
      values[slug] = getLocal(userId, slug);
      return values;
    }
    try {
      const target = storage();
      const prefix = `build:read:${userId}:`;
      for (let i = 0; target && i < target.length; i++) {
        const name = target.key(i);
        if (name?.startsWith(prefix)) {
          const id = name.slice(prefix.length);
          if (id) values[id] = getLocal(userId, id);
        }
      }
    } catch {
      /* Keep any values already read when storage becomes unavailable. */
    }
    return values;
  }
  async function load(userId: string, slug?: string): Promise<ProgressSnapshot> {
    const values = localValues(userId, slug);
    const remote = remoteClient();
    if (remote) {
      try {
        const rows = await remote.load(userId, slug);
        // Include local writes made while the request was in flight, even for absent server rows.
        for (const [id, percent] of Object.entries(localValues(userId, slug))) {
          values[id] = Math.max(values[id] ?? 0, percent);
        }
        for (const [id, percent] of Object.entries(rows)) {
          if (slug && id !== slug) continue;
          values[id] = Math.max(
            values[id] ?? 0,
            getLocal(userId, id),
            normalizeReadingProgress(percent),
          );
          setLocal(userId, id, values[id]);
        }
        // A newer browser-local value remains pending until the reader retries synchronization.
        const pending = Object.entries(values).some(
          ([id, percent]) => percent > normalizeReadingProgress(rows[id]),
        );
        return { values, source: pending ? "local" : "synced" };
      } catch {
        /* Local progress stays usable while the network is unavailable. */
      }
    }
    for (const [id, percent] of Object.entries(localValues(userId, slug))) {
      values[id] = Math.max(values[id] ?? 0, percent);
    }
    return { values, source: storage() ? "local" : "unavailable" };
  }
  function save(userId: string, slug: string, percent: number): Promise<ProgressSave> {
    const id = key(userId, slug);
    const requested = normalizeReadingProgress(percent);
    // Persist immediately; a quick navigation must not discard a pending scroll update.
    const localSaved = setLocal(userId, slug, requested);
    const operation = async (): Promise<ProgressSave> => {
      let next = Math.max(requested, getLocal(userId, slug));
      const remote = remoteClient();
      if (remote) {
        try {
          const current = await remote.load(userId, slug);
          next = Math.max(next, getLocal(userId, slug), normalizeReadingProgress(current[slug]));
          if (next > normalizeReadingProgress(current[slug])) await remote.save(userId, slug, next);
          setLocal(userId, slug, next);
          return { percent: next, source: "synced" };
        } catch {
          /* Never overwrite an unread server value after a failed read. */
        }
      }
      return {
        percent: next,
        source: setLocal(userId, slug, next) || localSaved ? "local" : "unavailable",
      };
    };
    const result = (queues.get(id) ?? Promise.resolve()).then(operation, operation);
    queues.set(id, result);
    void result.finally(() => {
      if (queues.get(id) === result) queues.delete(id);
    });
    return result;
  }
  return { getLocal, setLocal, load, save };
}
