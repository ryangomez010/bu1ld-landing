import { afterEach, describe, expect, test } from "bun:test";

import { isLocalPersistenceEnabled, persistLocally, withLocalFallback } from "./storage";

const originalEnv = { ...import.meta.env };

afterEach(() => {
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
    import.meta.env.VITE_SUPABASE_URL = "";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "";
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL = "";
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "";
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
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
