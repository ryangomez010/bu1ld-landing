import { getSupabase } from "@/lib/supabase";

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export async function logAdminAction(
  actorId: string,
  action: string,
  opts?: {
    targetType?: string;
    targetId?: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: opts?.targetType ?? null,
    target_id: opts?.targetId ?? null,
    detail: opts?.detail ?? null,
  });
}

export async function fetchAdminAuditLog(limit = 50): Promise<AuditEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AuditEntry[];
}
