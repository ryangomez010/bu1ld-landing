/** Shared email send logic for Cloudflare Workers and Vercel. */

import {
  clampText,
  checkRateLimit,
  isUuid,
  isValidEmail,
  jsonResponse,
  LIMITS,
  sanitizeEmailHtml,
} from "@/lib/security";

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
  NODE_ENV?: string;
  ENVIRONMENT?: string;
  /** Set to "true" only for local dev when EMAIL_API_SECRET is unset. */
  EMAIL_ALLOW_UNAUTH_DEV?: string;
};

const MAX_BODY_BYTES = 64_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const rateBuckets = new Map<string, number[]>();

function isProduction(env: EmailEnv): boolean {
  return env.NODE_ENV === "production" || env.ENVIRONMENT === "production";
}

function requireAuth(env: EmailEnv): Response | null {
  const secret = env.EMAIL_API_SECRET?.trim();
  if (secret) {
    return null;
  }
  if (isProduction(env)) {
    return jsonResponse({ error: "Email API secret not configured" }, 503);
  }
  if (env.EMAIL_ALLOW_UNAUTH_DEV !== "true") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}

function checkAuth(request: Request, env: EmailEnv): Response | null {
  const authFailure = requireAuth(env);
  if (authFailure) return authFailure;

  const secret = env.EMAIL_API_SECRET?.trim();
  if (!secret) return null;

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
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

function checkRateLimitRequest(request: Request): Response | null {
  const ip = clientIp(request);
  const result = checkRateLimit(rateBuckets, ip, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX);
  if (!result.allowed) {
    return jsonResponse({ error: "Too many requests" }, 429);
  }
  return null;
}

export async function handleEmailRequest(request: Request, env: EmailEnv): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authError = checkAuth(request, env);
  if (authError) return authError;

  const rateError = checkRateLimitRequest(request);
  if (rateError) return rateError;

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Payload too large" }, 413);
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "Email not configured" }, 503);
  }

  let body: EmailRequestBody;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Payload too large" }, 413);
    }
    body = JSON.parse(raw) as EmailRequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const subject = clampText(String(body.subject ?? ""), LIMITS.emailSubject);
  const html = sanitizeEmailHtml(clampText(String(body.html ?? ""), LIMITS.emailHtml));
  if (!subject || !html) {
    return jsonResponse({ error: "Missing subject or html" }, 400);
  }

  let to = body.to?.trim();
  if (to && !isValidEmail(to)) {
    return jsonResponse({ error: "Invalid recipient email" }, 400);
  }

  if (!to && body.userId) {
    if (!isUuid(body.userId)) {
      return jsonResponse({ error: "Invalid user id" }, 400);
    }
    const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Cannot resolve user email" }, 503);
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
