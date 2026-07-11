import { checkRateLimit, type RateLimitResult } from "@/lib/security";

/** Cloudflare KV binding shape (optional on Vercel/local). */
export type RateLimitKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

const memoryBuckets = new Map<string, number[]>();

function kvKey(namespace: string, id: string): string {
  return `rl:${namespace}:${id}`;
}

/** Distributed sliding window when KV is bound; falls back to in-memory per isolate. */
export async function enforceRateLimit(
  namespace: string,
  id: string,
  windowMs: number,
  maxHits: number,
  kv?: RateLimitKv,
): Promise<RateLimitResult> {
  if (!kv) {
    return checkRateLimit(memoryBuckets, `${namespace}:${id}`, windowMs, maxHits);
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const key = kvKey(namespace, id);

  let hits: number[] = [];
  try {
    const raw = await kv.get(key);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        hits = parsed.filter((t): t is number => typeof t === "number" && t > windowStart);
      }
    }
  } catch {
    hits = [];
  }

  if (hits.length >= maxHits) {
    const oldest = hits[0] ?? now;
    return { allowed: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }

  hits.push(now);
  try {
    await kv.put(key, JSON.stringify(hits), {
      expirationTtl: Math.max(60, Math.ceil(windowMs / 1000) + 10),
    });
  } catch {
    return checkRateLimit(memoryBuckets, `${namespace}:${id}`, windowMs, maxHits);
  }

  return { allowed: true };
}
