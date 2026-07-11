import { afterEach, describe, expect, mock, test } from "bun:test";

import { handleAccountDeletionRequest, type AccountDeletionEnv } from "./account-deletion-handler";

const ENV: AccountDeletionEnv = {
  SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
};

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const TOKEN = "user-jwt-token";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function deleteRequest(auth?: string): Request {
  return new Request("https://app.example.com/api/account-deletion", {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });
}

describe("handleAccountDeletionRequest", () => {
  test("rejects non-POST methods", async () => {
    const res = await handleAccountDeletionRequest(
      new Request("https://app.example.com/api/account-deletion", { method: "GET" }),
      ENV,
    );
    expect(res.status).toBe(405);
  });

  test("rejects missing bearer token", async () => {
    const res = await handleAccountDeletionRequest(deleteRequest(), ENV);
    expect(res.status).toBe(401);
  });

  test("rejects invalid session", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Unauthorized", { status: 401 })),
    ) as typeof fetch;

    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(401);
  });

  test("deletes auth user when session is valid", async () => {
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/v1/user")) {
        return Promise.resolve(new Response(JSON.stringify({ id: USER_ID }), { status: 200 }));
      }
      if (url.includes("/auth/v1/admin/users/") && init?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    }) as typeof fetch;

    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { deleted?: boolean };
    expect(json.deleted).toBe(true);
  });
});
