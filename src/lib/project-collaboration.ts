import { clampText } from "@/lib/security";
import { isSafeUrl } from "@/lib/urls";
import { getSupabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import type {
  CollaborationVisibility,
  ContributionType,
  Project,
  ProjectContribution,
  ProjectMembership,
  ProjectMilestone,
} from "@/lib/types";

const toRows = <T>(data: T[] | null): T[] => data ?? [];

export type MemberWorkspaceProject = Pick<
  Project,
  "id" | "slug" | "title" | "type" | "status" | "lead_id" | "lead_name" | "updated_at"
> & {
  member_role: ProjectMembership["member_role"];
  membership_status: ProjectMembership["status"];
  joined_at: string;
};

export type MemberWorkspaceContribution = ProjectContribution & {
  project_title: string;
  project_slug: string;
  milestone_title: string | null;
};

export type MemberWorkspaceStats = {
  total: number;
  submitted: number;
  verified: number;
  needsChanges: number;
};

export function memberWorkspaceStats(
  contributions: Pick<ProjectContribution, "verification_status">[],
): MemberWorkspaceStats {
  return contributions.reduce<MemberWorkspaceStats>(
    (stats, contribution) => {
      stats.total += 1;
      if (contribution.verification_status === "verified") stats.verified += 1;
      if (contribution.verification_status === "submitted") stats.submitted += 1;
      if (contribution.verification_status === "needs_changes") stats.needsChanges += 1;
      return stats;
    },
    { total: 0, submitted: 0, verified: 0, needsChanges: 0 },
  );
}

/**
 * Returns only durable project memberships. Application status is not treated
 * as access; Supabase RLS remains the final authority for every returned row.
 */
export async function fetchMemberWorkspaceProjects(
  userId: string,
): Promise<MemberWorkspaceProject[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_memberships")
    .select(
      "project_id, user_id, member_role, status, joined_at, projects(id, slug, title, type, status, lead_id, lead_name, updated_at)",
    )
    .eq("user_id", userId)
    .in("status", ["active", "paused"])
    .order("joined_at", { ascending: false });
  if (error) throw new Error("Project memberships could not be loaded.");

  return (data ?? []).flatMap((row) => {
    const record = row as unknown as Record<string, unknown>;
    const joined = record.projects as Record<string, unknown> | null;
    if (!joined?.id || !joined.slug || !joined.title) return [];
    return [
      {
        id: String(joined.id),
        slug: String(joined.slug),
        title: String(joined.title),
        type: joined.type as Project["type"],
        status: joined.status as Project["status"],
        lead_id: joined.lead_id ? String(joined.lead_id) : null,
        lead_name: joined.lead_name ? String(joined.lead_name) : null,
        updated_at: String(joined.updated_at ?? record.joined_at),
        member_role: record.member_role as ProjectMembership["member_role"],
        membership_status: record.status as ProjectMembership["status"],
        joined_at: String(record.joined_at),
      },
    ];
  });
}

/** Fetches the signed-in member's own evidence log with display-only joins. */
export async function fetchMemberWorkspaceContributions(
  userId: string,
): Promise<MemberWorkspaceContribution[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("project_contributions")
    .select("*, projects(title, slug), project_milestones(title)")
    .eq("contributor_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Contribution records could not be loaded.");

  return (data ?? []).flatMap((row) => {
    const record = row as unknown as Record<string, unknown>;
    const project = record.projects as Record<string, unknown> | null;
    const milestone = record.project_milestones as Record<string, unknown> | null;
    if (!project?.title || !project.slug) return [];
    return [
      {
        ...(record as unknown as ProjectContribution),
        project_title: String(project.title),
        project_slug: String(project.slug),
        milestone_title: milestone?.title ? String(milestone.title) : null,
      },
    ];
  });
}

export type PublicProjectOutput =
  | {
      kind: "milestone";
      project: Pick<Project, "id" | "slug" | "title" | "type">;
      milestone: ProjectMilestone;
    }
  | {
      kind: "contribution";
      project: Pick<Project, "id" | "slug" | "title" | "type">;
      contribution: ProjectContribution;
    };

/**
 * Public, evidence-safe output archive. Queries remain explicitly filtered even
 * though RLS also limits anonymous readers, preventing authenticated visitors
 * from seeing team-only or unverified rows through this public surface.
 */
export async function fetchPublicProjectOutputs(
  limit = 24,
  options: { throwOnUnavailable?: boolean } = {},
): Promise<PublicProjectOutput[]> {
  const supabase = getSupabase();
  if (!supabase) {
    if (options.throwOnUnavailable)
      throw new Error("Public project outputs are temporarily unavailable.");
    return [];
  }

  const [milestoneResult, contributionResult] = await Promise.all([
    supabase
      .from("project_milestones")
      .select("*")
      .eq("visibility", "public")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(limit)
      .abortSignal(AbortSignal.timeout(8_000)),
    supabase
      .from("project_contributions")
      .select("*")
      .eq("visibility", "public")
      .eq("verification_status", "verified")
      .order("verified_at", { ascending: false })
      .limit(limit)
      .abortSignal(AbortSignal.timeout(8_000)),
  ]);

  if (options.throwOnUnavailable && (milestoneResult.error || contributionResult.error)) {
    throw new Error("Public project outputs could not be loaded completely.");
  }
  const milestones = milestoneResult.error ? [] : toRows(milestoneResult.data);
  const contributions = contributionResult.error ? [] : toRows(contributionResult.data);
  const projectIds = [...new Set([...milestones, ...contributions].map((row) => row.project_id))];
  if (!projectIds.length) return [];

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, title, type")
    .in("id", projectIds)
    .eq("published", true)
    .abortSignal(AbortSignal.timeout(8_000));
  if (projectsError || !projects) {
    if (options.throwOnUnavailable)
      throw new Error("The projects for these outputs could not be loaded.");
    return [];
  }

  const projectMap = new Map(
    projects.map((project) => [
      project.id,
      project as Pick<Project, "id" | "slug" | "title" | "type">,
    ]),
  );
  return [
    ...milestones.flatMap((milestone) => {
      const project = projectMap.get(milestone.project_id);
      return project ? [{ kind: "milestone" as const, project, milestone }] : [];
    }),
    ...contributions.flatMap((contribution) => {
      const project = projectMap.get(contribution.project_id);
      return project ? [{ kind: "contribution" as const, project, contribution }] : [];
    }),
  ]
    .sort((a, b) => {
      const aDate =
        a.kind === "milestone"
          ? (a.milestone.completed_at ?? a.milestone.updated_at)
          : (a.contribution.verified_at ?? a.contribution.updated_at);
      const bDate =
        b.kind === "milestone"
          ? (b.milestone.completed_at ?? b.milestone.updated_at)
          : (b.contribution.verified_at ?? b.contribution.updated_at);
      return bDate.localeCompare(aDate);
    })
    .slice(0, limit);
}

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
  if (!supabase) return { error: "Membership changes are temporarily unavailable." };
  const { data: project } = await supabase
    .from("projects")
    .select("slug, title")
    .eq("id", projectId)
    .maybeSingle();
  const { error } = await supabase.rpc("set_project_membership_status", {
    p_project_id: projectId,
    p_user_id: userId,
    p_status: status,
  });
  if (!error) {
    const record = project as Record<string, unknown> | null;
    const title = record?.title != null ? String(record.title) : "a project";
    const slug = record?.slug != null ? String(record.slug) : null;
    const body =
      status === "active"
        ? `Your contributor access on ${title} is active.`
        : status === "paused"
          ? `Your contributor access on ${title} is paused.`
          : status === "alumni"
            ? `You have been marked as alumni on ${title}.`
            : `Your contributor access on ${title} has been removed.`;
    await createNotification(userId, {
      title: "Project membership updated",
      body,
      href: slug ? `/projects/${slug}` : "/projects",
    });
  }
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
  if (!supabase) return { error: "Milestones are temporarily unavailable." };
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
  if (!supabase) return { error: "Milestones are temporarily unavailable." };
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

export function canReviewContribution(
  contribution: ProjectContribution,
  userId: string | undefined,
  isLeadOrAdmin: boolean,
): boolean {
  if (!userId) return false;
  // Contributors never verify their own submissions — including leads/admins.
  if (contribution.contributor_id === userId) return false;
  if (isLeadOrAdmin) return true;
  return contribution.assigned_reviewer_id === userId;
}

export async function assignContributionReviewer(
  contributionId: string,
  reviewerId: string | null,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Reviewer assignment is temporarily unavailable." };
  const { error } = await supabase.rpc("assign_contribution_reviewer", {
    p_contribution_id: contributionId,
    p_reviewer_id: reviewerId,
  });
  return { error: error?.message ?? null };
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
  if (!supabase) return { error: "Contributions are temporarily unavailable." };
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
  if (!supabase) return { error: "Contributions are temporarily unavailable." };
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
  if (!supabase) return { error: "Contributions are temporarily unavailable." };
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
  if (!supabase) return { error: "Contributions are temporarily unavailable." };
  const { error } = await supabase.rpc("resubmit_project_contribution", {
    p_contribution_id: contributionId,
  });
  return { error: error?.message ?? null };
}
