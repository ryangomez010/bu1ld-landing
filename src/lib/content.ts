import { SEED_EVENTS, SEED_NEWSLETTERS, SEED_PAPERS } from "@/data/seed/content";
import { logAdminAction } from "@/lib/audit-log";
import { getSupabase } from "@/lib/supabase";
import { withSeedFallback } from "@/lib/supabase-fallback";
import type { MlEvent, NewsletterIssue, Paper } from "@/lib/types";

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function normalizeEvent(row: Record<string, unknown>): MlEvent {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: row.summary != null ? String(row.summary) : null,
    location: row.location != null ? String(row.location) : null,
    start_date: row.start_date != null ? String(row.start_date) : null,
    end_date: row.end_date != null ? String(row.end_date) : null,
    topics: (row.topics as string[]) ?? [],
    prep_notes: row.prep_notes != null ? String(row.prep_notes) : null,
    resources: parseJsonField(row.resources, []),
    deadlines: parseJsonField(row.deadlines, []),
    url: row.url != null ? String(row.url) : null,
    published: Boolean(row.published ?? true),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizePaper(row: Record<string, unknown>): Paper {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    authors: row.authors != null ? String(row.authors) : null,
    year: row.year != null ? Number(row.year) : null,
    arxiv_url: row.arxiv_url != null ? String(row.arxiv_url) : null,
    tags: (row.tags as string[]) ?? [],
    is_classic: Boolean(row.is_classic),
    summary: row.summary != null ? String(row.summary) : null,
    review_body: String(row.review_body),
    published: Boolean(row.published ?? true),
    published_at: String(row.published_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeNewsletter(row: Record<string, unknown>): NewsletterIssue {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    issue_number: row.issue_number != null ? Number(row.issue_number) : null,
    summary: row.summary != null ? String(row.summary) : null,
    body: String(row.body),
    published: Boolean(row.published ?? true),
    published_at: String(row.published_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function fetchEvents(): Promise<MlEvent[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("start_date", { ascending: true });
    if (!error) {
      return withSeedFallback(
        (data ?? []).map((r) => normalizeEvent(r as Record<string, unknown>)),
        SEED_EVENTS,
      );
    }
    return SEED_EVENTS;
  }
  return SEED_EVENTS;
}

export async function fetchEventBySlug(slug: string): Promise<MlEvent | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
    if (data) return normalizeEvent(data as Record<string, unknown>);
    return SEED_EVENTS.find((e) => e.slug === slug) ?? null;
  }
  return SEED_EVENTS.find((e) => e.slug === slug) ?? null;
}

export async function fetchPapers(): Promise<Paper[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (!error) {
      return withSeedFallback(
        (data ?? []).map((r) => normalizePaper(r as Record<string, unknown>)),
        SEED_PAPERS,
      );
    }
    return SEED_PAPERS;
  }
  return SEED_PAPERS;
}

export async function fetchPaperBySlug(slug: string): Promise<Paper | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.from("papers").select("*").eq("slug", slug).maybeSingle();
    if (data) return normalizePaper(data as Record<string, unknown>);
    return SEED_PAPERS.find((p) => p.slug === slug) ?? null;
  }
  return SEED_PAPERS.find((p) => p.slug === slug) ?? null;
}

export async function fetchNewsletters(): Promise<NewsletterIssue[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("newsletter_issues")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (!error) {
      return withSeedFallback(
        (data ?? []).map((r) => normalizeNewsletter(r as Record<string, unknown>)),
        SEED_NEWSLETTERS,
      );
    }
    return SEED_NEWSLETTERS;
  }
  return SEED_NEWSLETTERS;
}

export async function fetchNewsletterBySlug(slug: string): Promise<NewsletterIssue | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("newsletter_issues")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return normalizeNewsletter(data as Record<string, unknown>);
    return SEED_NEWSLETTERS.find((n) => n.slug === slug) ?? null;
  }
  return SEED_NEWSLETTERS.find((n) => n.slug === slug) ?? null;
}

// Admin: fetch all including unpublished
export async function fetchAllEventsAdmin(): Promise<MlEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return SEED_EVENTS;
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });
  return data?.length ? data.map((r) => normalizeEvent(r as Record<string, unknown>)) : [];
}

export async function fetchAllPapersAdmin(): Promise<Paper[]> {
  const supabase = getSupabase();
  if (!supabase) return SEED_PAPERS;
  const { data } = await supabase
    .from("papers")
    .select("*")
    .order("published_at", { ascending: false });
  return data?.length ? data.map((r) => normalizePaper(r as Record<string, unknown>)) : [];
}

export async function fetchAllNewslettersAdmin(): Promise<NewsletterIssue[]> {
  const supabase = getSupabase();
  if (!supabase) return SEED_NEWSLETTERS;
  const { data } = await supabase
    .from("newsletter_issues")
    .select("*")
    .order("published_at", { ascending: false });
  return data?.length ? data.map((r) => normalizeNewsletter(r as Record<string, unknown>)) : [];
}

export function relatedEvents(event: MlEvent, all: MlEvent[], limit = 3): MlEvent[] {
  const topics = new Set(event.topics.map((t) => t.toLowerCase()));
  return all
    .filter((e) => e.id !== event.id && e.published)
    .map((e) => ({
      event: e,
      score: e.topics.filter((t) => topics.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.event);
}

async function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase)
    return { supabase: null as ReturnType<typeof getSupabase>, error: "Supabase required." };
  return { supabase, error: null as string | null };
}

export async function setContentPublished(
  table: "events" | "papers" | "newsletter_issues",
  id: string,
  published: boolean,
  actorId?: string,
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSupabase();
  if (!supabase) return { error };
  const { error: err } = await supabase
    .from(table)
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (!err && actorId) {
    await logAdminAction(actorId, published ? "content.publish" : "content.unpublish", {
      targetType: table,
      targetId: id,
    });
  }
  return { error: err?.message ?? null };
}

export async function deleteContentRow(
  table: "events" | "papers" | "newsletter_issues",
  id: string,
  actorId?: string,
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSupabase();
  if (!supabase) return { error };
  const { error: err } = await supabase.from(table).delete().eq("id", id);
  if (!err && actorId) {
    await logAdminAction(actorId, "content.delete", { targetType: table, targetId: id });
  }
  return { error: err?.message ?? null };
}

export async function updateEventAdmin(
  id: string,
  patch: Partial<{
    title: string;
    summary: string | null;
    topics: string[];
    prep_notes: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    url: string | null;
    deadlines: { label: string; date: string }[];
    resources: { label: string; url: string; kind?: string }[];
    published: boolean;
  }>,
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSupabase();
  if (!supabase) return { error };
  const { error: err } = await supabase
    .from("events")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: err?.message ?? null };
}

export async function updatePaperAdmin(
  id: string,
  patch: Partial<{
    title: string;
    authors: string | null;
    review_body: string;
    summary: string | null;
    tags: string[];
    is_classic: boolean;
    arxiv_url: string | null;
    published: boolean;
  }>,
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSupabase();
  if (!supabase) return { error };
  const { error: err } = await supabase
    .from("papers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: err?.message ?? null };
}

export async function updateNewsletterAdmin(
  id: string,
  patch: Partial<{
    title: string;
    body: string;
    summary: string | null;
    issue_number: number | null;
    published: boolean;
  }>,
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSupabase();
  if (!supabase) return { error };
  const { error: err } = await supabase
    .from("newsletter_issues")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: err?.message ?? null };
}
