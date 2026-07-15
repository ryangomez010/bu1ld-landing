import { clampText } from "@/lib/security";
import { slugify } from "@/data/seed/content";
import { getSupabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import type { ApplicationStatus, Program, ProgramApplication, ProgramType } from "@/lib/types";

const statementMinLength = 40;

function toSupabaseTimestamp(value?: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeProgram(row: Record<string, unknown>): Program {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    program_type: row.program_type as ProgramType,
    summary: String(row.summary),
    application_instructions:
      typeof row.application_instructions === "string" ? row.application_instructions : null,
    starts_at: typeof row.starts_at === "string" ? row.starts_at : null,
    ends_at: typeof row.ends_at === "string" ? row.ends_at : null,
    capacity: typeof row.capacity === "number" ? row.capacity : null,
    applications_open_at:
      typeof row.applications_open_at === "string" ? row.applications_open_at : null,
    applications_close_at:
      typeof row.applications_close_at === "string" ? row.applications_close_at : null,
    outcomes: typeof row.outcomes === "string" ? row.outcomes : null,
    published: Boolean(row.published),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function fetchPrograms(): Promise<Program[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("published", true)
    .order("starts_at", { ascending: true, nullsFirst: false });
  return error ? [] : (data ?? []).map((row) => normalizeProgram(row as Record<string, unknown>));
}

export async function fetchAllProgramsAdmin(): Promise<Program[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });
  return error ? [] : (data ?? []).map((row) => normalizeProgram(row as Record<string, unknown>));
}

export async function fetchProgramBySlug(slug: string): Promise<Program | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return error || !data ? null : normalizeProgram(data as Record<string, unknown>);
}

export async function fetchMyProgramApplication(
  userId: string,
  programId: string,
): Promise<ProgramApplication | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("program_applications")
    .select("*")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .maybeSingle();
  return error || !data ? null : (data as ProgramApplication);
}

export async function fetchProgramApplicationsAdmin(): Promise<ProgramApplication[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("program_applications")
    .select("*, profiles(full_name, background), programs(title)")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    const profile = item.profiles as Record<string, unknown> | null;
    const program = item.programs as Record<string, unknown> | null;
    return {
      ...item,
      applicant_name: profile?.full_name != null ? String(profile.full_name) : null,
      applicant_background: profile?.background as ProgramApplication["applicant_background"],
      program_title: program?.title != null ? String(program.title) : null,
    } as ProgramApplication;
  });
}

export async function reviewProgramApplication(
  applicationId: string,
  status: Exclude<ApplicationStatus, "pending">,
  note?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Program review requires a live database connection." };
  const { data: application } = await supabase
    .from("program_applications")
    .select("user_id, program_id, programs(slug, title)")
    .eq("id", applicationId)
    .maybeSingle();
  const { error } = await supabase.rpc("review_program_application", {
    p_application_id: applicationId,
    p_status: status,
    p_note: note?.trim() || null,
  });
  if (!error && application) {
    const record = application as Record<string, unknown>;
    const program = record.programs as Record<string, unknown> | null;
    const title = program?.title != null ? String(program.title) : "a programme";
    const slug = program?.slug != null ? String(program.slug) : null;
    const detail = note?.trim();
    await createNotification(String(record.user_id), {
      title: `Programme application ${status}`,
      body: detail
        ? `Your application to ${title} is ${status}. Note from the programme team: ${detail}`
        : `Your application to ${title} is ${status}.`,
      href: slug ? `/programs/${slug}` : "/programs",
    });
  }
  return { error: error?.message ?? null };
}

export async function applyToProgram(
  userId: string,
  programId: string,
  statement: string,
): Promise<{ error: string | null }> {
  const safeStatement = clampText(statement, 4000);
  if (safeStatement.length < statementMinLength) {
    return {
      error: `Write at least ${statementMinLength} characters about the work you want to do.`,
    };
  }
  const supabase = getSupabase();
  if (!supabase) return { error: "Program applications require a live database connection." };
  const { error } = await supabase.from("program_applications").insert({
    program_id: programId,
    user_id: userId,
    statement: safeStatement,
  });
  return { error: error?.message ?? null };
}

export async function withdrawProgramApplication(
  userId: string,
  applicationId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Program applications require a live database connection." };
  const { error } = await supabase
    .from("program_applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", userId)
    .eq("status", "pending");
  return { error: error?.message ?? null };
}

export function programApplicationState(
  program: Program,
  now = new Date(),
): "upcoming" | "open" | "closed" {
  const opens = program.applications_open_at ? new Date(program.applications_open_at) : null;
  const closes = program.applications_close_at ? new Date(program.applications_close_at) : null;
  if (opens && opens > now) return "upcoming";
  if (closes && closes <= now) return "closed";
  return "open";
}

export async function createProgram(input: {
  title: string;
  programType: ProgramType;
  summary: string;
  applicationInstructions?: string;
  startsAt?: string;
  endsAt?: string;
  applicationsOpenAt?: string;
  applicationsCloseAt?: string;
  outcomes?: string;
  capacity?: number | null;
}): Promise<{ error: string | null }> {
  const title = clampText(input.title, 160);
  const summary = clampText(input.summary, 2000);
  if (title.length < 3 || summary.length < 20)
    return { error: "Add a title and a specific program summary." };
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required to publish programs." };
  const { error } = await supabase.from("programs").insert({
    slug: slugify(title),
    title,
    program_type: input.programType,
    summary,
    application_instructions: clampText(input.applicationInstructions ?? "", 4000) || null,
    starts_at: toSupabaseTimestamp(input.startsAt),
    ends_at: toSupabaseTimestamp(input.endsAt),
    applications_open_at: toSupabaseTimestamp(input.applicationsOpenAt),
    applications_close_at: toSupabaseTimestamp(input.applicationsCloseAt),
    outcomes: clampText(input.outcomes ?? "", 4000) || null,
    capacity: input.capacity ?? null,
    published: false,
  });
  return { error: error?.message ?? null };
}

export async function updateProgramAdmin(
  programId: string,
  input: Partial<{
    title: string;
    summary: string;
    applicationInstructions: string;
    startsAt: string;
    endsAt: string;
    applicationsOpenAt: string;
    applicationsCloseAt: string;
    outcomes: string;
    capacity: number | null;
  }>,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required to update programs." };
  const patch: Partial<Program> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = clampText(input.title, 160);
  if (input.summary !== undefined) patch.summary = clampText(input.summary, 2000);
  if (input.applicationInstructions !== undefined)
    patch.application_instructions = clampText(input.applicationInstructions, 4000) || null;
  if (input.startsAt !== undefined) patch.starts_at = toSupabaseTimestamp(input.startsAt);
  if (input.endsAt !== undefined) patch.ends_at = toSupabaseTimestamp(input.endsAt);
  if (input.applicationsOpenAt !== undefined)
    patch.applications_open_at = toSupabaseTimestamp(input.applicationsOpenAt);
  if (input.applicationsCloseAt !== undefined)
    patch.applications_close_at = toSupabaseTimestamp(input.applicationsCloseAt);
  if (input.outcomes !== undefined) patch.outcomes = clampText(input.outcomes, 4000) || null;
  if (input.capacity !== undefined) patch.capacity = input.capacity;
  const { error } = await supabase.from("programs").update(patch).eq("id", programId);
  return { error: error?.message ?? null };
}

export async function deleteProgramAdmin(programId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required to delete programs." };
  const { count } = await supabase
    .from("program_applications")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  if ((count ?? 0) > 0)
    return {
      error:
        "Archive or unpublish programmes with applications; do not delete their decision history.",
    };
  const { error } = await supabase.from("programs").delete().eq("id", programId);
  return { error: error?.message ?? null };
}

export async function setProgramPublished(
  programId: string,
  published: boolean,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required to update programs." };
  const { error } = await supabase
    .from("programs")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", programId);
  return { error: error?.message ?? null };
}
