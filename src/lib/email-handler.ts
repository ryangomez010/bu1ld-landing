/** Shared email send logic for Cloudflare Workers and Vercel. */

import { enforceRateLimit, type RateLimitKv } from "@/lib/rate-limit-store";
import {
  clampText,
  isSameOriginRequest,
  isTrustedSupabaseUrl,
  isValidEmail,
  jsonResponse,
  LIMITS,
  sanitizeEmailHtml,
} from "@/lib/security";
import { parseEmailRequestInput } from "@/lib/validation";

export type EmailRequestBody = {
  to?: string;
  userId?: string;
  subject: string;
  html: string;
};

export type EmailEnv = {
  RESEND_API_KEY?: string;
  EMAIL_API_SECRET?: string;
  EMAIL_FROM?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  NODE_ENV?: string;
  ENVIRONMENT?: string;
  /** Set to "true" only for local dev when EMAIL_API_SECRET is unset. */
  EMAIL_ALLOW_UNAUTH_DEV?: string;
  /** Cloudflare KV binding for distributed rate limits. */
  RATE_LIMIT_KV?: RateLimitKv;
};

type EmailAuth = { mode: "secret" } | { mode: "session"; userId: string; email: string };

const MAX_BODY_BYTES = 64_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function isProduction(env: EmailEnv): boolean {
  return env.NODE_ENV === "production" || env.ENVIRONMENT === "production";
}

function requireAuth(env: EmailEnv): Response | null {
  const secret = env.EMAIL_API_SECRET?.trim();
  if (secret) return null;
  if (isProduction(env)) return null;
  if (env.EMAIL_ALLOW_UNAUTH_DEV !== "true") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}

async function resolveEmailAuth(request: Request, env: EmailEnv): Promise<EmailAuth | Response> {
  const secret = env.EMAIL_API_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (secret && bearer === secret) {
    return { mode: "secret" };
  }

  if (bearer) {
    const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
    const apiKey = env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && apiKey && isTrustedSupabaseUrl(supabaseUrl)) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${bearer}`,
          apikey: apiKey,
        },
      });
      if (userRes.ok) {
        const user = (await userRes.json()) as { id?: string; email?: string };
        if (user.id && user.email) {
          return { mode: "session", userId: user.id, email: user.email.trim() };
        }
      }
    }
  }

  const authFailure = requireAuth(env);
  if (authFailure) return authFailure;

  if (!isProduction(env) && env.EMAIL_ALLOW_UNAUTH_DEV === "true") {
    return { mode: "secret" };
  }

  if (secret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  return jsonResponse({ error: "Unauthorized" }, 401);
}

function authorizeRecipient(
  auth: EmailAuth,
  body: { to?: string; userId?: string },
): Response | null {
  if (auth.mode === "secret") return null;

  if (body.userId && body.userId !== auth.userId) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }
  if (body.to && body.to.trim().toLowerCase() !== auth.email.toLowerCase()) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }
  return null;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function checkOrigin(request: Request, env: EmailEnv): Response | null {
  if (isProduction(env)) {
    try {
      const host = new URL(request.url).host;
      if (!isSameOriginRequest(request, host)) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
    } catch {
      return jsonResponse({ error: "Forbidden" }, 403);
    }
  }
  return null;
}

async function checkRateLimitRequest(request: Request, env: EmailEnv): Promise<Response | null> {
  const ip = clientIp(request);
  const result = await enforceRateLimit(
    "email",
    ip,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX,
    env.RATE_LIMIT_KV,
  );
  if (!result.allowed) {
    return jsonResponse({ error: "Too many requests" }, 429);
  }
  return null;
}

export async function handleEmailRequest(request: Request, env: EmailEnv): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authResult = await resolveEmailAuth(request, env);
  if (authResult instanceof Response) return authResult;

  const originError = checkOrigin(request, env);
  if (originError) return originError;

  const rateError = await checkRateLimitRequest(request, env);
  if (rateError) return rateError;

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Payload too large" }, 413);
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "Email not configured" }, 503);
  }

  let rawBody: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Payload too large" }, 413);
    }
    rawBody = JSON.parse(raw) as unknown;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = parseEmailRequestInput(rawBody);
  if (parsed.error || !parsed.data) {
    return jsonResponse({ error: parsed.error ?? "Invalid payload" }, 400);
  }
  const body = parsed.data;

  const recipientError = authorizeRecipient(authResult, body);
  if (recipientError) return recipientError;

  const subject = clampText(body.subject, LIMITS.emailSubject);
  const html = sanitizeEmailHtml(clampText(body.html, LIMITS.emailHtml));

  let to = body.to?.trim();
  if (to && !isValidEmail(to)) {
    return jsonResponse({ error: "Invalid recipient email" }, 400);
  }

  if (!to && body.userId) {
    if (authResult.mode === "session" && body.userId === authResult.userId) {
      to = authResult.email;
    } else if (authResult.mode !== "secret") {
      return jsonResponse({ error: "Forbidden" }, 403);
    } else {
      const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
      const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        return jsonResponse({ error: "Cannot resolve user email" }, 503);
      }
      if (!isTrustedSupabaseUrl(supabaseUrl)) {
        return jsonResponse({ error: "Invalid Supabase configuration" }, 503);
      }
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${body.userId}`, {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      });
      if (!userRes.ok) {
        return jsonResponse({ error: "User not found" }, 404);
      }
      const user = (await userRes.json()) as { email?: string };
      to = user.email?.trim();
    }
  }

  if (!to || !isValidEmail(to)) {
    return jsonResponse({ error: "Missing recipient" }, 400);
  }

  const from = env.EMAIL_FROM ?? "The Bu1ld <hello@thebu1ld.com>";
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!sendRes.ok) {
    const detail = await sendRes.text();
    console.error("[email]", sendRes.status, detail);
    return jsonResponse({ error: "Failed to send email" }, 502);
  }

  return jsonResponse({ sent: true });
}
