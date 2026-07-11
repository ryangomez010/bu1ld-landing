import { afterEach, describe, expect, mock, test } from "bun:test";

import { handleDigestRequest, type DigestEnv } from "./digest-handler";

const DIGEST_ENV: DigestEnv = {
  NODE_ENV: "production",
  DIGEST_API_SECRET: "digest-secret",
  RESEND_API_KEY: "re_test",
  SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function postDigest(
  body: unknown,
  auth = "Bearer digest-secret",
  headers: Record<string, string> = {},
): Request {
  return new Request("https://app.example.com/api/digest", {
    method: "POST",
    headers: {
      authorization: auth,
      "content-type": "application/json",
      origin: "https://app.example.com",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("handleDigestRequest", () => {
  test("rejects non-POST methods", async () => {
    const res = await handleDigestRequest(
      new Request("https://app.example.com/api/digest", { method: "GET" }),
      DIGEST_ENV,
    );
    expect(res.status).toBe(405);
  });

  test("rejects cross-origin requests in production", async () => {
    const res = await handleDigestRequest(
      postDigest({ dryRun: true }, "Bearer digest-secret", { origin: "https://evil.com" }),
      DIGEST_ENV,
    );
    expect(res.status).toBe(403);
  });

  test("rejects oversized payloads", async () => {
    const res = await handleDigestRequest(
      new Request("https://app.example.com/api/digest", {
        method: "POST",
        headers: {
          authorization: "Bearer digest-secret",
          origin: "https://app.example.com",
          "content-length": "999999",
        },
        body: "{}",
      }),
      DIGEST_ENV,
    );
    expect(res.status).toBe(413);
  });

  test("rejects unauthorized requests", async () => {
    const res = await handleDigestRequest(postDigest({}, "Bearer wrong"), DIGEST_ENV);
    expect(res.status).toBe(401);
  });

  test("rejects missing Supabase config", async () => {
    const res = await handleDigestRequest(postDigest({ dryRun: true }), {
      DIGEST_API_SECRET: "digest-secret",
    });
    expect(res.status).toBe(503);
  });

  test("dry run returns ok without sending", async () => {
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/member_preferences")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                user_id: "550e8400-e29b-41d4-a716-446655440000",
                email_digest_frequency: "daily",
                last_digest_sent_at: null,
                profiles: {
                  full_name: "Ada",
                  interests: ["ml"],
                  onboarding_completed: true,
                },
              },
            ]),
            { status: 200 },
          ),
        );
      }
      if (url.includes("/auth/v1/admin/users/")) {
        return Promise.resolve(
          new Response(JSON.stringify({ email: "ada@example.com" }), { status: 200 }),
        );
      }
      if (url.includes("/notification_preferences")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      if (url.includes("/rest/v1/")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof fetch;

    const res = await handleDigestRequest(
      postDigest({ dryRun: true, frequency: "daily" }),
      DIGEST_ENV,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok?: boolean; skipped?: number };
    expect(json.ok).toBe(true);
    expect(json.skipped).toBeGreaterThanOrEqual(0);
  });
});
