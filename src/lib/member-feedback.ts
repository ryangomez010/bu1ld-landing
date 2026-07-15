import { sanitizeText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

export type FeedbackCategory = "bug" | "feature" | "content" | "general";

export type MemberFeedback = {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  body: string;
  created_at: string;
};

export async function submitFeedback(
  userId: string,
  category: FeedbackCategory,
  body: string,
): Promise<{ error: string | null }> {
  const safe = sanitizeText(body, 2000);
  if (safe.length < 10) return { error: "Please provide at least 10 characters of feedback." };

  const supabase = getSupabase();
  if (!supabase) return { error: "Feedback is temporarily unavailable." };

  const { error } = await supabase.from("member_feedback").insert({
    user_id: userId,
    category,
    body: safe,
  });
  return { error: error?.message ?? null };
}

export async function fetchMyFeedback(userId: string, limit = 20): Promise<MemberFeedback[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("member_feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as MemberFeedback[];
}

export async function fetchAdminFeedback(limit = 50): Promise<MemberFeedback[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("member_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as MemberFeedback[];
}
