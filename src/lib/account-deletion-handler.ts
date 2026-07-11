/** Finalize account deletion — removes auth.users after RPC anonymization. */

import { isTrustedSupabaseUrl, isUuid, jsonResponse } from "@/lib/security";

export type AccountDeletionEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

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

  const resolved = await resolveUserId(request, env);
  if (resolved instanceof Response) return resolved;

  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL!;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${resolved.userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[account-deletion]", res.status, detail);
    return jsonResponse({ error: "Failed to delete auth user" }, res.status === 404 ? 404 : 502);
  }

  return jsonResponse({ deleted: true });
}
