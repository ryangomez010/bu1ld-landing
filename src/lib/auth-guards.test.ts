import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { authedRedirectPath, memberGatePath, shouldUseNotifyUsersRpc } from "./auth-guards";

describe("auth-guards", () => {
  test("captures the original private destination and replaces login history", () => {
    const source = readFileSync("src/components/auth/RequireAuth.tsx", "utf8");
    expect(source).toMatch(/useRef\(\s*sanitizeAppPath/);
    expect(source).toContain("replace: true");
  });
  test("uses one PKCE exchange owner for login and recovery callbacks", () => {
    const config = readFileSync("src/lib/supabase.ts", "utf8");
    expect(config).toContain("detectSessionInUrl: true");
    for (const path of ["src/routes/auth/callback.tsx", "src/routes/reset-password.tsx"]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("supabase.auth.initialize()");
      expect(source).not.toContain("exchangeCodeForSession");
    }
  });
  test("authedRedirectPath sends incomplete onboarding to /onboarding", () => {
    expect(authedRedirectPath({ id: "u1" }, { onboarding_completed: false }, "/dashboard")).toBe(
      "/onboarding",
    );
  });

  test("authedRedirectPath sends completed members to destination", () => {
    expect(authedRedirectPath({ id: "u1" }, { onboarding_completed: true }, "/dashboard")).toBe(
      "/dashboard",
    );
  });

  test("authedRedirectPath returns null for guests", () => {
    expect(authedRedirectPath(null, null, "/dashboard")).toBeNull();
  });

  test("memberGatePath blocks guests and incomplete onboarding", () => {
    expect(memberGatePath(null, null)).toBe("/login");
    expect(memberGatePath({ id: "u1" }, { onboarding_completed: false })).toBe("/onboarding");
    expect(memberGatePath({ id: "u1" }, { onboarding_completed: true })).toBeNull();
  });

  test("shouldUseNotifyUsersRpc for cross-user delivery", () => {
    expect(shouldUseNotifyUsersRpc("a", "b")).toBe(true);
    expect(shouldUseNotifyUsersRpc("a", "a")).toBe(false);
    expect(shouldUseNotifyUsersRpc(undefined, "a")).toBe(false);
  });
});
