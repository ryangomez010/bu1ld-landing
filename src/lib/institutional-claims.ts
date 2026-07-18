import { getSupabase } from "@/lib/supabase";
import { clampText } from "@/lib/security";
import { isSafeUrl } from "@/lib/urls";
import type { InstitutionalClaim, InstitutionalClaimType } from "@/lib/types";

function normalizeClaim(row: Record<string, unknown>): InstitutionalClaim {
  return {
    id: String(row.id),
    claim_type: row.claim_type as InstitutionalClaimType,
    statement: String(row.statement),
    context: row.context != null ? String(row.context) : null,
    evidence_url: String(row.evidence_url),
    evidence_label: String(row.evidence_label),
    status: row.status as InstitutionalClaim["status"],
    valid_until: row.valid_until != null ? String(row.valid_until) : null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    reviewed_by: row.reviewed_by != null ? String(row.reviewed_by) : null,
    reviewed_at: row.reviewed_at != null ? String(row.reviewed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function fetchVerifiedInstitutionalClaims(): Promise<InstitutionalClaim[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("institutional_claims")
    .select("*")
    .eq("status", "verified")
    .order("updated_at", { ascending: false });
  return error ? [] : (data ?? []).map((row) => normalizeClaim(row as Record<string, unknown>));
}

export async function fetchAllInstitutionalClaimsAdmin(): Promise<InstitutionalClaim[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("institutional_claims")
    .select("*")
    .order("updated_at", { ascending: false });
  return error ? [] : (data ?? []).map((row) => normalizeClaim(row as Record<string, unknown>));
}

export async function createInstitutionalClaim(
  actorId: string,
  input: {
    claimType: InstitutionalClaimType;
    statement: string;
    context?: string;
    evidenceUrl: string;
    evidenceLabel: string;
    validUntil?: string;
  },
): Promise<{ error: string | null }> {
  const statement = clampText(input.statement, 1000);
  const context = clampText(input.context ?? "", 4000);
  const evidenceLabel = clampText(input.evidenceLabel, 160);
  const evidenceUrl = input.evidenceUrl.trim();
  if (statement.length < 20) return { error: "Write the exact claim in at least 20 characters." };
  if (evidenceLabel.length < 3) return { error: "Name the primary evidence source." };
  if (!isSafeUrl(evidenceUrl))
    return { error: "Evidence must be a valid http:// or https:// URL." };
  const supabase = getSupabase();
  if (!supabase) return { error: "Institutional claims are temporarily unavailable." };
  const { error } = await supabase.from("institutional_claims").insert({
    claim_type: input.claimType,
    statement,
    context: context || null,
    evidence_url: evidenceUrl,
    evidence_label: evidenceLabel,
    valid_until: input.validUntil || null,
    created_by: actorId,
    status: "draft",
  });
  return { error: error?.message ?? null };
}

export function canVerifyInstitutionalClaim(claim: {
  evidence_url?: string | null;
  evidence_label?: string | null;
}): string | null {
  const url = claim.evidence_url?.trim() ?? "";
  const label = claim.evidence_label?.trim() ?? "";
  if (label.length < 3) return "Verified claims require a named primary source.";
  if (!isSafeUrl(url)) return "Verified claims require a valid http(s) evidence URL.";
  return null;
}

export async function reviewInstitutionalClaim(
  claimId: string,
  status: "verified" | "retired",
  claim?: { evidence_url?: string | null; evidence_label?: string | null },
): Promise<{ error: string | null }> {
  if (status === "verified") {
    const blocked = canVerifyInstitutionalClaim(claim ?? {});
    if (blocked) return { error: blocked };
  }
  const supabase = getSupabase();
  if (!supabase) return { error: "Institutional claims are temporarily unavailable." };
  if (status === "verified" && !claim) {
    const { data } = await supabase
      .from("institutional_claims")
      .select("evidence_url, evidence_label")
      .eq("id", claimId)
      .maybeSingle();
    const blocked = canVerifyInstitutionalClaim(data ?? {});
    if (blocked) return { error: blocked };
  }
  const { error } = await supabase.rpc("review_institutional_claim", {
    p_claim_id: claimId,
    p_status: status,
  });
  return { error: error?.message ?? null };
}

export async function deleteInstitutionalClaim(claimId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Institutional claims are temporarily unavailable." };
  const { error } = await supabase
    .from("institutional_claims")
    .delete()
    .eq("id", claimId)
    .eq("status", "draft");
  return { error: error?.message ?? null };
}
