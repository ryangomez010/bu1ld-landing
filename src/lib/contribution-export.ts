import { getSupabase } from "@/lib/supabase";

export type ContributionExportRow = {
  id: string;
  project_id: string;
  title: string;
  contribution_type: string;
  verification_status: string;
  evidence_url: string | null;
  summary: string;
  verified_at: string | null;
  created_at: string;
};

/** Fetch the signed-in member's contributions for portfolio export. */
export async function fetchMyContributionsForExport(
  userId: string,
): Promise<{ rows: ContributionExportRow[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: "Contribution export is temporarily unavailable." };
  const { data, error } = await supabase
    .from("project_contributions")
    .select(
      "id, project_id, title, contribution_type, verification_status, evidence_url, summary, verified_at, created_at",
    )
    .eq("contributor_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as ContributionExportRow[], error: null };
}

export function serializeContributionExport(rows: ContributionExportRow[], exportedAt: string) {
  return JSON.stringify({ exported_at: exportedAt, rows }, null, 2);
}

export function downloadContributionExport(
  rows: ContributionExportRow[],
  filename = "bu1ld-contributions.json",
): void {
  const blob = new Blob([serializeContributionExport(rows, new Date().toISOString())], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
