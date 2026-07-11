import { afterEach, describe, expect, test } from "bun:test";

import {
  buildDigestEmail,
  digestCooldownHours,
  isDigestDue,
  shouldRunWeeklyDigest,
} from "./digest";
import { isDemoMode, resolveSeedItem, withSeedFallback } from "./supabase-fallback";

const originalEnv = { ...import.meta.env };

afterEach(() => {
  Object.assign(import.meta.env, originalEnv);
});

describe("supabase-fallback", () => {
  test("withSeedFallback returns rows when present", () => {
    expect(withSeedFallback([{ id: "1" }], [{ id: "seed" }])).toEqual([{ id: "1" }]);
  });

  test("withSeedFallback returns empty in production without rows", () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "anon-key";
    expect(withSeedFallback([], [{ id: "seed" }])).toEqual([]);
  });

  test("resolveSeedItem returns null in production when item missing", () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "anon-key";
    expect(resolveSeedItem(null, () => ({ id: "seed" }))).toBeNull();
  });

  test("isDemoMode is true without Supabase in development", () => {
    import.meta.env.PROD = false;
    import.meta.env.VITE_SUPABASE_URL = "";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "";
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL = "";
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "";
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
    expect(isDemoMode()).toBe(true);
  });
});

describe("digest", () => {
  test("buildDigestEmail includes items", () => {
    const result = buildDigestEmail({ fullName: "Ada", frequency: "weekly" }, [
      {
        type: "paper",
        title: "Attention Is All You Need",
        summary: "",
        href: "/papers/attention",
        score: 3,
        matchTags: ["nlp"],
        reason: "Matches nlp",
      },
    ]);
    expect(result.subject).toContain("weekly");
    expect(result.html).toContain("Attention Is All You Need");
    expect(result.itemCount).toBe(1);
  });

  test("shouldRunWeeklyDigest only on Mondays unless forced", () => {
    const monday = new Date("2026-07-13T12:00:00Z");
    const tuesday = new Date("2026-07-14T12:00:00Z");
    expect(shouldRunWeeklyDigest(monday)).toBe(true);
    expect(shouldRunWeeklyDigest(tuesday)).toBe(false);
    expect(shouldRunWeeklyDigest(tuesday, true)).toBe(true);
  });

  test("isDigestDue respects cooldown", () => {
    const now = new Date("2026-07-14T12:00:00Z");
    const recent = new Date("2026-07-14T08:00:00Z").toISOString();
    expect(isDigestDue("daily", recent, now)).toBe(false);
    expect(isDigestDue("daily", null, now)).toBe(true);
    expect(digestCooldownHours("weekly")).toBeGreaterThan(digestCooldownHours("daily"));
  });
});
