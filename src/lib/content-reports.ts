import { sanitizeText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

export type ContentReportType =
  | "paper"
  | "event"
  | "project"
  | "job"
  | "guide"
  | "newsletter"
  | "member";

export type ContentReport = {
  id: string;
  reporter_id: string;
  content_type: ContentReportType;
  content_slug: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function submitContentReport(
  reporterId: string,
  contentType: ContentReportType,
  contentSlug: string,
  reason: string,
): Promise<{ error: string | null }> {
  const safeReason = sanitizeText(reason, 500);
  if (safeReason.length < 5) return { error: "Please describe the issue (min 5 characters)." };

  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: reporterId,
    content_type: contentType,
    content_slug: contentSlug,
    reason: safeReason,
  });
  return { error: error?.message ?? null };
}

export async function fetchPendingReports(limit = 50): Promise<ContentReport[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as ContentReport[];
}

export async function fetchAllReports(limit = 100): Promise<ContentReport[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as ContentReport[];
}

export async function updateReportStatus(
  reportId: string,
  adminId: string,
  status: "reviewed" | "dismissed",
  adminNotes?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase
    .from("content_reports")
    .update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes ? sanitizeText(adminNotes, 1000) : null,
    })
    .eq("id", reportId);
  return { error: error?.message ?? null };
}
