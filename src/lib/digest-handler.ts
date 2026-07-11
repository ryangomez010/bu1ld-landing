/** Scheduled digest sender — invoked by cron (Vercel Cron / Cloudflare Workers). */

import {
  buildDigestEmail,
  isDigestDue,
  shouldRunWeeklyDigest,
  type DigestRecipient,
} from "@/lib/digest";
import { fetchDigestFeedSources } from "@/lib/digest-content";
import { buildForYouFeed } from "@/lib/personalization";
import { enforceRateLimit, type RateLimitKv } from "@/lib/rate-limit-store";
import {
  clampText,
  isSameOriginRequest,
  isTrustedSupabaseUrl,
  isUuid,
  jsonResponse,
  LIMITS,
  sanitizeEmailHtml,
} from "@/lib/security";
import { parseDigestRequestInput } from "@/lib/validation";

export type DigestEnv = {
  DIGEST_API_SECRET?: string;
  EMAIL_API_SECRET?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  NODE_ENV?: string;
  ENVIRONMENT?: string;
  RATE_LIMIT_KV?: RateLimitKv;
};

export type DigestRequestBody = {
  frequency?: "daily" | "weekly";
  force?: boolean;
  dryRun?: boolean;
};

type DigestSendResult = {
  userId: string;
  sent: boolean;
  skipped?: string;
  itemCount?: number;
  error?: string;
};

const MAX_BODY_BYTES = 16_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isProduction(env: DigestEnv): boolean {
  return env.NODE_ENV === "production" || env.ENVIRONMENT === "production";
}

function resolveSecret(env: DigestEnv): string | undefined {
  return env.DIGEST_API_SECRET?.trim() || env.CRON_SECRET?.trim() || env.EMAIL_API_SECRET?.trim();
}

function checkAuth(request: Request, env: DigestEnv): Response | null {
  const secret = resolveSecret(env);
  if (!secret) {
    return jsonResponse({ error: "Digest API secret not configured" }, 503);
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}

function checkOrigin(request: Request, env: DigestEnv): Response | null {
  if (!isProduction(env)) return null;
  try {
    const host = new URL(request.url).host;
    if (!isSameOriginRequest(request, host)) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }
  } catch {
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

async function checkRateLimitRequest(request: Request, env: DigestEnv): Promise<Response | null> {
  const ip = clientIp(request);
  const result = await enforceRateLimit(
    "digest",
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

function isCronRequest(request: Request): boolean {
  return request.method === "GET";
}

function supabaseConfig(env: DigestEnv): { url: string; key: string } | null {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !isTrustedSupabaseUrl(url)) return null;
  return { url, key };
}

async function supabaseFetch<T>(
  config: { url: string; key: string },
  path: string,
  init?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${config.url}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: config.key,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      return { data: null, error: await res.text() };
    }
    return { data: (await res.json()) as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Request failed" };
  }
}

type DigestRow = {
  user_id: string;
  email_digest_frequency: "daily" | "weekly" | "never";
  last_digest_sent_at: string | null;
  profiles: {
    full_name: string | null;
    interests: string[] | null;
    onboarding_completed: boolean;
  } | null;
};

async function fetchDigestRecipients(
  config: { url: string; key: string },
  frequency: "daily" | "weekly",
): Promise<{ recipients: DigestRecipient[]; error: string | null }> {
  const { data, error } = await supabaseFetch<DigestRow[]>(
    config,
    `/rest/v1/member_preferences?select=user_id,email_digest_frequency,last_digest_sent_at,profiles(full_name,interests,onboarding_completed)&email_digest_frequency=eq.${frequency}`,
  );
  if (error) return { recipients: [], error };

  const recipients: DigestRecipient[] = [];
  for (const row of data ?? []) {
    if (!row.profiles?.onboarding_completed) continue;
    const interests = row.profiles.interests ?? [];
    if (!interests.length) continue;

    const { data: authUser, error: authError } = await supabaseFetch<{ email?: string }>(
      config,
      `/auth/v1/admin/users/${row.user_id}`,
    );
    if (authError || !authUser?.email) continue;

    const { data: notifPrefs } = await supabaseFetch<
      Array<{ pref_key: string; email_enabled: boolean }>
    >(
      config,
      `/rest/v1/notification_preferences?select=pref_key,email_enabled&user_id=eq.${row.user_id}&pref_key=eq.digest`,
    );
    const digestPref = notifPrefs?.[0];
    if (digestPref && !digestPref.email_enabled) continue;

    if (!isDigestDue(frequency, row.last_digest_sent_at)) continue;

    recipients.push({
      userId: row.user_id,
      email: authUser.email,
      fullName: row.profiles.full_name,
      interests,
      frequency,
    });
  }

  return { recipients, error: null };
}

async function sendDigestEmail(
  env: DigestEnv,
  recipient: DigestRecipient,
  subject: string,
  html: string,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "RESEND_API_KEY not configured" };

  const from = env.EMAIL_FROM ?? "The Bu1ld <hello@thebu1ld.com>";
  const safeSubject = clampText(subject, LIMITS.emailSubject);
  const safeHtml = sanitizeEmailHtml(clampText(html, LIMITS.emailHtml));

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: recipient.email, subject: safeSubject, html: safeHtml }),
  });

  if (!res.ok) {
    return { sent: false, error: await res.text() };
  }
  return { sent: true };
}

async function markDigestSent(config: { url: string; key: string }, userId: string): Promise<void> {
  if (!isUuid(userId)) return;
  await supabaseFetch(config, `/rest/v1/member_preferences?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ last_digest_sent_at: new Date().toISOString() }),
  });
}

export async function handleDigestRequest(request: Request, env: DigestEnv): Promise<Response> {
  const cron = isCronRequest(request);
  if (request.method !== "POST" && !cron) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authError = checkAuth(request, env);
  if (authError) return authError;

  if (!cron) {
    const originError = checkOrigin(request, env);
    if (originError) return originError;
  }

  const rateError = await checkRateLimitRequest(request, env);
  if (rateError) return rateError;

  if (!cron) {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Payload too large" }, 413);
    }
  }

  const config = supabaseConfig(env);
  if (!config) {
    return jsonResponse({ error: "Supabase service role not configured" }, 503);
  }

  let body: DigestRequestBody = {};
  if (!cron) {
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return jsonResponse({ error: "Payload too large" }, 413);
      }
      const rawJson = raw.trim() ? (JSON.parse(raw) as unknown) : {};
      const parsed = parseDigestRequestInput(rawJson);
      if (parsed.error) {
        return jsonResponse({ error: parsed.error }, 400);
      }
      body = parsed.data;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }
  }

  const force = body.force === true;
  const dryRun = body.dryRun === true;
  const now = new Date();

  const frequencies: Array<"daily" | "weekly"> = [];
  if (body.frequency) {
    frequencies.push(body.frequency);
  } else {
    frequencies.push("daily");
    if (shouldRunWeeklyDigest(now, force)) frequencies.push("weekly");
  }

  if (frequencies.includes("weekly") && !shouldRunWeeklyDigest(now, force) && !body.frequency) {
    // Weekly skipped today unless explicitly requested
    const idx = frequencies.indexOf("weekly");
    if (idx >= 0) frequencies.splice(idx, 1);
  }

  const results: DigestSendResult[] = [];

  const feedSources = await fetchDigestFeedSources(config);

  for (const frequency of frequencies) {
    const { recipients, error } = await fetchDigestRecipients(config, frequency);
    if (error) {
      return jsonResponse({ error: `Failed to load recipients: ${error}` }, 502);
    }

    for (const recipient of recipients) {
      const items = await buildForYouFeed(recipient.interests, { sources: feedSources });
      const { subject, html, itemCount } = buildDigestEmail(recipient, items);

      if (dryRun) {
        results.push({ userId: recipient.userId, sent: false, skipped: "dry_run", itemCount });
        continue;
      }

      const sendResult = await sendDigestEmail(env, recipient, subject, html);
      if (!sendResult.sent) {
        results.push({
          userId: recipient.userId,
          sent: false,
          error: sendResult.error,
          itemCount,
        });
        continue;
      }

      await markDigestSent(config, recipient.userId);
      results.push({ userId: recipient.userId, sent: true, itemCount });
    }
  }

  const sent = results.filter((r) => r.sent).length;
  const failed = results.filter((r) => r.error).length;
  const skipped = results.filter((r) => r.skipped).length;

  return jsonResponse({
    ok: true,
    frequencies,
    sent,
    failed,
    skipped,
    results,
  });
}
