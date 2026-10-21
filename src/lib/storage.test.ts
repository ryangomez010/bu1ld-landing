import { afterEach, describe, expect, test } from "bun:test";

import { isLocalPersistenceEnabled, persistLocally, withLocalFallback } from "./storage";

const originalEnv = { ...import.meta.env };
const supabaseEnvKeys = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;
const originalSupabaseEnv = Object.fromEntries(
  supabaseEnvKeys.map((key) => [key, process.env[key]]),
) as Record<(typeof supabaseEnvKeys)[number], string | undefined>;

function clearSupabaseEnv() {
  for (const key of supabaseEnvKeys) {
    delete process.env[key];
    import.meta.env[key] = "";
  }
}

afterEach(() => {
  for (const key of supabaseEnvKeys) {
    const value = originalSupabaseEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  Object.assign(import.meta.env, originalEnv);
});

describe("storage guards", () => {
  test("withLocalFallback returns fallback when Supabase configured", () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "anon-key";
    expect(withLocalFallback([], () => [{ id: "local" }])).toEqual([]);
  });

  test("withLocalFallback reads local in demo mode", () => {
    import.meta.env.PROD = false;
    clearSupabaseEnv();
    expect(withLocalFallback([], () => [{ id: "local" }])).toEqual([{ id: "local" }]);
  });

  test("persistLocally skips writes when Supabase configured", () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "anon-key";
    let called = false;
    persistLocally(() => {
      called = true;
    });
    expect(called).toBe(false);
  });

  test("isLocalPersistenceEnabled is false in production", () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_SUPABASE_URL = "";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "";
    expect(isLocalPersistenceEnabled()).toBe(false);
  });
});
