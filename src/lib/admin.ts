import { logAdminAction } from "@/lib/audit-log";
import { getSupabase } from "@/lib/supabase";
import type { AdminStats, InstitutionalRole, MemberRole, Profile } from "@/lib/types";

const EMPTY_STATS: AdminStats = {
  members: 0,
  projects: 0,
  applications: 0,
  pendingLeads: 0,
  events: 0,
  papers: 0,
  jobs: 0,
  programs: 0,
  contributions: 0,
  verifiedContributions: 0,
  evidenceClaims: 0,
  pendingProjectReviews: 0,
  pendingProgramApplications: 0,
  pendingContributionReviews: 0,
  overdueMilestones: 0,
  projectsWithoutLead: 0,
  stalledProjects: 0,
};

function numberOrZero(n?: number | null): number {
  return n ?? 0;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = getSupabase();
  if (!supabase) return { ...EMPTY_STATS };

  const stalledBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString().slice(0, 10);

  const [
    members,
    projects,
    applications,
    leads,
    events,
    papers,
    jobs,
    programs,
    contributions,
    verifiedContributions,
    evidenceClaims,
    pendingProjectReviews,
    pendingProgramApplications,
    pendingContributionReviews,
    overdueMilestones,
    projectsWithoutLead,
    stalledProjects,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("project_applications").select("id", { count: "exact", head: true }),
    supabase
      .from("lead_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("papers").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("project_contributions").select("id", { count: "exact", head: true }),
    supabase
      .from("project_contributions")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase
      .from("institutional_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "verified"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("publication_status", "submitted"),
    supabase
      .from("program_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("project_contributions")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "submitted"),
    supabase
      .from("project_milestones")
      .select("id", { count: "exact", head: true })
      .neq("status", "completed")
      .lt("due_date", nowIso)
      .not("due_date", "is", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .is("lead_id", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .in("status", ["open", "active"])
      .lt("updated_at", stalledBefore),
  ]);

  return {
    members: numberOrZero(members.count),
    projects: numberOrZero(projects.count),
    applications: numberOrZero(applications.count),
    pendingLeads: numberOrZero(leads.count),
    events: numberOrZero(events.count),
    papers: numberOrZero(papers.count),
    jobs: numberOrZero(jobs.count),
    programs: numberOrZero(programs.count),
    contributions: numberOrZero(contributions.count),
    verifiedContributions: numberOrZero(verifiedContributions.count),
    evidenceClaims: numberOrZero(evidenceClaims.count),
    pendingProjectReviews: numberOrZero(pendingProjectReviews.count),
    pendingProgramApplications: numberOrZero(pendingProgramApplications.count),
    pendingContributionReviews: numberOrZero(pendingContributionReviews.count),
    overdueMilestones: numberOrZero(overdueMilestones.count),
    projectsWithoutLead: numberOrZero(projectsWithoutLead.count),
    stalledProjects: numberOrZero(stalledProjects.count),
  };
}

export async function fetchAllMembers(): Promise<Profile[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((p) => ({ ...p, role: p.role ?? "member" })) as Profile[];
}

export async function fetchInstitutionalRolesByMember(): Promise<Map<string, InstitutionalRole[]>> {
  const supabase = getSupabase();
  if (!supabase) return new Map();
  const { data, error } = await supabase.from("member_roles").select("user_id, role");
  if (error) return new Map();
  return (data ?? []).reduce((roles, row) => {
    const current = roles.get(row.user_id) ?? [];
    current.push(row.role as InstitutionalRole);
    roles.set(row.user_id, current);
    return roles;
  }, new Map<string, InstitutionalRole[]>());
}

export async function setInstitutionalRole(
  actorId: string,
  userId: string,
  role: InstitutionalRole,
  enabled: boolean,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Member role updates are temporarily unavailable." };
  const result = enabled
    ? await supabase.from("member_roles").upsert({ user_id: userId, role, granted_by: actorId })
    : await supabase.from("member_roles").delete().eq("user_id", userId).eq("role", role);
  if (!result.error) {
    await logAdminAction(
      actorId,
      enabled ? "member.institutional_role_granted" : "member.institutional_role_revoked",
      {
        targetType: "profile",
        targetId: userId,
        detail: { role },
      },
    );
  }
  return { error: result.error?.message ?? null };
}

export async function updateMemberRole(
  actorId: string,
  userId: string,
  role: MemberRole,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Member role updates are temporarily unavailable." };
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (!error) {
    await logAdminAction(actorId, "member.role_update", {
      targetType: "profile",
      targetId: userId,
      detail: { role },
    });
  }
  return { error: error?.message ?? null };
}

export async function fetchMemberIds(): Promise<string[]> {
  const members = await fetchAllMembers();
  return members.map((m) => m.id);
}
