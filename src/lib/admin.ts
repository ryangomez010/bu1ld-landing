import { INSTITUTION_TAKE } from "@/data/copy";
import { logAdminAction } from "@/lib/audit-log";
import { getSupabase } from "@/lib/supabase";
import type { AdminStats, InstitutionalRole, MemberRole, Profile } from "@/lib/types";

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
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
    };
  }

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
  ]);

  return {
    members: members.count ?? 0,
    projects: projects.count ?? 0,
    applications: applications.count ?? 0,
    pendingLeads: leads.count ?? 0,
    events: events.count ?? 0,
    papers: papers.count ?? 0,
    jobs: jobs.count ?? 0,
    programs: programs.count ?? 0,
    contributions: contributions.count ?? 0,
    verifiedContributions: verifiedContributions.count ?? 0,
    evidenceClaims: evidenceClaims.count ?? 0,
    pendingProjectReviews: pendingProjectReviews.count ?? 0,
    pendingProgramApplications: pendingProgramApplications.count ?? 0,
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
  if (!supabase) return { error: "Supabase required." };
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
  if (!supabase) return { error: "Supabase required." };
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

export function generatePaperDraft(title: string, authors: string, notes: string): string {
  return `## Why it still matters

${notes || "Summarize the core contribution in 2–3 sentences."}

## Core idea

- **Problem:** What gap does "${title}" address?
- **Method:** Key technical insight from ${authors || "the authors"}.
- **Result:** What changed after this paper?

## What to notice when reading

1. Look at the experimental setup — what would break if you changed one assumption?
2. Identify the figure that carries the paper. Everything else supports it.
3. Ask: does this generalize beyond the benchmark?

## ${INSTITUTION_TAKE}

How does this connect to active research threads? What would a 2-week prototype look like that tests one claim from this paper?`;
}

export function generateEventPrep(title: string, topics: string, notes: string): string {
  return `## ${title} — prep notes

**Topics:** ${topics || "ML, research"}

${notes || "Add venue-specific guidance here."}

## Timeline checklist

- [ ] Identify target track and scope fit
- [ ] Line up internal read 6 weeks before deadline
- [ ] Prepare LaTeX template and author kit
- [ ] Draft limitations section early

## Resources to gather

- Official CFP and style files
- Overleaf template
- Prior year accepted papers in your subarea`;
}
