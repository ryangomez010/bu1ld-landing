/** Server-side content fetch for cron jobs (service role REST API). */

import type { ForYouFeedSources } from "@/lib/personalization";
import type { Job, MlEvent, NewsletterIssue, Paper, Project } from "@/lib/types";

type SupabaseConfig = { url: string; key: string };

async function restSelect<T>(config: SupabaseConfig, table: string, query: string): Promise<T[]> {
  const res = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

function asString(value: unknown, fallback = ""): string {
  return value != null ? String(value) : fallback;
}

function normalizeEvent(row: Record<string, unknown>): MlEvent {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    summary: row.summary != null ? asString(row.summary) : null,
    location: row.location != null ? asString(row.location) : null,
    start_date: row.start_date != null ? asString(row.start_date) : null,
    end_date: row.end_date != null ? asString(row.end_date) : null,
    topics: (row.topics as string[]) ?? [],
    prep_notes: row.prep_notes != null ? asString(row.prep_notes) : null,
    resources: (row.resources as MlEvent["resources"]) ?? [],
    deadlines: (row.deadlines as MlEvent["deadlines"]) ?? [],
    url: row.url != null ? asString(row.url) : null,
    published: Boolean(row.published ?? true),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

function normalizePaper(row: Record<string, unknown>): Paper {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    authors: row.authors != null ? asString(row.authors) : null,
    year: row.year != null ? Number(row.year) : null,
    arxiv_url: row.arxiv_url != null ? asString(row.arxiv_url) : null,
    tags: (row.tags as string[]) ?? [],
    is_classic: Boolean(row.is_classic),
    summary: row.summary != null ? asString(row.summary) : null,
    review_body: asString(row.review_body),
    published: Boolean(row.published ?? true),
    published_at: asString(row.published_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

function normalizeProject(row: Record<string, unknown>): Project {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    description: asString(row.description),
    type: row.type as Project["type"],
    status: row.status as Project["status"],
    skills_needed: (row.skills_needed as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    lead_id: row.lead_id != null ? asString(row.lead_id) : null,
    lead_name: row.lead_name != null ? asString(row.lead_name) : null,
    capacity: Number(row.capacity ?? 5),
    team_count: Number(row.team_count ?? 0),
    published: Boolean(row.published ?? true),
    discord_url: row.discord_url != null ? asString(row.discord_url) : null,
    workspace_links: Array.isArray(row.workspace_links)
      ? (row.workspace_links as Project["workspace_links"])
      : [],
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

function normalizeJob(row: Record<string, unknown>): Job {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    company: asString(row.company),
    location: row.location != null ? asString(row.location) : null,
    source: row.source as Job["source"],
    employment_type: row.employment_type != null ? asString(row.employment_type) : null,
    description: asString(row.description),
    url: row.url != null ? asString(row.url) : null,
    tags: (row.tags as string[]) ?? [],
    published: Boolean(row.published ?? true),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

function normalizeNewsletter(row: Record<string, unknown>): NewsletterIssue {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    issue_number: row.issue_number != null ? Number(row.issue_number) : null,
    summary: row.summary != null ? asString(row.summary) : null,
    body: asString(row.body),
    published: Boolean(row.published ?? true),
    published_at: asString(row.published_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

export async function fetchDigestFeedSources(config: SupabaseConfig): Promise<ForYouFeedSources> {
  const [events, papers, projects, jobs, newsletters] = await Promise.all([
    restSelect<Record<string, unknown>>(config, "events", "select=*&published=eq.true"),
    restSelect<Record<string, unknown>>(config, "papers", "select=*&published=eq.true"),
    restSelect<Record<string, unknown>>(
      config,
      "projects",
      "select=*&published=eq.true&status=eq.open",
    ),
    restSelect<Record<string, unknown>>(config, "jobs", "select=*&published=eq.true"),
    restSelect<Record<string, unknown>>(config, "newsletter_issues", "select=*&published=eq.true"),
  ]);

  return {
    events: events.map(normalizeEvent),
    papers: papers.map(normalizePaper),
    projects: projects.map(normalizeProject),
    jobs: jobs.map(normalizeJob),
    newsletters: newsletters.map(normalizeNewsletter),
  };
}
