import { slugify } from "@/data/seed/content";
import { SEED_JOBS, SEED_PROJECTS } from "@/data/seed/projects";
import { notifyApplicationUpdate, notifyLeadApproved } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { clampText, LIMITS } from "@/lib/security";
import {
  parseCreateProjectInput,
  parseLeadRequestInput,
  parseUpdateProjectInput,
} from "@/lib/validation";
import { isLocalPersistenceEnabled } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import { withSeedFallback, resolveSeedItem, isDemoMode } from "@/lib/supabase-fallback";
import type {
  ApplicationStatus,
  Job,
  LeadVerificationRequest,
  Project,
  ProjectApplication,
  ProjectStatus,
  ProjectType,
} from "@/lib/types";

// ─── localStorage fallback (works without Supabase) ─────────────────────────

const appsKey = (userId: string) => `build:applications:${userId}`;
const allAppsKey = "build:applications:all";
const leadReqKey = (userId: string) => `build:lead-request:${userId}`;
const customProjectsKey = "build:projects:custom";
const PUBLIC_PROJECT_COLUMNS =
  "id, slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, publication_status, lab_id, weekly_commitment_hours, created_at, updated_at";

function readLocalApps(): ProjectApplication[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(allAppsKey) ?? "[]") as ProjectApplication[];
  } catch {
    return [];
  }
}

function writeLocalApps(apps: ProjectApplication[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(allAppsKey, JSON.stringify(apps));
}

function readCustomProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(customProjectsKey) ?? "[]") as Project[];
  } catch {
    return [];
  }
}

function writeCustomProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(customProjectsKey, JSON.stringify(projects));
}

function normalizeProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description),
    type: row.type as ProjectType,
    status: row.status as ProjectStatus,
    skills_needed: (row.skills_needed as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    lead_id: row.lead_id != null ? String(row.lead_id) : null,
    lead_name: row.lead_name != null ? String(row.lead_name) : null,
    capacity: Number(row.capacity ?? 5),
    team_count: Number(row.team_count ?? 0),
    published: Boolean(row.published ?? true),
    publication_status:
      row.publication_status != null
        ? (row.publication_status as Project["publication_status"])
        : undefined,
    publication_note: row.publication_note != null ? String(row.publication_note) : null,
    published_by: row.published_by != null ? String(row.published_by) : null,
    published_at: row.published_at != null ? String(row.published_at) : null,
    discord_url: row.discord_url != null ? String(row.discord_url) : null,
    workspace_links: Array.isArray(row.workspace_links)
      ? (row.workspace_links as { label: string; url: string; kind?: string }[])
      : [],
    lab_id: row.lab_id != null ? String(row.lab_id) : null,
    weekly_commitment_hours:
      row.weekly_commitment_hours != null ? Number(row.weekly_commitment_hours) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeApplication(row: Record<string, unknown>): ProjectApplication {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    user_id: String(row.user_id),
    pitch: String(row.pitch),
    status: row.status as ApplicationStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    project_title: row.project_title != null ? String(row.project_title) : undefined,
    project_slug: row.project_slug != null ? String(row.project_slug) : undefined,
    applicant_name: row.applicant_name != null ? String(row.applicant_name) : undefined,
    applicant_bio: row.applicant_bio != null ? String(row.applicant_bio) : undefined,
    applicant_background:
      row.applicant_background != null
        ? (row.applicant_background as ProjectApplication["applicant_background"])
        : undefined,
    applicant_linkedin: row.applicant_linkedin != null ? String(row.applicant_linkedin) : undefined,
    applicant_github: row.applicant_github != null ? String(row.applicant_github) : undefined,
    applicant_interests: (row.applicant_interests as string[]) ?? undefined,
  };
}

function normalizeJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    company: String(row.company),
    location: row.location != null ? String(row.location) : null,
    source: row.source as Job["source"],
    employment_type: row.employment_type != null ? String(row.employment_type) : null,
    description: String(row.description),
    url: row.url != null ? String(row.url) : null,
    tags: (row.tags as string[]) ?? [],
    published: Boolean(row.published ?? true),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function isProjectLead(
  role: string | undefined,
  institutionalRoles: string[] | undefined = [],
): boolean {
  return (
    role === "project_lead" ||
    role === "admin" ||
    institutionalRoles.includes("project_lead") ||
    institutionalRoles.includes("lab_lead")
  );
}

// ─── Projects ───────────────────────────────────────────────────────────────

function localProjects(status?: ProjectStatus): Project[] {
  if (!isLocalPersistenceEnabled()) return [];
  const all = [...readCustomProjects(), ...SEED_PROJECTS];
  return status ? all.filter((p) => p.status === status) : all;
}

export async function fetchProjects(status?: ProjectStatus): Promise<Project[]> {
  const supabase = getSupabase();
  if (supabase) {
    let q = supabase
      .from("projects")
      .select(PUBLIC_PROJECT_COLUMNS)
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (!error) {
      return withSeedFallback(
        (data ?? []).map((r) => normalizeProject(r as Record<string, unknown>)),
        localProjects(status),
      );
    }
    return isDemoMode() ? localProjects(status) : [];
  }
  return isDemoMode() ? localProjects(status) : [];
}

export async function fetchProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
    if (data) return normalizeProject(data as Record<string, unknown>);
    const { data: publicProject } = await supabase
      .from("projects")
      .select(PUBLIC_PROJECT_COLUMNS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (publicProject) return normalizeProject(publicProject as Record<string, unknown>);
    return resolveSeedItem(null, () => localProjects().find((p) => p.slug === slug));
  }
  return resolveSeedItem(null, () => localProjects().find((p) => p.slug === slug));
}

export async function fetchLeadProjects(leadId: string): Promise<Project[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (data) return data.map((r) => normalizeProject(r as Record<string, unknown>));
    return [];
  }
  return readCustomProjects().filter((p) => p.lead_id === leadId);
}

export async function createProject(
  leadId: string,
  leadName: string,
  input: {
    title: string;
    description: string;
    type: ProjectType;
    skills_needed: string[];
    tags: string[];
    capacity: number;
    weekly_commitment_hours?: number | null;
    discord_url?: string | null;
    lab_id?: string | null;
  },
): Promise<{ project: Project | null; error: string | null }> {
  const parsed = parseCreateProjectInput(input);
  if (!parsed.data) return { project: null, error: parsed.error };

  const valid = parsed.data;
  const labId = input.lab_id && !input.lab_id.startsWith("seed-") ? input.lab_id : null;
  const hours =
    valid.weekly_commitment_hours != null && Number.isFinite(valid.weekly_commitment_hours)
      ? valid.weekly_commitment_hours
      : null;
  const slug = valid.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const now = new Date().toISOString();

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        slug,
        title: valid.title,
        description: valid.description,
        type: valid.type,
        status: "open",
        skills_needed: valid.skills_needed,
        tags: valid.tags,
        lead_id: leadId,
        lead_name: leadName,
        capacity: valid.capacity,
        team_count: 0,
        published: false,
        publication_status: "draft",
        discord_url: valid.discord_url ?? null,
        lab_id: labId,
        weekly_commitment_hours: hours,
      })
      .select("*")
      .single();
    if (error) return { project: null, error: error.message };
    return { project: normalizeProject(data as Record<string, unknown>), error: null };
  }

  if (!isLocalPersistenceEnabled()) {
    return { project: null, error: "Projects are temporarily unavailable." };
  }

  const project: Project = {
    id: `local-${slug}`,
    slug,
    title: valid.title,
    description: valid.description,
    type: valid.type,
    status: "open",
    skills_needed: valid.skills_needed,
    tags: valid.tags,
    lead_id: leadId,
    lead_name: leadName,
    capacity: valid.capacity,
    team_count: 0,
    published: false,
    publication_status: "draft",
    discord_url: valid.discord_url ?? null,
    lab_id: labId,
    weekly_commitment_hours: hours,
    created_at: now,
    updated_at: now,
  };
  const custom = readCustomProjects();
  custom.unshift(project);
  writeCustomProjects(custom);
  return { project, error: null };
}

export async function updateProject(
  projectId: string,
  patch: Partial<{
    title: string;
    description: string;
    type: ProjectType;
    status: ProjectStatus;
    skills_needed: string[];
    tags: string[];
    capacity: number;
    discord_url: string | null;
    workspace_links: { label: string; url: string; kind?: string }[];
    lab_id: string | null;
    weekly_commitment_hours: number | null;
  }>,
): Promise<{ project: Project | null; error: string | null }> {
  const parsed = parseUpdateProjectInput(patch);
  if (!parsed.data) return { project: null, error: parsed.error };

  const now = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("projects")
      .update({ ...parsed.data, updated_at: now })
      .eq("id", projectId)
      .select("*")
      .single();
    if (error) return { project: null, error: error.message };
    return { project: normalizeProject(data as Record<string, unknown>), error: null };
  }

  const custom = readCustomProjects();
  const idx = custom.findIndex((p) => p.id === projectId);
  if (idx === -1) {
    // Allow editing seed projects locally by cloning into custom list
    const seed = SEED_PROJECTS.find((p) => p.id === projectId);
    if (!seed) return { project: null, error: "Project not found." };
    const updated: Project = { ...seed, ...parsed.data, updated_at: now };
    writeCustomProjects([updated, ...custom]);
    return { project: updated, error: null };
  }
  custom[idx] = { ...custom[idx], ...parsed.data, updated_at: now };
  writeCustomProjects(custom);
  return { project: custom[idx], error: null };
}

export async function submitProjectForReview(
  projectId: string,
): Promise<{ project: Project | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { project: null, error: "Project review is temporarily unavailable." };
  const { data, error } = await supabase.rpc("submit_project_for_review", {
    p_project_id: projectId,
  });
  return {
    project: data ? normalizeProject(data as Record<string, unknown>) : null,
    error: error?.message ?? null,
  };
}

export async function fetchAllProjectsAdmin(): Promise<Project[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  return error ? [] : (data ?? []).map((row) => normalizeProject(row as Record<string, unknown>));
}

export async function reviewProjectPublication(
  projectId: string,
  decision: "published" | "changes_requested" | "archived",
  note?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Project review is temporarily unavailable." };
  const { data: project } = await supabase
    .from("projects")
    .select("lead_id, slug, title")
    .eq("id", projectId)
    .maybeSingle();
  const { error } = await supabase.rpc("review_project_publication", {
    p_project_id: projectId,
    p_decision: decision,
    p_note: note?.trim() || null,
  });
  if (!error && project?.lead_id) {
    const label =
      decision === "published"
        ? "published"
        : decision === "changes_requested"
          ? "returned for revision"
          : "archived";
    await createNotification(project.lead_id, {
      title: `Project ${label}`,
      body: note?.trim()
        ? `“${project.title}” was ${label}. Editorial note: ${note.trim()}`
        : `“${project.title}” was ${label}.`,
      href: `/projects/${project.slug}`,
    });
  }
  return { error: error?.message ?? null };
}

export function relatedProjects(project: Project, all: Project[], limit = 3): Project[] {
  const tags = new Set(project.tags.map((t) => t.toLowerCase()));
  return all
    .filter((p) => p.id !== project.id && p.status === "open")
    .map((p) => ({
      project: p,
      score: p.tags.filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.project);
}

/** Open projects that share tags with a paper review — reading → contribution bridge. */
export function relatedOpenProjectsForPaper(
  paperTags: string[],
  projects: Project[],
  limit = 3,
): Project[] {
  const tags = new Set(paperTags.map((t) => t.toLowerCase()).filter(Boolean));
  if (tags.size === 0) {
    return projects.filter((p) => p.status === "open" && p.published).slice(0, limit);
  }
  return projects
    .filter((p) => p.status === "open" && p.published)
    .map((p) => ({
      project: p,
      score:
        p.tags.filter((t) => tags.has(t.toLowerCase())).length +
        p.skills_needed.filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.project);
}

// ─── Applications ───────────────────────────────────────────────────────────

export async function applyToProject(
  userId: string,
  project: Project,
  pitch: string,
  profile: {
    full_name?: string | null;
    bio?: string | null;
    background?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    interests?: string[];
  },
  questionAnswers?: { questionId: string; answer: string }[],
): Promise<{ error: string | null }> {
  const safePitch = clampText(pitch, LIMITS.applicationPitch);
  if (!safePitch) return { error: "Pitch is required." };

  const now = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("project_applications")
      .insert({
        project_id: project.id,
        user_id: userId,
        pitch: safePitch,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    if (data?.id && questionAnswers?.length) {
      const { saveApplicationAnswers } = await import("@/lib/project-application-questions");
      const answerResult = await saveApplicationAnswers({
        applicationId: String(data.id),
        answers: questionAnswers,
      });
      if (answerResult.error) return { error: answerResult.error };
    }
    return { error: null };
  }

  if (!isLocalPersistenceEnabled()) {
    return { error: "Applications are temporarily unavailable." };
  }

  const apps = readLocalApps();
  if (apps.some((a) => a.project_id === project.id && a.user_id === userId)) {
    return { error: "You already applied to this project." };
  }
  const app: ProjectApplication = {
    id: `local-app-${Date.now()}`,
    project_id: project.id,
    user_id: userId,
    pitch: safePitch,
    status: "pending",
    created_at: now,
    updated_at: now,
    project_title: project.title,
    project_slug: project.slug,
    applicant_name: profile.full_name ?? undefined,
    applicant_bio: profile.bio ?? undefined,
    applicant_background: profile.background as ProjectApplication["applicant_background"],
    applicant_linkedin: profile.linkedin_url ?? undefined,
    applicant_github: profile.github_url ?? undefined,
    applicant_interests: profile.interests,
  };
  apps.push(app);
  writeLocalApps(apps);
  localStorage.setItem(appsKey(userId), JSON.stringify(apps.filter((a) => a.user_id === userId)));
  return { error: null };
}

export async function fetchMyApplicationStatusMap(
  userId: string,
): Promise<Map<string, ApplicationStatus>> {
  const apps = await fetchMyApplications(userId);
  return new Map(apps.map((a) => [a.project_id, a.status]));
}

export async function fetchMyApplications(userId: string): Promise<ProjectApplication[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("project_applications")
      .select("*, projects(title, slug)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const projects = r.projects as { title: string; slug: string } | null;
      return normalizeApplication({
        ...r,
        project_title: projects?.title,
        project_slug: projects?.slug,
      });
    });
  }

  const all = readLocalApps().filter((a) => a.user_id === userId);
  return all.map((a) => {
    const p = [...readCustomProjects(), ...SEED_PROJECTS].find((x) => x.id === a.project_id);
    return {
      ...a,
      project_title: p?.title ?? a.project_title,
      project_slug: p?.slug ?? a.project_slug,
    };
  });
}

export async function fetchProjectApplications(projectId: string): Promise<ProjectApplication[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("project_applications")
      .select("*, profiles(full_name, bio, background, linkedin_url, github_url, interests)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const prof = r.profiles as Record<string, unknown> | null;
      return normalizeApplication({
        ...r,
        applicant_name: prof?.full_name,
        applicant_bio: prof?.bio,
        applicant_background: prof?.background,
        applicant_linkedin: prof?.linkedin_url,
        applicant_github: prof?.github_url,
        applicant_interests: prof?.interests,
      });
    });
  }

  return readLocalApps()
    .filter((a) => a.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  opts?: { declineNote?: string },
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  let application: ProjectApplication | undefined;

  if (supabase) {
    const { data: existing } = await supabase
      .from("project_applications")
      .select("*, projects(title, slug)")
      .eq("id", applicationId)
      .maybeSingle();
    if (existing) {
      const row = existing as Record<string, unknown>;
      const proj = row.projects as { title: string; slug: string } | null;
      application = normalizeApplication({
        ...row,
        project_title: proj?.title,
        project_slug: proj?.slug,
      });
    }

    const { error } = await supabase.rpc("review_project_application", {
      p_application_id: applicationId,
      p_status: status,
      p_note: opts?.declineNote?.trim() || null,
    });
    if (error) return { error: error.message };
  } else {
    const apps = readLocalApps();
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) return { error: "Application not found." };
    application = apps[idx];
    apps[idx] = { ...apps[idx], status, updated_at: new Date().toISOString() };
    writeLocalApps(apps);
  }

  if (application) {
    const label =
      status === "accepted"
        ? "accepted"
        : status === "declined"
          ? "not selected"
          : status === "waitlist"
            ? "waitlisted"
            : status;
    const note = opts?.declineNote?.trim();
    const body =
      status === "declined" && note
        ? `Your application to ${application.project_title ?? "a project"} was not selected. Note from lead: ${note}`
        : `Your application to ${application.project_title ?? "a project"} is now ${label}.`;
    await createNotification(application.user_id, {
      title: `Application ${label}`,
      body,
      href: application.project_slug ? `/projects/${application.project_slug}` : "/applications",
    });
    void notifyApplicationUpdate(
      application.user_id,
      application.project_title ?? "a project",
      label,
    );
  }

  return { error: null };
}

/** Bulk-update application status (lead review queue). */
export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  status: ApplicationStatus,
  opts?: { declineNote?: string },
): Promise<{ error: string | null; updated: number }> {
  let updated = 0;
  for (const id of applicationIds) {
    const { error } = await updateApplicationStatus(id, status, opts);
    if (error) return { error, updated };
    updated += 1;
  }
  return { error: null, updated };
}

/** Accepted team members for a project (public on detail page). */
export async function fetchProjectTeamMembers(
  projectId: string,
): Promise<Array<{ name: string; userId: string }>> {
  const apps = await fetchProjectApplications(projectId);
  return apps
    .filter((a) => a.status === "accepted")
    .map((a) => ({
      name: a.applicant_name ?? "Member",
      userId: a.user_id,
    }));
}

/** Realtime subscription for new/updated applications on a project. */
export function subscribeProjectApplications(
  projectId: string,
  onChange: () => void,
): (() => void) | undefined {
  const supabase = getSupabase();
  if (!supabase) return undefined;

  const channel = supabase
    .channel(`applications:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "project_applications",
        filter: `project_id=eq.${projectId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getApplicationForProject(
  userId: string,
  projectId: string,
): Promise<ProjectApplication | null> {
  const mine = await fetchMyApplications(userId);
  return mine.find((a) => a.project_id === projectId) ?? null;
}

/** Update pitch text while application is still pending. */
export async function updateApplicationPitch(
  userId: string,
  applicationId: string,
  pitch: string,
): Promise<{ error: string | null }> {
  const safePitch = clampText(pitch, LIMITS.applicationPitch);
  if (!safePitch) return { error: "Pitch is required." };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("project_applications")
      .update({ pitch: safePitch, updated_at: new Date().toISOString() })
      .eq("id", applicationId)
      .eq("user_id", userId)
      .eq("status", "pending");
    return { error: error?.message ?? null };
  }

  const apps = readLocalApps();
  const idx = apps.findIndex((a) => a.id === applicationId && a.user_id === userId);
  if (idx === -1) return { error: "Application not found." };
  if (apps[idx].status !== "pending") return { error: "Only pending applications can be edited." };
  apps[idx] = { ...apps[idx], pitch: safePitch, updated_at: new Date().toISOString() };
  writeLocalApps(apps);
  return { error: null };
}

export async function withdrawApplication(
  userId: string,
  applicationId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("project_applications")
      .select("id, status, user_id")
      .eq("id", applicationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { error: "Application not found." };
    if (data.status !== "pending") return { error: "Only pending applications can be withdrawn." };
    const { error } = await supabase.from("project_applications").delete().eq("id", applicationId);
    return { error: error?.message ?? null };
  }

  const apps = readLocalApps();
  const app = apps.find((a) => a.id === applicationId && a.user_id === userId);
  if (!app) return { error: "Application not found." };
  if (app.status !== "pending") return { error: "Only pending applications can be withdrawn." };
  writeLocalApps(apps.filter((a) => a.id !== applicationId));
  return { error: null };
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export async function fetchJobBySlug(slug: string): Promise<Job | null> {
  const jobs = await fetchJobs();
  return jobs.find((j) => j.slug === slug) ?? null;
}

export async function fetchJobs(source?: Job["source"]): Promise<Job[]> {
  const supabase = getSupabase();
  if (supabase) {
    let q = supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (source) q = q.eq("source", source);
    const { data, error } = await q;
    if (!error) {
      return withSeedFallback(
        (data ?? []).map((r) => normalizeJob(r as Record<string, unknown>)),
        source ? SEED_JOBS.filter((j) => j.source === source) : SEED_JOBS,
      );
    }
    return isDemoMode() ? (source ? SEED_JOBS.filter((j) => j.source === source) : SEED_JOBS) : [];
  }
  return isDemoMode() ? (source ? SEED_JOBS.filter((j) => j.source === source) : SEED_JOBS) : [];
}

export async function fetchAllJobsAdmin(): Promise<Job[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    return data?.length ? data.map((r) => normalizeJob(r as Record<string, unknown>)) : [];
  }
  return isDemoMode() ? SEED_JOBS : [];
}

export async function createJob(payload: {
  title: string;
  company: string;
  description: string;
  source: Job["source"];
  location?: string;
  url?: string;
  tags?: string[];
}): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Job publishing is temporarily unavailable." };

  const slug = slugify(`${payload.company}-${payload.title}`);
  const { error } = await supabase.from("jobs").insert({
    slug,
    title: payload.title,
    company: payload.company,
    description: payload.description,
    source: payload.source,
    location: payload.location ?? null,
    url: payload.url ?? null,
    tags: payload.tags ?? [],
    published: true,
  });
  return { error: error?.message ?? null };
}

export async function setJobPublished(
  id: string,
  published: boolean,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Job publishing is temporarily unavailable." };
  const { error } = await supabase
    .from("jobs")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function updateJobAdmin(
  id: string,
  patch: Partial<{
    title: string;
    company: string;
    description: string;
    location: string | null;
    url: string | null;
    tags: string[];
    published: boolean;
  }>,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Job updates are temporarily unavailable." };
  const { error } = await supabase
    .from("jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteJob(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Job deletion is temporarily unavailable." };
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// ─── Lead verification ──────────────────────────────────────────────────────

export async function submitLeadRequest(
  userId: string,
  message: string,
): Promise<{ error: string | null }> {
  const parsed = parseLeadRequestInput(message);
  if (!parsed.data) return { error: parsed.error };

  const supabase = getSupabase();
  if (supabase) {
    const { data: existing } = await supabase
      .from("lead_verification_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) return { error: "You already have a pending request." };

    const { error } = await supabase
      .from("lead_verification_requests")
      .insert({ user_id: userId, message: parsed.data.message });
    return { error: error?.message ?? null };
  }

  if (!isLocalPersistenceEnabled()) {
    return { error: "Lead verification is temporarily unavailable." };
  }

  if (localStorage.getItem(leadReqKey(userId))) {
    return { error: "You already have a pending request." };
  }
  localStorage.setItem(
    leadReqKey(userId),
    JSON.stringify({
      message: parsed.data.message,
      status: "pending",
      created_at: new Date().toISOString(),
    }),
  );
  return { error: null };
}

export async function fetchPendingLeadRequests(): Promise<LeadVerificationRequest[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("lead_verification_requests")
      .select("*, profiles(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const prof = r.profiles as { full_name: string } | null;
      return {
        id: String(r.id),
        user_id: String(r.user_id),
        message: String(r.message),
        status: r.status as LeadVerificationRequest["status"],
        created_at: String(r.created_at),
        reviewed_at: r.reviewed_at != null ? String(r.reviewed_at) : null,
        applicant_name: prof?.full_name,
      };
    });
  }
  return [];
}

export async function approveLeadRequest(
  requestId: string,
  userId: string,
  adminId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Lead approval is temporarily unavailable." };

  const { error: reqError } = await supabase
    .from("lead_verification_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: adminId })
    .eq("id", requestId);

  if (reqError) return { error: reqError.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "project_lead", updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (!profileError) {
    await createNotification(userId, {
      title: "Project lead approved",
      body: "You can now create projects and review applications from My projects.",
      href: "/projects/manage",
    });
    void notifyLeadApproved(userId);
  }

  return { error: profileError?.message ?? null };
}

export async function rejectLeadRequest(
  requestId: string,
  adminId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Lead review is temporarily unavailable." };

  const { error } = await supabase
    .from("lead_verification_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: adminId })
    .eq("id", requestId);

  return { error: error?.message ?? null };
}

export async function hasPendingLeadRequest(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("lead_verification_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    return !!data;
  }
  return !!localStorage.getItem(leadReqKey(userId));
}
