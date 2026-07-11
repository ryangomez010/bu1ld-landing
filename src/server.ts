import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { handleAccountDeletionRequest, type AccountDeletionEnv } from "./lib/account-deletion-handler";
import { handleDigestRequest, type DigestEnv } from "./lib/digest-handler";
import { handleEmailRequest, type EmailEnv } from "./lib/email-handler";
import { renderErrorPage } from "./lib/error-page";
import { applySecurityHeaders } from "./lib/security";
import type { RateLimitKv } from "./lib/rate-limit-store";

type WorkerEnv = EmailEnv &
  DigestEnv &
  AccountDeletionEnv & {
    RATE_LIMIT_KV?: RateLimitKv;
  };

function withRateLimitKv(env: unknown): WorkerEnv {
  const e = env as WorkerEnv & { RATE_LIMIT_KV?: RateLimitKv };
  return {
    ...e,
    RATE_LIMIT_KV: e.RATE_LIMIT_KV,
  };
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return applySecurityHeaders(
    new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  );
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      const workerEnv = withRateLimitKv(env);
      if (url.pathname === "/api/health") {
        return applySecurityHeaders(
          new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      if (url.pathname === "/api/email") {
        return handleEmailRequest(request, workerEnv);
      }
      if (url.pathname === "/api/digest") {
        return handleDigestRequest(request, workerEnv);
      }
      if (url.pathname === "/api/account-deletion") {
        return handleAccountDeletionRequest(request, workerEnv);
      }

      const handler = await getServerEntry();
      const response = applySecurityHeaders(
        await handler.fetch(request, env, ctx),
        url.protocol === "https:",
      );
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
