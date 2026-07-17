import { getSupabase } from "@/lib/supabase";
import { COMPETITIONS } from "@/data/institution";
import { clampText } from "@/lib/security";
import { isSafeUrl } from "@/lib/urls";
import type { Competition } from "@/lib/types";

export type CompetitionSubmission = {
  id: string;
  competition_id: string;
  submitter_id: string;
  title: string;
  summary: string;
  evidence_url: string | null;
  status: "submitted" | "accepted" | "rejected" | "withdrawn";
  score: number | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

function seedAsCompetition(slug: string): Competition | null {
  const seed = COMPETITIONS.find((c) => c.slug === slug);
  if (!seed) return null;
  return {
    id: `seed-${seed.slug}`,
    slug: seed.slug,
    title: seed.name,
    summary: seed.summary,
    status: seed.status === "open" ? "open" : seed.status === "closed" ? "closed" : "upcoming",
    prize: seed.prize,
    deadline: seed.deadline,
    lab_id: null,
    evaluation_protocol:
      "Evaluation protocol publishes before submissions open. Scoring is frozen for the duration of the challenge.",
    published: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

export async function fetchPublishedCompetitions(): Promise<Competition[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return COMPETITIONS.map((c) => seedAsCompetition(c.slug)!).filter(Boolean);
  }
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("published", true)
    .order("deadline", { ascending: true, nullsFirst: false });
  if (error || !data?.length) {
    return COMPETITIONS.map((c) => seedAsCompetition(c.slug)!).filter(Boolean);
  }
  return data as Competition[];
}

export async function fetchCompetitionBySlug(slug: string): Promise<Competition | null> {
  const supabase = getSupabase();
  if (!supabase) return seedAsCompetition(slug);
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return seedAsCompetition(slug);
  return data as Competition;
}

export async function fetchMyCompetitionSubmission(
  competitionId: string,
  userId: string,
): Promise<CompetitionSubmission | null> {
  const supabase = getSupabase();
  if (!supabase || competitionId.startsWith("seed-")) return null;
  const { data, error } = await supabase
    .from("competition_submissions")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("submitter_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CompetitionSubmission;
}

export async function submitCompetitionEntry(input: {
  competitionId: string;
  submitterId: string;
  title: string;
  summary: string;
  evidenceUrl?: string;
}): Promise<{ submission: CompetitionSubmission | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase)
    return { submission: null, error: "Competition service is temporarily unavailable." };
  if (input.competitionId.startsWith("seed-")) {
    return {
      submission: null,
      error: "Competition catalog is seed-only until phase25 is applied on the live database.",
    };
  }
  const title = clampText(input.title, 160);
  const summary = clampText(input.summary, 4000);
  if (title.length < 3) return { submission: null, error: "Title is required." };
  if (summary.length < 20)
    return { submission: null, error: "Summary must be at least 20 characters." };
  if (input.evidenceUrl && !isSafeUrl(input.evidenceUrl)) {
    return { submission: null, error: "Evidence URL must be http(s)." };
  }

  const { data, error } = await supabase
    .from("competition_submissions")
    .upsert(
      {
        competition_id: input.competitionId,
        submitter_id: input.submitterId,
        title,
        summary,
        evidence_url: input.evidenceUrl?.trim() || null,
        status: "submitted",
      },
      { onConflict: "competition_id,submitter_id" },
    )
    .select("*")
    .single();

  if (error) return { submission: null, error: error.message };
  return { submission: data as CompetitionSubmission, error: null };
}

export async function fetchCompetitionSubmissionsAdmin(
  limit = 100,
): Promise<(CompetitionSubmission & { competition_title?: string })[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("competition_submissions")
    .select("*, competitions(title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as CompetitionSubmission & { competitions?: { title?: string } | null };
    return {
      ...r,
      competition_title: r.competitions?.title,
    };
  });
}

export async function reviewCompetitionSubmission(
  id: string,
  status: "accepted" | "rejected" | "submitted",
  reviewNote?: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Competition service is temporarily unavailable." };
  const { error } = await supabase
    .from("competition_submissions")
    .update({
      status,
      review_note: reviewNote ? clampText(reviewNote, 4000) : null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  return { error: error?.message ?? null };
}
