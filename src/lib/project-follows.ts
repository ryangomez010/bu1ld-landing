import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";
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
  if (!supabase) return withLocalFallback([], () => readLocal(userId));

  const { data, error } = await supabase
    .from("project_follows")
    .select("id, project_id, notify_updates, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return withLocalFallback([], () => readLocal(userId));
  return data as ProjectFollow[];
}

export async function isFollowingProject(userId: string, projectId: string): Promise<boolean> {
  const follows = await fetchMyProjectFollows(userId);
  return follows.some((f) => f.project_id === projectId);
}

function syncLocalFollows(userId: string, follows: ProjectFollow[]) {
  persistLocally(() => writeLocal(userId, follows));
}

export async function toggleProjectFollow(
  userId: string,
  projectId: string,
): Promise<{ following: boolean; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    const local = withLocalFallback([], () => readLocal(userId));
    const existing = local.find((f) => f.project_id === projectId);
    if (existing) {
      syncLocalFollows(
        userId,
        local.filter((f) => f.project_id !== projectId),
      );
      return { following: false, error: null };
    }
    const next: ProjectFollow = {
      id: `local-pf-${Date.now()}`,
      project_id: projectId,
      notify_updates: true,
      created_at: new Date().toISOString(),
    };
    syncLocalFollows(userId, [...local, next]);
    return { following: true, error: null };
  }

  const { data: existingRow, error: readError } = await supabase
    .from("project_follows")
    .select("id, project_id, notify_updates, created_at")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (readError) {
    return { following: Boolean(existingRow), error: readError.message };
  }

  if (existingRow) {
    const { error } = await supabase
      .from("project_follows")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId);
    if (!error) {
      syncLocalFollows(
        userId,
        withLocalFallback([], () => readLocal(userId)).filter((f) => f.project_id !== projectId),
      );
    }
    return { following: false, error: error?.message ?? null };
  }

  const { data: inserted, error } = await supabase
    .from("project_follows")
    .insert({
      user_id: userId,
      project_id: projectId,
      notify_updates: true,
    })
    .select("id, project_id, notify_updates, created_at")
    .single();

  if (!error && inserted) {
    return { following: true, error: null };
  }

  return { following: false, error: error?.message ?? null };
}

export async function setProjectFollowNotify(
  userId: string,
  projectId: string,
  notify: boolean,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    persistLocally(() => {
      const local = readLocal(userId);
      const row = local.find((f) => f.project_id === projectId);
      if (row) row.notify_updates = notify;
      writeLocal(userId, local);
    });
    return { error: null };
  }

  const { error } = await supabase
    .from("project_follows")
    .update({ notify_updates: notify })
    .eq("user_id", userId)
    .eq("project_id", projectId);
  return { error: error?.message ?? null };
}

/** Users who want notifications for a project (followers + accepted members). */
export async function fetchProjectUpdateSubscribers(projectId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_project_update_subscribers", {
    p_project_id: projectId,
  });

  if (!error && Array.isArray(data)) {
    return data.map((id) => String(id));
  }

  if (error) {
    console.error("[project-follows:subscribers]", error.message);
  }
  return [];
}
