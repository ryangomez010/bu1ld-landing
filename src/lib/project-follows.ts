import { readUserJson, writeUserJson } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

export type ProjectFollow = {
  id: string;
  project_id: string;
  notify_updates: boolean;
  created_at: string;
};

const STORAGE = "build:project-follows";

function readLocal(userId: string): ProjectFollow[] {
  return readUserJson<ProjectFollow[]>(STORAGE, userId, []);
}

function writeLocal(userId: string, items: ProjectFollow[]) {
  writeUserJson(STORAGE, userId, items);
}

export async function fetchMyProjectFollows(userId: string): Promise<ProjectFollow[]> {
  const supabase = getSupabase();
  if (!supabase) return readLocal(userId);

  const { data, error } = await supabase
    .from("project_follows")
    .select("id, project_id, notify_updates, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return readLocal(userId);
  return data as ProjectFollow[];
}

export async function isFollowingProject(userId: string, projectId: string): Promise<boolean> {
  const follows = await fetchMyProjectFollows(userId);
  return follows.some((f) => f.project_id === projectId);
}

export async function toggleProjectFollow(
  userId: string,
  projectId: string,
): Promise<{ following: boolean; error: string | null }> {
  const local = readLocal(userId);
  const existing = local.find((f) => f.project_id === projectId);

  const supabase = getSupabase();
  if (!supabase) {
    if (existing) {
      writeLocal(
        userId,
        local.filter((f) => f.project_id !== projectId),
      );
      return { following: false, error: null };
    }
    local.push({
      id: `local-pf-${Date.now()}`,
      project_id: projectId,
      notify_updates: true,
      created_at: new Date().toISOString(),
    });
    writeLocal(userId, local);
    return { following: true, error: null };
  }

  if (existing) {
    const { error } = await supabase
      .from("project_follows")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId);
    writeLocal(
      userId,
      local.filter((f) => f.project_id !== projectId),
    );
    return { following: false, error: error?.message ?? null };
  }

  const { error } = await supabase.from("project_follows").insert({
    user_id: userId,
    project_id: projectId,
    notify_updates: true,
  });
  if (!error) {
    local.push({
      id: `local-pf-${Date.now()}`,
      project_id: projectId,
      notify_updates: true,
      created_at: new Date().toISOString(),
    });
    writeLocal(userId, local);
  }
  return { following: true, error: error?.message ?? null };
}

/** Users who want notifications for a project (followers + accepted members). */
export async function fetchProjectUpdateSubscribers(projectId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const userIds = new Set<string>();

  const { data: follows } = await supabase
    .from("project_follows")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("notify_updates", true);
  follows?.forEach((f) => userIds.add(String(f.user_id)));

  const { data: members } = await supabase
    .from("project_applications")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("status", "accepted");
  members?.forEach((m) => userIds.add(String(m.user_id)));

  return [...userIds];
}
