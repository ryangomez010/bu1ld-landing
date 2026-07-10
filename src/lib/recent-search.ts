const KEY_BASE = "build:recent-searches";
const MAX = 12;

function storageKey(userId?: string): string {
  return userId ? `${KEY_BASE}:${userId}` : KEY_BASE;
}

export function getRecentSearches(userId?: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const legacy = localStorage.getItem(KEY_BASE);
    const key = storageKey(userId);
    const raw = localStorage.getItem(key) ?? (userId ? legacy : null);
    if (userId && legacy && !localStorage.getItem(key)) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(KEY_BASE);
    }
    return JSON.parse(raw ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string, userId?: string): void {
  const q = query.trim();
  if (!q || typeof window === "undefined") return;
  const key = storageKey(userId);
  const next = [
    q,
    ...getRecentSearches(userId).filter((s) => s.toLowerCase() !== q.toLowerCase()),
  ].slice(0, MAX);
  localStorage.setItem(key, JSON.stringify(next));
}

export function clearRecentSearches(userId?: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(userId));
  if (!userId) localStorage.removeItem(KEY_BASE);
}

export function removeRecentSearch(query: string, userId?: string): void {
  if (typeof window === "undefined") return;
  const key = storageKey(userId);
  const next = getRecentSearches(userId).filter((s) => s !== query);
  localStorage.setItem(key, JSON.stringify(next));
}
