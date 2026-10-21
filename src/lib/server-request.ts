import { securityHeaders } from "@/lib/security";

type HeaderValue = string | string[] | undefined;

type ServerRequestEnv = {
  BU1LD_SITE_ORIGIN?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

function firstHeader(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOrigin(value: string | undefined, allowHttp: boolean): string | undefined {
  if (!value) return undefined;
  try {
    const candidate = value.includes("://") ? value : `https://${value}`;
    const parsed = new URL(candidate);
    if (parsed.username || parsed.password || parsed.pathname !== "/") return undefined;
    if (parsed.protocol === "https:" || (allowHttp && parsed.protocol === "http:")) {
      return parsed.origin;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Build the Request URL from deployment-owned configuration in production. */
export function serverRequestUrl(
  path: `/${string}`,
  headers: Record<string, HeaderValue>,
  env: ServerRequestEnv,
): string {
  const production = env.VERCEL_ENV
    ? env.VERCEL_ENV === "production"
    : env.NODE_ENV === "production";
  const configured =
    parseOrigin(env.BU1LD_SITE_ORIGIN, !production) ??
    parseOrigin(production ? "https://thebu1ld.com" : env.VERCEL_URL, !production);
  if (configured) return new URL(path, configured).toString();

  const host = firstHeader(headers["x-forwarded-host"] ?? headers.host);
  const proto = firstHeader(headers["x-forwarded-proto"]);
  const fallback = parseOrigin(
    host && /^(https?)$/.test(proto ?? "") ? `${proto}://${host}` : undefined,
    true,
  );
  return new URL(path, fallback ?? "http://localhost").toString();
}

type SendResponse = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
};

/** Preserve the shared handler's content type and security headers in adapters. */
export async function sendFetchResponse(
  response: Response,
  res: SendResponse,
  hsts = false,
): Promise<void> {
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (hsts) {
    res.setHeader(
      "strict-transport-security",
      securityHeaders({ hsts: true })["Strict-Transport-Security"]!,
    );
  }
  res.status(response.status).send(await response.text());
}
