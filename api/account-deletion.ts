/**
 * Vercel serverless account deletion finalizer (service role).
 * Env: ACCOUNT_DELETION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import {
  handleAccountDeletionRequest,
  type AccountDeletionEnv,
} from "../src/lib/account-deletion-handler";

type VercelReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VercelRes = {
  status: (code: number) => { send: (body: string) => void };
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

  const request = new Request(`${proto}://${host}/api/account-deletion`, {
    method: req.method ?? "POST",
    headers,
    body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
  });

  const response = await handleAccountDeletionRequest(request, process.env as AccountDeletionEnv);
  res.status(response.status).send(await response.text());
}
