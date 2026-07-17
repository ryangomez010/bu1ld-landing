import { getSupabase } from "@/lib/supabase";
import type { Invitation } from "@/lib/types";
import { clampText, isValidEmail } from "@/lib/security";

export async function fetchMyInvitations(
  userId: string,
  email?: string | null,
): Promise<Invitation[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const filters = [`invitee_id.eq.${userId}`];
  if (email) filters.push(`email.eq.${email}`);
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as Invitation[];
}

export async function createInvitation(input: {
  invitedBy: string;
  invitationType: Invitation["invitation_type"];
  targetId: string;
  email?: string;
  inviteeId?: string;
  roleOffered?: string;
  message?: string;
}): Promise<{ invitation: Invitation | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase)
    return { invitation: null, error: "Invitation service is temporarily unavailable." };
  if (!input.email && !input.inviteeId) {
    return { invitation: null, error: "Provide an email or member id." };
  }
  if (input.email && !isValidEmail(input.email)) {
    return { invitation: null, error: "Enter a valid email." };
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      invitation_type: input.invitationType,
      target_id: input.targetId,
      email: input.email ?? null,
      invitee_id: input.inviteeId ?? null,
      invited_by: input.invitedBy,
      role_offered: input.roleOffered ?? "contributor",
      message: input.message ? clampText(input.message, 2000) : null,
    })
    .select("*")
    .single();

  if (error) return { invitation: null, error: error.message };
  return { invitation: data as Invitation, error: null };
}

export async function respondToInvitation(
  invitationId: string,
  status: "accepted" | "declined",
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Invitation service is temporarily unavailable." };
  if (status === "accepted") {
    const { error } = await supabase.rpc("accept_invitation", { p_invitation_id: invitationId });
    return { error: error?.message ?? null };
  }
  const { error } = await supabase
    .from("invitations")
    .update({ status: "declined" })
    .eq("id", invitationId);
  return { error: error?.message ?? null };
}
