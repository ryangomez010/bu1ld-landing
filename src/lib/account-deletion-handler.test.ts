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

  test("rejects cross-origin production requests before session lookup", async () => {
    const request = mock(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = request as typeof fetch;
    const res = await handleAccountDeletionRequest(
      new Request("https://app.example.com/api/account-deletion", {
        method: "POST",
        headers: {
          authorization: `Bearer ${TOKEN}`,
          origin: "https://evil.example",
        },
      }),
      { ...ENV, NODE_ENV: "production" },
    );
    expect(res.status).toBe(403);
    expect(request).not.toHaveBeenCalled();
  });

  test("rejects invalid session", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Unauthorized", { status: 401 })),
    ) as typeof fetch;

    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(401);
  });

  test("deletes auth user when session is valid", async () => {
    const calls: string[] = [];
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/auth/v1/user")) {
        return Promise.resolve(new Response(JSON.stringify({ id: USER_ID }), { status: 200 }));
      }
      if (url.includes("/auth/v1/admin/users/") && init?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (url.endsWith("/rest/v1/rpc/request_account_deletion")) {
        expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${TOKEN}`);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    }) as typeof fetch;

    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { deleted?: boolean };
    expect(json.deleted).toBe(true);
    expect(calls).toEqual([
      `${ENV.SUPABASE_URL}/auth/v1/user`,
      `${ENV.SUPABASE_URL}/rest/v1/rpc/request_account_deletion`,
      `${ENV.SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`,
    ]);
  });

  test("checks server configuration before any destructive request", async () => {
    const request = mock(() => Promise.resolve(new Response(null, { status: 200 })));
    globalThis.fetch = request as typeof fetch;
    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), {});
    expect(res.status).toBe(503);
    expect(request).not.toHaveBeenCalled();
  });

  test("does not delete Auth when member-data RPC fails", async () => {
    const methods: string[] = [];
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      methods.push(init?.method ?? "GET");
      return Promise.resolve(
        String(input).endsWith("/auth/v1/user")
          ? Response.json({ id: USER_ID })
          : new Response(null, { status: 500 }),
      );
    }) as typeof fetch;
    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ status: "not_started" });
    expect(methods).toEqual(["GET", "POST"]);
  });

  test("reports partial deletion if Auth removal fails after the RPC succeeds", async () => {
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/auth/v1/user"))
        return Promise.resolve(Response.json({ id: USER_ID }));
      return Promise.resolve(new Response(null, { status: init?.method === "DELETE" ? 500 : 204 }));
    }) as typeof fetch;
    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ dataRemoved: true, status: "partial" });
  });

  test("does not fabricate success when a destructive response is lost", async () => {
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      if (String(input).endsWith("/auth/v1/user"))
        return Promise.resolve(Response.json({ id: USER_ID }));
      return Promise.reject(new Error("Network lost"));
    }) as typeof fetch;
    const res = await handleAccountDeletionRequest(deleteRequest(`Bearer ${TOKEN}`), ENV);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ status: "unknown" });
  });
});
