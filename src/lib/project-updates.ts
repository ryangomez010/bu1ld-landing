import { readUserJson, writeUserJson } from "@/lib/storage";
import { clampText } from "@/lib/security";
import { createNotification } from "@/lib/notifications";
import { shouldNotifyInApp } from "@/lib/notification-preferences";
import { fetchProjectUpdateSubscribers } from "@/lib/project-follows";
import { getSupabase } from "@/lib/supabase";
import type { ProjectUpdate } from "@/lib/types";

export type { ProjectUpdate };

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
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }
  }
  return readLocal(projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createProjectUpdate(
  projectId: string,
  authorId: string,
  authorName: string,
  body: string,
  opts?: { projectSlug?: string; projectTitle?: string; mentionUserIds?: string[] },
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
    if (!error) {
      void notifyProjectUpdateSubscribers(projectId, authorId, authorName, safeBody, opts);
      return { error: null };
    }
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
  void notifyProjectUpdateSubscribers(projectId, authorId, authorName, safeBody, opts);
  return { error: null };
}

/** Parse @mentions like @[Name](userId) or @username patterns — returns unique user IDs. */
export function parseMentionUserIds(body: string, knownMembers?: Map<string, string>): string[] {
  const ids = new Set<string>();
  const bracket = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/gi;
  let m: RegExpExecArray | null;
  while ((m = bracket.exec(body))) {
    ids.add(m[2]!);
  }
  if (knownMembers) {
    const atWord = /@([a-zA-Z0-9_-]{3,40})/g;
    while ((m = atWord.exec(body))) {
      const id = knownMembers.get(m[1]!.toLowerCase());
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

async function notifyProjectUpdateSubscribers(
  projectId: string,
  authorId: string,
  authorName: string,
  body: string,
  opts?: { projectSlug?: string; projectTitle?: string; mentionUserIds?: string[] },
): Promise<void> {
  const href = opts?.projectSlug ? `/projects/${opts.projectSlug}` : "/projects";
  const title = opts?.projectTitle ?? "Project update";
  const mentionIds = opts?.mentionUserIds ?? [];

  const subscribers = await fetchProjectUpdateSubscribers(projectId);
  const targets = new Set(subscribers.filter((id) => id !== authorId));

  for (const userId of mentionIds) {
    if (userId !== authorId) targets.add(userId);
  }

  await Promise.all(
    [...targets].map(async (userId) => {
      const isMention = mentionIds.includes(userId);
      const prefKey = isMention ? "mention" : "project_update";
      const allowed = await shouldNotifyInApp(userId, prefKey);
      if (!allowed) return;

      await createNotification(userId, {
        title: isMention ? `${authorName} mentioned you` : `Update: ${title}`,
        body: body.slice(0, 200),
        href,
      });
    }),
  );
}

function mapRow(row: Record<string, unknown>): ProjectUpdate {
  const profile = row.profiles as { full_name?: string } | null;
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    author_id: String(row.author_id),
    author_name: profile?.full_name ?? undefined,
    body: String(row.body),
    created_at: String(row.created_at),
  };
}

/** Subscribe to live project updates (Supabase realtime). Returns unsubscribe. */
export function subscribeProjectUpdates(
  projectId: string,
  onUpdate: (updates: ProjectUpdate[]) => void,
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`project-updates-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "project_updates",
        filter: `project_id=eq.${projectId}`,
      },
      () => {
        void fetchProjectUpdates(projectId).then(onUpdate);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
