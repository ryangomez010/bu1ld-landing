/**
 * Vercel serverless email handler.
 * Env: RESEND_API_KEY, EMAIL_API_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { handleEmailRequest, type EmailEnv } from "../src/lib/email-handler";

type VercelReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VercelRes = {
  status: (code: number) => { json: (body: unknown) => void; send: (body: string) => void };
  setHeader: (key: string, value: string) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }

  const request = new Request("https://localhost/api/email", {
    method: req.method ?? "GET",
    headers,
    body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
  });

  const response = await handleEmailRequest(request, process.env as EmailEnv);
  const text = await response.text();
  res.status(response.status).send(text);
}
