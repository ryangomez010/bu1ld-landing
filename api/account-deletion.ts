/**
 * Vercel serverless account deletion finalizer (service role).
 * Env: ACCOUNT_DELETION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import {
  handleAccountDeletionRequest,
  type AccountDeletionEnv,
} from "../src/lib/account-deletion-handler";
import { sendFetchResponse, serverRequestUrl } from "../src/lib/server-request";

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

  const request = new Request(serverRequestUrl("/api/account-deletion", req.headers, process.env), {
    method: req.method ?? "POST",
    headers,
    body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
  });

  const response = await handleAccountDeletionRequest(request, process.env as AccountDeletionEnv);
  await sendFetchResponse(response, res, request.url.startsWith("https://"));
}
