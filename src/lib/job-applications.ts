import { clampText, sanitizeText } from "@/lib/security";
import { readUserJson, writeUserJson } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

export type JobApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

export type JobApplication = {
  id: string;
  user_id: string;
  job_slug: string;
  job_title: string;
  status: JobApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STORAGE = "build:job-applications";

function readLocal(userId: string): JobApplication[] {
  return readUserJson<JobApplication[]>(STORAGE, userId, []);
}

function writeLocal(userId: string, items: JobApplication[]) {
  writeUserJson(STORAGE, userId, items);
}

export async function fetchMyJobApplications(userId: string): Promise<JobApplication[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return readLocal(userId).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return readLocal(userId);
  return data as JobApplication[];
}

export async function upsertJobApplication(
  userId: string,
  jobSlug: string,
  jobTitle: string,
  status: JobApplicationStatus,
  notes?: string,
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const safeTitle = sanitizeText(jobTitle, 300);
  const safeNotes = notes ? clampText(notes, 1000) : null;

  const local = readLocal(userId);
  const existing = local.find((a) => a.job_slug === jobSlug);
  if (existing) {
    existing.status = status;
    existing.notes = safeNotes;
    existing.updated_at = now;
  } else {
    local.push({
      id: `local-ja-${Date.now()}`,
      user_id: userId,
      job_slug: jobSlug,
      job_title: safeTitle,
      status,
      notes: safeNotes,
      created_at: now,
      updated_at: now,
    });
  }
  writeLocal(userId, local);

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase.from("job_applications").upsert(
    {
      user_id: userId,
      job_slug: jobSlug,
      job_title: safeTitle,
      status,
      notes: safeNotes,
      updated_at: now,
    },
    { onConflict: "user_id,job_slug" },
  );
  return { error: error?.message ?? null };
}

export async function getJobApplicationStatus(
  userId: string,
  jobSlug: string,
): Promise<JobApplication | null> {
  const apps = await fetchMyJobApplications(userId);
  return apps.find((a) => a.job_slug === jobSlug) ?? null;
}
