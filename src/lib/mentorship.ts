import { getSupabase } from "@/lib/supabase";
import { parseMentorshipRequest } from "@/lib/validation";
import type { MentorProfile, MentorshipRequest, MentorshipRequestStatus } from "@/lib/types";

function mentor(row: Record<string, unknown>): MentorProfile {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    mentor_id: String(row.mentor_id),
    headline: String(row.headline ?? ""),
    expertise: Array.isArray(row.expertise) ? row.expertise.map(String) : [],
    availability_note: String(row.availability_note ?? ""),
    monthly_capacity: Number(row.monthly_capacity ?? 0),
    accepting_requests: Boolean(row.accepting_requests),
    visible: Boolean(row.visible),
    full_name: profile?.full_name != null ? String(profile.full_name) : null,
    bio: profile?.bio != null ? String(profile.bio) : null,
    avatar_url: profile?.avatar_url != null ? String(profile.avatar_url) : null,
  };
}

function request(row: Record<string, unknown>): MentorshipRequest {
  const mentorProfile = row.mentor_profile as Record<string, unknown> | null;
  const mentorIdentity = mentorProfile?.profiles as Record<string, unknown> | null;
  const requesterProfile = row.requester_profile as Record<string, unknown> | null;
  return {
    id: String(row.id),
    mentor_id: String(row.mentor_id),
    requester_id: String(row.requester_id),
    topic: String(row.topic),
    goal: String(row.goal),
    availability_note: String(row.availability_note),
    status: row.status as MentorshipRequestStatus,
    decision_note: row.decision_note ? String(row.decision_note) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    mentor_name: mentorIdentity?.full_name != null ? String(mentorIdentity.full_name) : null,
    requester_name: requesterProfile?.full_name != null ? String(requesterProfile.full_name) : null,
  };
}

export async function fetchMentors(): Promise<MentorProfile[]> {
  const db = getSupabase();
  if (!db) throw new Error("Mentorship is temporarily unavailable. Please try again.");
  const { data, error } = await db
    .from("mentor_profiles")
    .select("*, profiles:mentor_id(full_name,bio,avatar_url)")
    .eq("visible", true)
    .eq("accepting_requests", true)
    .gt("monthly_capacity", 0)
    .order("updated_at", { ascending: false })
    .abortSignal(AbortSignal.timeout(10000));
  if (error) throw new Error("Mentors could not be loaded. Please try again.");
  return (data ?? []).map((row) => mentor(row as Record<string, unknown>));
}

export async function fetchMyMentorProfile(userId: string): Promise<MentorProfile | null> {
  const db = getSupabase();
  if (!db) throw new Error("Mentor settings are temporarily unavailable. Please try again.");
  const { data, error } = await db
    .from("mentor_profiles")
    .select("*, profiles:mentor_id(full_name,bio,avatar_url)")
    .eq("mentor_id", userId)
    .maybeSingle()
    .abortSignal(AbortSignal.timeout(10000));
  if (error) throw new Error("Mentor settings could not be loaded. Please try again.");
  return data ? mentor(data as Record<string, unknown>) : null;
}

export async function saveMentorProfile(input: MentorProfile): Promise<{ error: string | null }> {
  const db = getSupabase();
  if (!db) return { error: "Mentor availability is temporarily unavailable." };
  const { error } = await db
    .from("mentor_profiles")
    .upsert({
      mentor_id: input.mentor_id,
      headline: input.headline.trim().slice(0, 160),
      expertise: input.expertise
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
      availability_note: input.availability_note.trim().slice(0, 500),
      monthly_capacity: Math.max(0, Math.min(20, Math.trunc(input.monthly_capacity))),
      accepting_requests: input.accepting_requests,
      visible: input.visible,
    })
    .abortSignal(AbortSignal.timeout(10000));
  return { error: error?.message ?? null };
}

export async function requestMentorship(input: {
  mentorId: string;
  requesterId: string;
  topic: string;
  goal: string;
  availabilityNote: string;
}) {
  const parsed = parseMentorshipRequest(input);
  if (!parsed.data) return { error: parsed.error };
  const db = getSupabase();
  if (!db) return { error: "Mentorship requests are temporarily unavailable." };
  const { error } = await db
    .from("mentorship_requests")
    .insert({
      mentor_id: input.mentorId,
      requester_id: input.requesterId,
      topic: parsed.data.topic,
      goal: parsed.data.goal,
      availability_note: parsed.data.availabilityNote,
    })
    .abortSignal(AbortSignal.timeout(10000));
  return { error: error?.message ?? null };
}

export async function fetchMyMentorshipRequests(userId: string): Promise<MentorshipRequest[]> {
  const db = getSupabase();
  if (!db) throw new Error("Mentorship is temporarily unavailable. Please try again.");
  const { data, error } = await db
    .from("mentorship_requests")
    .select(
      "*, mentor_profile:mentor_id(profiles:mentor_id(full_name)), requester_profile:requester_id(full_name)",
    )
    .or(`mentor_id.eq.${userId},requester_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .abortSignal(AbortSignal.timeout(10000));
  if (error) throw new Error("Your requests could not be loaded. Please try again.");
  return (data ?? []).map((row) => request(row as Record<string, unknown>));
}

export async function decideMentorshipRequest(
  id: string,
  status: "accepted" | "declined",
  note: string,
) {
  const db = getSupabase();
  if (!db) return { error: "Mentorship review is temporarily unavailable." };
  const { data, error } = await db
    .from("mentorship_requests")
    .update({ status, decision_note: note.trim().slice(0, 1000) || null })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()
    .abortSignal(AbortSignal.timeout(10000));
  return {
    error:
      error?.message ??
      (data
        ? null
        : "This request changed or you no longer have access. Reload before trying again."),
  };
}
