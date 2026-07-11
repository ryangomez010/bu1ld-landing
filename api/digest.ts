/**
 * Vercel cron handler for scheduled digest emails.
 * Env: RESEND_API_KEY, DIGEST_API_SECRET (or EMAIL_API_SECRET), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Schedule via vercel.json:
 *   { "path": "/api/digest", "schedule": "0 8 * * *" }
 */
import { handleDigestRequest, type DigestEnv } from "../src/lib/digest-handler";

type VercelReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VercelRes = {
  status: (code: number) => { json: (body: unknown) => void; send: (body: string) => void };
};

export default async function handler(req: VercelReq, res: VercelRes) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }

  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host;
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader) ?? "localhost";
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) ?? "https";

  const request = new Request(`${proto}://${host}/api/digest`, {
    method: req.method ?? "GET",
    headers,
    body: req.method === "POST" ? JSON.stringify(req.body ?? {}) : undefined,
  });

  const response = await handleDigestRequest(request, process.env as DigestEnv);
  const text = await response.text();
  res.status(response.status).send(text);
}
