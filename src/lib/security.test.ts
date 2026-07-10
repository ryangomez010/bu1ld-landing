import { describe, expect, test } from "bun:test";

import {
  clampText,
  isUuid,
  isValidEmail,
  sanitizeAppPath,
  sanitizeEmailHtml,
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
    const out = sanitizeEmailHtml('<p>Hi</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
  });
});
