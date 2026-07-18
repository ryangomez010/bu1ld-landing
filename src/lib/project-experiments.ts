import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";

export type ExperimentStatus = "planned" | "running" | "completed" | "abandoned";

export type ProjectExperiment = {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  hypothesis: string;
  method: string;
  result_summary: string;
  status: ExperimentStatus;
  evidence_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectDeliverable = {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  description: string;
  artifact_url: string | null;
  status: "draft" | "submitted" | "accepted" | "revision_requested";
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeExperiment(row: Record<string, unknown>): ProjectExperiment {
  const status = row.status as ExperimentStatus;
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    created_by: String(row.created_by),
    title: String(row.title),
    hypothesis: String(row.hypothesis),
    method: row.method != null ? String(row.method) : "",
    result_summary: row.result_summary != null ? String(row.result_summary) : "",
    status: ["planned", "running", "completed", "abandoned"].includes(status) ? status : "planned",
    evidence_url: row.evidence_url != null ? String(row.evidence_url) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeDeliverable(row: Record<string, unknown>): ProjectDeliverable {
  const status = String(row.status ?? "draft");
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    created_by: String(row.submitted_by ?? row.created_by),
    title: String(row.title),
    description: row.description != null ? String(row.description) : "",
    artifact_url: row.artifact_url != null ? String(row.artifact_url) : null,
    status: (["draft", "submitted", "accepted", "revision_requested", "changes_requested"].includes(
      status,
    )
      ? status === "changes_requested"
        ? "revision_requested"
        : status
      : "draft") as ProjectDeliverable["status"],
    review_note: row.review_note != null ? String(row.review_note) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function validateExperimentInput(input: {
  title: string;
  hypothesis: string;
  evidenceUrl?: string;
}): string | null {
  if (clampText(input.title, 160).length < 3) return "Title must be at least 3 characters.";
  if (clampText(input.hypothesis, 4000).length < 10)
    return "Hypothesis must be at least 10 characters.";
  if (input.evidenceUrl && !isSafeUrl(input.evidenceUrl)) return "Evidence URL must be http(s).";
  return null;
}

export async function fetchProjectExperiments(projectId: string): Promise<ProjectExperiment[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_experiments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => normalizeExperiment(r as Record<string, unknown>));
}

export async function createProjectExperiment(input: {
  projectId: string;
  userId: string;
  title: string;
  hypothesis: string;
  method?: string;
  status?: ExperimentStatus;
  evidenceUrl?: string;
}): Promise<{ experiment: ProjectExperiment | null; error: string | null }> {
  const err = validateExperimentInput(input);
  if (err) return { experiment: null, error: err };
  const supabase = getSupabase();
  if (!supabase) return { experiment: null, error: "This action is temporarily unavailable." };
  const { data, error } = await supabase
    .from("project_experiments")
    .insert({
      project_id: input.projectId,
      created_by: input.userId,
      title: clampText(input.title, 160),
      hypothesis: clampText(input.hypothesis, 4000),
      method: clampText(input.method ?? "", 8000),
      status: input.status ?? "planned",
      evidence_url: input.evidenceUrl?.trim() || null,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return { experiment: null, error: error?.message ?? "Failed to create." };
  return { experiment: normalizeExperiment(data as Record<string, unknown>), error: null };
}

export async function updateExperimentStatus(
  id: string,
  status: ExperimentStatus,
  resultSummary?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "This action is temporarily unavailable." };
  const { error } = await supabase
    .from("project_experiments")
    .update({
      status,
      ...(resultSummary != null ? { result_summary: clampText(resultSummary, 8000) } : {}),
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function fetchProjectDeliverables(projectId: string): Promise<ProjectDeliverable[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_deliverables")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => normalizeDeliverable(r as Record<string, unknown>));
}

export async function reviewProjectDeliverable(
  id: string,
  status: "accepted" | "revision_requested" | "submitted",
  reviewNote?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "This action is temporarily unavailable." };
  const dbStatus = status === "revision_requested" ? "changes_requested" : status;
  const { error } = await supabase.rpc("review_project_deliverable", {
    p_deliverable_id: id,
    p_status: dbStatus,
    p_note: reviewNote ? clampText(reviewNote, 4000) : null,
  });
  return { error: error?.message ?? null };
}

export async function createProjectDeliverable(input: {
  projectId: string;
  userId: string;
  title: string;
  description?: string;
  artifactUrl?: string;
}): Promise<{ deliverable: ProjectDeliverable | null; error: string | null }> {
  const title = clampText(input.title, 160);
  if (title.length < 3) return { deliverable: null, error: "Title is required." };
  if (input.artifactUrl && !isSafeUrl(input.artifactUrl))
    return { deliverable: null, error: "Artifact URL must be http(s)." };
  const supabase = getSupabase();
  if (!supabase) return { deliverable: null, error: "This action is temporarily unavailable." };
  const { data, error } = await supabase
    .from("project_deliverables")
    .insert({
      project_id: input.projectId,
      submitted_by: input.userId,
      title,
      description: clampText(input.description ?? "", 4000),
      artifact_url: input.artifactUrl?.trim() || null,
      status: "submitted",
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return { deliverable: null, error: error?.message ?? "Failed to create." };
  return { deliverable: normalizeDeliverable(data as Record<string, unknown>), error: null };
}
