import { checkSupabaseConfigured } from "@/lib/supabase";

export function isLocalPersistenceEnabled(): boolean {
  return !checkSupabaseConfigured() && !import.meta.env.PROD;
}

/** Read from localStorage only in demo mode; otherwise return the provided fallback. */
export function withLocalFallback<T>(fallback: T, readLocalFn: () => T): T {
  return isLocalPersistenceEnabled() ? readLocalFn() : fallback;
}

/** Write to localStorage only in demo mode. */
export function persistLocally(writeFn: () => void): void {
  if (isLocalPersistenceEnabled()) writeFn();
}

export function userStorageKey(base: string, userId: string): string {
  return `${base}:${userId}`;
}

export function readUserJson<T>(base: string, userId: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(userStorageKey(base, userId));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeUserJson<T>(base: string, userId: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(userStorageKey(base, userId), JSON.stringify(value));
}
