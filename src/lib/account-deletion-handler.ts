/** Verify the session/configuration, scrub member data, then remove the Auth user. */

import { isSameOriginRequest, isTrustedSupabaseUrl, isUuid, jsonResponse } from "@/lib/security";

export type AccountDeletionEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  NODE_ENV?: string;
  ENVIRONMENT?: string;
};

function isProduction(env: AccountDeletionEnv): boolean {
  return env.NODE_ENV === "production" || env.ENVIRONMENT === "production";
}

async function resolveUserId(
  request: Request,
  env: AccountDeletionEnv,
): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !isTrustedSupabaseUrl(supabaseUrl)) {
    return jsonResponse({ error: "Supabase admin not configured" }, 503);
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceKey,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!userRes.ok) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  const user = (await userRes.json()) as { id?: string };
  if (!user.id || !isUuid(user.id)) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  return { userId: user.id };
}

export async function handleAccountDeletionRequest(
  request: Request,
  env: AccountDeletionEnv,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  if (isProduction(env)) {
    try {
      if (!isSameOriginRequest(request, new URL(request.url).origin)) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
    } catch {
      return jsonResponse({ error: "Forbidden" }, 403);
    }
  }

  let resolved: Awaited<ReturnType<typeof resolveUserId>>;
  try {
    resolved = await resolveUserId(request, env);
  } catch {
    return jsonResponse({ error: "Session could not be verified", status: "not_started" }, 502);
  }
  if (resolved instanceof Response) return resolved;

  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL!;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!;

  let dataRemoved = false;
  try {
    const scrub = await fetch(`${supabaseUrl}/rest/v1/rpc/request_account_deletion`, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("authorization")!,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(8000),
    });
    if (!scrub.ok)
      return jsonResponse({ error: "Member data deletion failed", status: "not_started" }, 502);
    dataRemoved = true;
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${resolved.userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return jsonResponse(
        {
          error: "Member data removed; Auth deletion failed",
          dataRemoved: true,
          status: "partial",
        },
        502,
      );
    }
    return jsonResponse({ deleted: true });
  } catch {
    return jsonResponse(
      {
        error: "Account deletion could not be confirmed",
        dataRemoved,
        status: dataRemoved ? "partial" : "unknown",
      },
      502,
    );
  }
}
