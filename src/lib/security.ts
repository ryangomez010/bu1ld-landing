/** Shared validation and sanitization for security-sensitive paths. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export const LIMITS = {
  emailSubject: 200,
  emailHtml: 50_000,
  notificationTitle: 200,
  notificationBody: 500,
  announcementTitle: 200,
  announcementBody: 5_000,
  profileName: 120,
  profileBio: 2_000,
  profileUrl: 500,
  profileGoal: 120,
  applicationPitch: 4_000,
  collectionName: 80,
  collectionDescription: 500,
  feedbackBody: 2_000,
  reportReason: 500,
} as const;

/** Client-side form submission throttle — pairs with server rate limits at scale. */
const formBuckets = new Map<string, number[]>();

export function checkFormRateLimit(
  userId: string,
  formId: string,
  windowMs = 60_000,
  maxHits = 10,
): RateLimitResult {
  return checkRateLimit(formBuckets, `${userId}:${formId}`, windowMs, maxHits);
}

export const SENSITIVE_ACTIONS = [
  "password_change",
  "password_changed",
  "email_change",
  "account_deletion",
  "account_deletion_completed",
  "account_deletion_requested",
  "avatar_updated",
  "avatar_removed",
  "preference_updated",
  "profile_export",
  "oauth_unlink",
  "sign_in",
  "global_sign_out",
] as const;

export type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];

export function isSensitiveAction(value: string): value is SensitiveAction {
  return (SENSITIVE_ACTIONS as readonly string[]).includes(value);
}

/** Allowed Supabase project URLs for server-side fetches (SSRF guard). */
export function isTrustedSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

const IMAGE_MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header; WEBP marker checked below
};

/** Verify file header bytes match declared image MIME (defense beyond client-reported type). */
export async function validateImageMagicBytes(file: Blob, declaredType: string): Promise<boolean> {
  const patterns = IMAGE_MAGIC[declaredType];
  if (!patterns) return false;

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matchesPattern = patterns.some((pattern) => pattern.every((byte, i) => header[i] === byte));
  if (!matchesPattern) return false;

  if (declaredType === "image/webp") {
    const marker = String.fromCharCode(header[8]!, header[9]!, header[10]!, header[11]!);
    return marker === "WEBP";
  }
  return true;
}

export type PasswordCheck = { ok: true } | { ok: false; reason: string };

/** Minimum bar for member passwords — letter + digit, no whitespace. */
export function validatePassword(value: string): PasswordCheck {
  const trimmed = value.trim();
  if (trimmed.length < PASSWORD_MIN) {
    return { ok: false, reason: `Password must be at least ${PASSWORD_MIN} characters.` };
  }
  if (trimmed.length > PASSWORD_MAX) {
    return { ok: false, reason: `Password must be at most ${PASSWORD_MAX} characters.` };
  }
  if (/\s/.test(trimmed)) {
    return { ok: false, reason: "Password cannot contain spaces." };
  }
  if (!/[a-zA-Z]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return { ok: false, reason: "Use at least one letter and one number." };
  }
  return { ok: true };
}

/** Strip control chars and angle brackets for plain-text fields. */
export function sanitizeText(value: string, max: number): string {
  const stripped = value
    .split("")
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127 && ch !== "<" && ch !== ">";
    })
    .join("");
  return clampText(stripped, max);
}

/** Reject cross-origin form posts when Origin/Referer are present. */
export function isSameOriginRequest(request: Request, allowedHost: string): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === allowedHost;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === allowedHost;
    } catch {
      return false;
    }
  }
  return true;
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

/** In-memory sliding window — suitable for single-worker edge; use KV/Redis at scale. */
export function checkRateLimit(
  buckets: Map<string, number[]>,
  key: string,
  windowMs: number,
  maxHits: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= maxHits) {
    const oldest = hits[0] ?? now;
    return { allowed: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true };
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 254 && EMAIL_RE.test(trimmed);
}

export function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

/** In-app router paths only — blocks open redirects and javascript: URLs. */
export function sanitizeAppPath(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  const trimmed = path.trim();
  if (trimmed.length > 500) return undefined;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return undefined;
  }
  if (/^\/[^/]*:/i.test(trimmed)) return undefined;
  return trimmed;
}

/** Strip common HTML injection vectors from email bodies we did not fully escape. */
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export function securityHeaders(opts?: { hsts?: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  };
  if (opts?.hsts) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

export function applySecurityHeaders(response: Response, hsts = false): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders({ hsts }))) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return applySecurityHeaders(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  );
}
