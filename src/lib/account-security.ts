import { LIMITS, sanitizeText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

export type SecurityEvent = {
  id: string;
  user_id: string | null;
  event_type: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type ConnectedIdentity = {
  provider: string;
  email?: string;
  created_at?: string;
};

export function getConnectedIdentities(
  identities:
    | { provider?: string; identity_data?: Record<string, unknown>; created_at?: string }[]
    | undefined,
): ConnectedIdentity[] {
  if (!identities?.length) return [];
  return identities.map((id) => ({
    provider: id.provider ?? "unknown",
    email: typeof id.identity_data?.email === "string" ? id.identity_data.email : undefined,
    created_at: id.created_at,
  }));
}

export async function logSecurityEvent(
  userId: string,
  eventType: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("security_events").insert({
    user_id: userId,
    event_type: sanitizeText(eventType, 60),
    detail: detail ?? null,
  });
}

export async function fetchMySecurityEvents(userId: string, limit = 20): Promise<SecurityEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("security_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SecurityEvent[];
}

export async function fetchAdminSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("security_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SecurityEvent[];
}

export async function requestAccountDeletion(userId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: error.message };

  await logSecurityEvent(userId, "account_deletion_completed");
  return { error: null };
}
