import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

export type ProjectApplicationQuestion = {
  id: string;
  project_id: string;
  prompt: string;
  required: boolean;
  sort_order: number;
  created_at: string;
};

function normalize(row: Record<string, unknown>): ProjectApplicationQuestion {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    prompt: String(row.prompt),
    required: Boolean(row.required ?? true),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
  };
}

export async function fetchProjectQuestions(
  projectId: string,
): Promise<ProjectApplicationQuestion[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_application_questions")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => normalize(r as Record<string, unknown>));
}

export async function addProjectQuestion(input: {
  projectId: string;
  prompt: string;
  required?: boolean;
  sortOrder?: number;
}): Promise<{ question: ProjectApplicationQuestion | null; error: string | null }> {
  const prompt = clampText(input.prompt, 500);
  if (prompt.length < 5) return { question: null, error: "Prompt must be at least 5 characters." };
  const supabase = getSupabase();
  if (!supabase) return { question: null, error: "This action is temporarily unavailable." };
  const { data, error } = await supabase
    .from("project_application_questions")
    .insert({
      project_id: input.projectId,
      prompt,
      required: input.required ?? true,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return { question: null, error: error?.message ?? "Failed to add question." };
  return { question: normalize(data as Record<string, unknown>), error: null };
}

export async function deleteProjectQuestion(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "This action is temporarily unavailable." };
  const { error } = await supabase.from("project_application_questions").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type ApplicationAnswerRow = {
  application_id: string;
  question_id: string;
  answer: string;
  prompt?: string;
};

export async function fetchAnswersForApplications(
  applicationIds: string[],
): Promise<Map<string, ApplicationAnswerRow[]>> {
  const map = new Map<string, ApplicationAnswerRow[]>();
  if (!applicationIds.length) return map;
  const supabase = getSupabase();
  if (!supabase) return map;
  const { data, error } = await supabase
    .from("project_application_answers")
    .select("application_id, question_id, answer, project_application_questions(prompt)")
    .in("application_id", applicationIds);
  if (error || !data) return map;
  for (const row of data) {
    const item = row as Record<string, unknown>;
    const q = item.project_application_questions as Record<string, unknown> | null;
    const applicationId = String(item.application_id);
    const entry: ApplicationAnswerRow = {
      application_id: applicationId,
      question_id: String(item.question_id),
      answer: String(item.answer),
      prompt: q?.prompt != null ? String(q.prompt) : undefined,
    };
    const list = map.get(applicationId) ?? [];
    list.push(entry);
    map.set(applicationId, list);
  }
  return map;
}
