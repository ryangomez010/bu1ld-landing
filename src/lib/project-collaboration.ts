import { clampText } from "@/lib/security";
import { isSafeUrl } from "@/lib/urls";
import { getSupabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import type {
  CollaborationVisibility,
  ContributionType,
  ProjectContribution,
  ProjectMembership,
  ProjectMilestone,
} from "@/lib/types";

const toRows = <T>(data: T[] | null): T[] => data ?? [];

export async function fetchProjectMembership(
  projectId: string,
  userId: string,
): Promise<ProjectMembership | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("project_memberships")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return error || !data ? null : data;
}

export async function fetchProjectMemberships(projectId: string): Promise<ProjectMembership[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_memberships")
    .select("*, profiles(full_name, background)")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const profile = record.profiles as Record<string, unknown> | null;
    return {
      ...record,
      member_name: profile?.full_name != null ? String(profile.full_name) : null,
      member_background: profile?.background as ProjectMembership["member_background"],
    } as ProjectMembership;
  });
}

export async function setProjectMembershipStatus(
  projectId: string,
  userId: string,
  status: ProjectMembership["status"],
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Membership changes require a live database connection." };
  const { error } = await supabase.rpc("set_project_membership_status", {
    p_project_id: projectId,
    p_user_id: userId,
    p_status: status,
  });
  return { error: error?.message ?? null };
}

export async function fetchProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return error ? [] : toRows(data);
}

export async function createMilestone(
  userId: string,
  input: {
    projectId: string;
    title: string;
    description: string;
    dueDate?: string;
    visibility: CollaborationVisibility;
  },
): Promise<{ error: string | null }> {
  const title = clampText(input.title, 160);
  const description = clampText(input.description, 4000);
  if (title.length < 3 || description.length < 3) {
    return { error: "Give the milestone a clear title and a short success condition." };
  }
  const supabase = getSupabase();
  if (!supabase) return { error: "Milestones require a live database connection." };
  const { error } = await supabase.from("project_milestones").insert({
    project_id: input.projectId,
    title,
    description,
    due_date: input.dueDate || null,
    visibility: input.visibility,
    created_by: userId,
  });
  return { error: error?.message ?? null };
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: ProjectMilestone["status"],
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Milestones require a live database connection." };
  const { error } = await supabase
    .from("project_milestones")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);
  return { error: error?.message ?? null };
}

export async function fetchProjectContributions(projectId: string): Promise<ProjectContribution[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_contributions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return error ? [] : toRows(data);
}

export async function submitContribution(
  userId: string,
  input: {
    projectId: string;
    milestoneId?: string | null;
    contributionType: ContributionType;
    title: string;
    summary: string;
    evidenceUrl?: string;
    visibility: CollaborationVisibility;
  },
): Promise<{ error: string | null }> {
  const title = clampText(input.title, 160);
  const summary = clampText(input.summary, 4000);
  const evidence = input.evidenceUrl?.trim() ?? "";
  if (title.length < 3 || summary.length < 20) {
    return { error: "Add a specific title and at least 20 characters describing the result." };
  }
  if (evidence && !isSafeUrl(evidence))
    return { error: "Evidence links must use http:// or https://." };
  const supabase = getSupabase();
  if (!supabase) return { error: "Contributions require a live database connection." };
  const { error } = await supabase.from("project_contributions").insert({
    project_id: input.projectId,
    milestone_id: input.milestoneId ?? null,
    contributor_id: userId,
    contribution_type: input.contributionType,
    title,
    summary,
    evidence_url: evidence || null,
    visibility: input.visibility,
  });
  return { error: error?.message ?? null };
}

export async function verifyContribution(
  contributionId: string,
  verificationStatus: Exclude<ProjectContribution["verification_status"], "submitted">,
  note?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Contributions require a live database connection." };
  const { data: contribution } = await supabase
    .from("project_contributions")
    .select("contributor_id, project_id, title, projects(slug, title)")
    .eq("id", contributionId)
    .maybeSingle();
  const { error } = await supabase.rpc("review_project_contribution", {
    p_contribution_id: contributionId,
    p_status: verificationStatus,
    p_note: note?.trim() || null,
  });
  if (!error && contribution) {
    const record = contribution as Record<string, unknown>;
    const project = record.projects as Record<string, unknown> | null;
    const projectTitle = project?.title != null ? String(project.title) : "your project";
    const projectSlug = project?.slug != null ? String(project.slug) : null;
    await createNotification(String(record.contributor_id), {
      title:
        verificationStatus === "verified" ? "Contribution verified" : "Contribution needs revision",
      body:
        note?.trim() ||
        (verificationStatus === "verified"
          ? `Your contribution “${String(record.title)}” on ${projectTitle} was verified.`
          : `Your contribution “${String(record.title)}” on ${projectTitle} needs changes.`),
      href: projectSlug ? `/projects/${projectSlug}` : "/projects",
    });
  }
  return { error: error?.message ?? null };
}

export async function updateContribution(
  contributionId: string,
  input: { title: string; summary: string; evidenceUrl?: string },
): Promise<{ error: string | null }> {
  const title = clampText(input.title, 160);
  const summary = clampText(input.summary, 4000);
  const evidenceUrl = input.evidenceUrl?.trim() ?? "";
  if (title.length < 3 || summary.length < 20) {
    return { error: "Add a specific title and at least 20 characters describing the result." };
  }
  if (evidenceUrl && !isSafeUrl(evidenceUrl))
    return { error: "Evidence links must use http:// or https://." };
  const supabase = getSupabase();
  if (!supabase) return { error: "Contributions require a live database connection." };
  const { error } = await supabase
    .from("project_contributions")
    .update({
      title,
      summary,
      evidence_url: evidenceUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contributionId);
  return { error: error?.message ?? null };
}

export async function resubmitContribution(
  contributionId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Contributions require a live database connection." };
  const { error } = await supabase.rpc("resubmit_project_contribution", {
    p_contribution_id: contributionId,
  });
  return { error: error?.message ?? null };
}
