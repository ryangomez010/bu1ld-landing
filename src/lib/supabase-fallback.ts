import { checkSupabaseConfigured } from "@/lib/supabase";

/** True when the live data client is absent and the app runs in local development. */
export function isDemoMode(): boolean {
  return !checkSupabaseConfigured() && !import.meta.env.PROD;
}

/**
 * Use live Supabase rows when present.
 * Seed data is returned only in local demo mode (no Supabase configured).
 * Production always returns an empty array when the database has no rows.
 */
export function withSeedFallback<T>(rows: T[] | null | undefined, seeds: T[]): T[] {
  if (rows && rows.length > 0) return rows;
  return isDemoMode() ? seeds : [];
}

/** Resolve a single item from live data or bundled seeds (demo mode only). */
export function resolveSeedItem<T>(
  item: T | null | undefined,
  findInSeeds: () => T | null | undefined,
): T | null {
  if (item) return item;
  return isDemoMode() ? (findInSeeds() ?? null) : null;
}
