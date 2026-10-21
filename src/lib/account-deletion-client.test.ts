import { describe, expect, test } from "bun:test";
import { finalizeAccountDeletion } from "./account-deletion-client";

const response = (body: unknown, status = 200) =>
  (async () => Response.json(body, { status })) as typeof fetch;

describe("account deletion confirmation", () => {
  test("requires an explicit successful deletion receipt", async () => {
    expect(
      await finalizeAccountDeletion("/api/account-deletion", "token", response({ deleted: true })),
    ).toEqual({ error: null, status: "complete" });
    expect(
      (await finalizeAccountDeletion("/api/account-deletion", "token", response({}))).status,
    ).toBe("unknown");
    expect(
      (
        await finalizeAccountDeletion(
          "/api/account-deletion",
          "token",
          response({ deleted: true }, 500),
        )
      ).status,
    ).toBe("unknown");
  });

  test("keeps partial and configuration failures distinct", async () => {
    const partial = await finalizeAccountDeletion(
      "/api/account-deletion",
      "token",
      response({ dataRemoved: true, status: "partial" }, 502),
    );
    expect(partial.status).toBe("partial");
    expect(partial.error).toContain("sign-in credential deletion is not confirmed");
    expect(
      (
        await finalizeAccountDeletion(
          "/api/account-deletion",
          "token",
          response({ error: "Not configured" }, 503),
        )
      ).status,
    ).toBe("not_started");
  });

  test("network and non-JSON responses remain unknown and retryable", async () => {
    const failed = (async () => {
      throw new Error("Lost response");
    }) as typeof fetch;
    expect((await finalizeAccountDeletion("/api/account-deletion", "token", failed)).status).toBe(
      "unknown",
    );
    const html = (async () =>
      new Response("<html>Server error</html>", { status: 502 })) as typeof fetch;
    expect((await finalizeAccountDeletion("/api/account-deletion", "token", html)).error).toContain(
      "Some data may already have been removed",
    );
  });
});
