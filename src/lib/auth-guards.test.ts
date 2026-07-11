import { describe, expect, test } from "bun:test";

import { authedRedirectPath, memberGatePath, shouldUseNotifyUsersRpc } from "./auth-guards";

describe("auth-guards", () => {
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
