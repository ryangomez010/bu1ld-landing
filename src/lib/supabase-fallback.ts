/** Use live Supabase rows when present; otherwise fall back to bundled seed data. */
export function withSeedFallback<T>(rows: T[] | null | undefined, seeds: T[]): T[] {
  if (rows && rows.length > 0) return rows;
  return seeds;
}
