import { readUserJson, writeUserJson } from "@/lib/storage";
import { clampText, LIMITS } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

export type ProjectUpdate = {
  id: string;
  project_id: string;
  author_id: string;
  author_name?: string;
  body: string;
  created_at: string;
};

const STORAGE = "build:project-updates";

function readLocal(projectId: string): ProjectUpdate[] {
  const all = readUserJson<Record<string, ProjectUpdate[]>>(STORAGE, "all", {});
  return all[projectId] ?? [];
}

function writeLocal(projectId: string, items: ProjectUpdate[]) {
  const all = readUserJson<Record<string, ProjectUpdate[]>>(STORAGE, "all", {});
  all[projectId] = items;
  writeUserJson(STORAGE, "all", all);
}

export async function fetchProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("project_updates")
      .select("*, profiles(full_name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data?.length) {
      return data.map((row) => {
        const r = row as Record<string, unknown>;
        const profile = r.profiles as { full_name?: string } | null;
        return {
          id: String(r.id),
          project_id: String(r.project_id),
          author_id: String(r.author_id),
          author_name: profile?.full_name ?? undefined,
          body: String(r.body),
          created_at: String(r.created_at),
        };
      });
    }
  }
  return readLocal(projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createProjectUpdate(
  projectId: string,
  authorId: string,
  authorName: string,
  body: string,
): Promise<{ error: string | null }> {
  const safeBody = clampText(body, 2000);
  if (!safeBody) return { error: "Update cannot be empty." };

  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase.from("project_updates").insert({
      project_id: projectId,
      author_id: authorId,
      body: safeBody,
    });
    if (!error) return { error: null };
    if (error.code !== "42P01") return { error: error.message };
  }

  const update: ProjectUpdate = {
    id: `local-pu-${Date.now()}`,
    project_id: projectId,
    author_id: authorId,
    author_name: authorName,
    body: safeBody,
    created_at: now,
  };
  writeLocal(projectId, [update, ...readLocal(projectId)]);
  return { error: null };
}
