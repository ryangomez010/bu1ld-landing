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
  applicationPitch: 4_000,
  collectionName: 80,
  collectionDescription: 500,
} as const;

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
