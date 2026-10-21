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

function cleanDevelopmentEnv(): Record<string, string> {
  const env = { ...process.env, NODE_ENV: "development" } as Record<string, string>;
  for (const key of supabaseEnvKeys) delete env[key];
  delete env.PROD;
  delete env.DEV;
  delete env.MODE;
  return env;
}

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
    const result = Bun.spawnSync(
      [
        process.execPath,
        "--no-env-file",
        "--eval",
        'const { withLocalFallback } = await import("./src/lib/storage"); console.log(JSON.stringify(withLocalFallback([], () => [{ id: "local" }])));',
      ],
      { cwd: process.cwd(), env: cleanDevelopmentEnv() },
    );
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toEqual([{ id: "local" }]);
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
