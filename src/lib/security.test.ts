import { describe, expect, test } from "bun:test";

import { guardAuthAttempt } from "./auth-rate-limit";
import {
  applySecurityHeaders,
  checkFormRateLimit,
  clampText,
  isSameOriginRequest,
  isSensitiveAction,
  isTrustedSupabaseUrl,
  isUuid,
  isValidEmail,
  sanitizeAppPath,
  sanitizeEmailHtml,
  sanitizeText,
  securityHeaders,
  validateImageMagicBytes,
  validatePassword,
  checkRateLimit,
  jsonResponse,
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

  test("checkFormRateLimit throttles repeated submits", () => {
    expect(checkFormRateLimit("user1", "profile", 60_000, 3).allowed).toBe(true);
    expect(checkFormRateLimit("user1", "profile", 60_000, 3).allowed).toBe(true);
    expect(checkFormRateLimit("user1", "profile", 60_000, 3).allowed).toBe(true);
    expect(checkFormRateLimit("user1", "profile", 60_000, 3).allowed).toBe(false);
  });

  test("guardAuthAttempt throttles auth forms", () => {
    const email = "throttle-test@example.com";
    for (let i = 0; i < 8; i++) {
      expect(guardAuthAttempt("login-test", email)).toBeNull();
    }
    expect(guardAuthAttempt("login-test", email)).toMatch(/Too many attempts/);
  });

  test("isSensitiveAction validates audit event types", () => {
    expect(isSensitiveAction("avatar_updated")).toBe(true);
    expect(isSensitiveAction("sign_in")).toBe(true);
    expect(isSensitiveAction("random_event")).toBe(false);
  });

  test("isSameOriginRequest blocks cross-origin posts", () => {
    const req = new Request("https://app.example.com/api/email", {
      headers: { origin: "https://evil.com" },
    });
    expect(isSameOriginRequest(req, "app.example.com")).toBe(false);
    expect(
      isSameOriginRequest(
        new Request("https://app.example.com/api/email", {
          headers: { origin: "https://app.example.com" },
        }),
        "app.example.com",
      ),
    ).toBe(true);
  });

  test("isTrustedSupabaseUrl accepts only https supabase hosts", () => {
    expect(isTrustedSupabaseUrl("https://abc123.supabase.co")).toBe(true);
    expect(isTrustedSupabaseUrl("http://abc123.supabase.co")).toBe(false);
    expect(isTrustedSupabaseUrl("https://evil.com")).toBe(false);
  });

  test("securityHeaders include baseline protections", () => {
    const headers = securityHeaders({ hsts: true });
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(headers["Strict-Transport-Security"]).toContain("max-age");
  });

  test("applySecurityHeaders preserves status and adds headers", () => {
    const res = applySecurityHeaders(new Response("ok", { status: 201 }), true);
    expect(res.status).toBe(201);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  test("checkRateLimit returns retryAfterMs when blocked", () => {
    const buckets = new Map<string, number[]>();
    const key = "test-ip";
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(buckets, key, 60_000, 3).allowed).toBe(true);
    }
    const blocked = checkRateLimit(buckets, key, 60_000, 3);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  test("jsonResponse sets security headers", async () => {
    const res = jsonResponse({ ok: true });
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  test("validateImageMagicBytes rejects mismatched content", async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const blob = new Blob([pngHeader], { type: "image/png" });
    expect(await validateImageMagicBytes(blob, "image/png")).toBe(true);
    expect(await validateImageMagicBytes(blob, "image/jpeg")).toBe(false);
  });
});
