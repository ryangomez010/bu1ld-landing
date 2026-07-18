import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";

export type ProjectDataset = {
  id: string;
  project_id: string;
  created_by: string;
  name: string;
  version_label: string;
  description: string;
  source_url: string | null;
  license: string | null;
  created_at: string;
  updated_at: string;
};

function normalize(row: Record<string, unknown>): ProjectDataset {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    created_by: String(row.created_by),
    name: String(row.name),
    version_label: String(row.version_label ?? "v1"),
    description: row.description != null ? String(row.description) : "",
    source_url: row.source_url != null ? String(row.source_url) : null,
    license: row.license != null ? String(row.license) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function validateDatasetInput(input: { name: string; sourceUrl?: string }): string | null {
  if (clampText(input.name, 160).length < 2) return "Dataset name is required.";
  if (input.sourceUrl && !isSafeUrl(input.sourceUrl)) return "Source URL must be http(s).";
  return null;
}

export async function fetchProjectDatasets(projectId: string): Promise<ProjectDataset[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_datasets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => normalize(r as Record<string, unknown>));
}

export async function createProjectDataset(input: {
  projectId: string;
  userId: string;
  name: string;
  versionLabel?: string;
  description?: string;
  sourceUrl?: string;
  license?: string;
}): Promise<{ dataset: ProjectDataset | null; error: string | null }> {
  const err = validateDatasetInput(input);
  if (err) return { dataset: null, error: err };
  const supabase = getSupabase();
  if (!supabase)
    return { dataset: null, error: "Dataset registration is temporarily unavailable." };
  const { data, error } = await supabase
    .from("project_datasets")
    .insert({
      project_id: input.projectId,
      created_by: input.userId,
      name: clampText(input.name, 160),
      version_label: clampText(input.versionLabel ?? "v1", 40),
      description: clampText(input.description ?? "", 4000),
      source_url: input.sourceUrl?.trim() || null,
      license: input.license ? clampText(input.license, 120) : null,
    })
    .select("*")
    .maybeSingle();
  if (error || !data)
    return { dataset: null, error: error?.message ?? "Failed to create dataset." };
  return { dataset: normalize(data as Record<string, unknown>), error: null };
}
