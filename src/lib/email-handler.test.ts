import { afterEach, describe, expect, mock, test } from "bun:test";

import { handleEmailRequest, type EmailEnv } from "./email-handler";

const PROD_ENV: EmailEnv = {
  NODE_ENV: "production",
  EMAIL_API_SECRET: "test-secret",
  RESEND_API_KEY: "re_test",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function postEmail(
  body: unknown,
  opts?: { headers?: Record<string, string>; url?: string },
): Request {
  return new Request(opts?.url ?? "https://app.example.com/api/email", {
    method: "POST",
    headers: {
      authorization: "Bearer test-secret",
      "content-type": "application/json",
      origin: "https://app.example.com",
      ...opts?.headers,
    },
    body: JSON.stringify(body),
  });
}

describe("handleEmailRequest", () => {
  test("rejects non-POST methods", async () => {
    const res = await handleEmailRequest(
      new Request("https://app.example.com/api/email", { method: "GET" }),
      PROD_ENV,
    );
    expect(res.status).toBe(405);
  });

  test("rejects missing bearer token in production", async () => {
    const res = await handleEmailRequest(
      postEmail(
        { subject: "Hi", html: "<p>Hi</p>" },
        { headers: { authorization: "Bearer wrong" } },
      ),
      PROD_ENV,
    );
    expect(res.status).toBe(401);
  });

  test("rejects cross-origin requests in production", async () => {
    const res = await handleEmailRequest(
      postEmail(
        { to: "user@example.com", subject: "Hi", html: "<p>Hi</p>" },
        { headers: { origin: "https://evil.com" } },
      ),
      PROD_ENV,
    );
    expect(res.status).toBe(403);
  });

  test("rejects invalid JSON", async () => {
    const res = await handleEmailRequest(
      new Request("https://app.example.com/api/email", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret",
          origin: "https://app.example.com",
        },
        body: "{not-json",
      }),
      PROD_ENV,
    );
    expect(res.status).toBe(400);
  });

  test("rejects missing subject or html", async () => {
    const res = await handleEmailRequest(postEmail({ subject: "", html: "" }), PROD_ENV);
    expect(res.status).toBe(400);
  });

  test("rejects invalid recipient email", async () => {
    const res = await handleEmailRequest(
      postEmail({ to: "not-an-email", subject: "Hi", html: "<p>Hi</p>" }),
      PROD_ENV,
    );
    expect(res.status).toBe(400);
  });

  test("rejects untrusted Supabase URL when resolving userId", async () => {
    const res = await handleEmailRequest(
      postEmail({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        subject: "Hi",
        html: "<p>Hi</p>",
      }),
      {
        ...PROD_ENV,
        SUPABASE_URL: "https://evil.example.com",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      },
    );
    expect(res.status).toBe(503);
  });

  test("rejects payload too large via content-length", async () => {
    const res = await handleEmailRequest(
      new Request("https://app.example.com/api/email", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret",
          origin: "https://app.example.com",
          "content-length": "999999",
        },
        body: "{}",
      }),
      PROD_ENV,
    );
    expect(res.status).toBe(413);
  });

  test("sends email when configured", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ id: "email_1" }), { status: 200 })),
    ) as typeof fetch;

    const res = await handleEmailRequest(
      postEmail({ to: "user@example.com", subject: "Hello", html: "<p>Hello</p>" }),
      PROD_ENV,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { sent?: boolean };
    expect(json.sent).toBe(true);
  });

  test("strips script tags from html payload", async () => {
    let capturedBody = "";
    globalThis.fetch = mock((_input, init) => {
      capturedBody = String(init?.body ?? "");
      return Promise.resolve(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));
    }) as typeof fetch;

    await handleEmailRequest(
      postEmail({
        to: "user@example.com",
        subject: "Hello",
        html: "<p>Hi</p><script>alert(1)</script>",
      }),
      PROD_ENV,
    );
    expect(capturedBody).not.toContain("<script");
  });
});
