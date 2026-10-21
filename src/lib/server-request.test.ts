import { describe, expect, test } from "bun:test";

import { sendFetchResponse, serverRequestUrl } from "./server-request";

describe("server request adapters", () => {
  test("production request URLs ignore forged forwarded hosts", () => {
    expect(
      serverRequestUrl(
        "/api/email",
        { "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" },
        { VERCEL_ENV: "production" },
      ),
    ).toBe("https://thebu1ld.com/api/email");
  });

  test("invalid production origin configuration fails closed to the canonical site", () => {
    expect(
      serverRequestUrl(
        "/api/account-deletion",
        { "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" },
        { NODE_ENV: "production", BU1LD_SITE_ORIGIN: "javascript:alert(1)" },
      ),
    ).toBe("https://thebu1ld.com/api/account-deletion");
  });

  test("production request URLs accept an explicit canonical origin", () => {
    expect(
      serverRequestUrl(
        "/api/digest",
        {},
        {
          VERCEL_ENV: "production",
          BU1LD_SITE_ORIGIN: "https://research.thebu1ld.com",
        },
      ),
    ).toBe("https://research.thebu1ld.com/api/digest");
  });

  test("response forwarding preserves security headers", async () => {
    const headers = new Map<string, string>();
    let status = 0;
    let body = "";
    await sendFetchResponse(
      new Response("ok", {
        status: 201,
        headers: { "content-type": "text/plain", "x-frame-options": "DENY" },
      }),
      {
        setHeader: (key, value) => headers.set(key, value),
        status: (code) => ({
          send: (value) => {
            status = code;
            body = value;
          },
        }),
      },
      true,
    );
    expect(status).toBe(201);
    expect(body).toBe("ok");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("strict-transport-security")).toContain("max-age");
  });
});
