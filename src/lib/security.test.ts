import { describe, expect, test } from "bun:test";

import {
  checkRateLimit,
  clampText,
  isUuid,
  isValidEmail,
  sanitizeAppPath,
  sanitizeEmailHtml,
  sanitizeText,
  validatePassword,
} from "./security";

describe("security utilities", () => {
  test("isUuid validates format", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });

  test("isValidEmail rejects bad addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("bad")).toBe(false);
    expect(isValidEmail("a@")).toBe(false);
  });

  test("sanitizeAppPath blocks open redirects", () => {
    expect(sanitizeAppPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeAppPath("//evil.com")).toBeUndefined();
    expect(sanitizeAppPath("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeAppPath("https://evil.com")).toBeUndefined();
  });

  test("clampText enforces max length", () => {
    expect(clampText("  hello  ", 3)).toBe("hel");
  });

  test("sanitizeEmailHtml strips script tags", () => {
    const out = sanitizeEmailHtml("<p>Hi</p><script>alert(1)</script>");
    expect(out).not.toContain("<script");
  });

  test("validatePassword enforces complexity", () => {
    expect(validatePassword("short1").ok).toBe(false);
    expect(validatePassword("allletters").ok).toBe(false);
    expect(validatePassword("SecurePass1").ok).toBe(true);
  });

  test("sanitizeText strips angle brackets", () => {
    expect(sanitizeText("<script>x</script>", 100)).not.toContain("<");
  });

  test("checkRateLimit blocks excess hits", () => {
    const buckets = new Map<string, number[]>();
    expect(checkRateLimit(buckets, "ip", 60_000, 2).allowed).toBe(true);
    expect(checkRateLimit(buckets, "ip", 60_000, 2).allowed).toBe(true);
    expect(checkRateLimit(buckets, "ip", 60_000, 2).allowed).toBe(false);
  });
});
