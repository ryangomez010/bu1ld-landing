/**
 * Vercel cron handler for scheduled digest emails.
 * Env: RESEND_API_KEY, DIGEST_API_SECRET (or EMAIL_API_SECRET), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Schedule via vercel.json:
 *   { "path": "/api/digest", "schedule": "0 8 * * *" }
 */
import { handleDigestRequest, type DigestEnv } from "../src/lib/digest-handler";
import { sendFetchResponse, serverRequestUrl } from "../src/lib/server-request";

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

  const request = new Request(serverRequestUrl("/api/digest", req.headers, process.env), {
    method: req.method ?? "GET",
    headers,
    body: req.method === "POST" ? JSON.stringify(req.body ?? {}) : undefined,
  });

  const response = await handleDigestRequest(request, process.env as DigestEnv);
  await sendFetchResponse(response, res, request.url.startsWith("https://"));
}
