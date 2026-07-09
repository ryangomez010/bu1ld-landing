import { getSupabase } from "@/lib/supabase";
import type { AdminStats, MemberRole, Profile } from "@/lib/types";
import { SEED_JOBS, SEED_PROJECTS } from "@/data/seed/projects";
import { SEED_EVENTS, SEED_PAPERS } from "@/data/seed/content";

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      members: 0,
      projects: SEED_PROJECTS.length,
      applications: 0,
      pendingLeads: 0,
      events: SEED_EVENTS.length,
      papers: SEED_PAPERS.length,
      jobs: SEED_JOBS.length,
    };
  }

  const [members, projects, applications, leads, events, papers, jobs] = await Promise.all([
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
  ]);

  return {
    members: members.count ?? 0,
    projects: projects.count ?? 0,
    applications: applications.count ?? 0,
    pendingLeads: leads.count ?? 0,
    events: events.count ?? 0,
    papers: papers.count ?? 0,
    jobs: jobs.count ?? 0,
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

export async function updateMemberRole(
  userId: string,
  role: MemberRole,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required." };
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
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

## BUILD take

How does this connect to active BUILD threads? What would a 2-week prototype look like that tests one claim from this paper?`;
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
