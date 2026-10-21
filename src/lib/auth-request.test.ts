import { describe, expect, test } from "bun:test";
import { authCallbackError, runAuthRequest } from "./auth-request";

describe("recoverable auth requests", () => {
  test("returns service failures and thrown network failures to the form", async () => {
    expect(await runAuthRequest(async () => ({ error: null }))).toEqual({ error: null });
    expect(await runAuthRequest(async () => ({ error: { message: "Invalid login" } }))).toEqual({
      error: "Invalid login",
    });
    expect(
      await runAuthRequest(async () => {
        throw new Error("Network unavailable");
      }),
    ).toEqual({
      error: "Network unavailable",
    });
    expect(
      (
        await runAuthRequest(async () => {
          throw null;
        })
      ).error,
    ).toContain("try again");
  });

  test("handles provider errors without double decoding malformed percent escapes", () => {
    expect(authCallbackError("?error_description=Only+50%25+complete", "")).toBe(
      "Only 50% complete",
    );
    expect(authCallbackError("", "#error_description=Bad%20%25ZZ")).toBe("Bad %ZZ");
    expect(authCallbackError("?error=access_denied", "")).toBe("access_denied");
    expect(authCallbackError("?code=abc", "")).toBeNull();
  });
});
