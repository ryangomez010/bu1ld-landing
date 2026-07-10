/**
 * Seed Supabase with BUILD demo content from src/data/seed/*.
 *
 * Usage:
 *   bun run supabase:seed              — insert via service role or DB password
 *   bun run supabase:seed --sql-only   — print SQL (paste into Supabase SQL editor)
 *
 * Requires one of:
 *   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role)
 *   SUPABASE_DB_PASSWORD       (Settings → Database)
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

import { SEED_EVENTS, SEED_NEWSLETTERS, SEED_PAPERS } from "../src/data/seed/content";
import { SEED_JOBS, SEED_PROJECTS } from "../src/data/seed/projects";
import { SEED_ANNOUNCEMENTS } from "../src/data/seed/announcements";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sqlOnly = process.argv.includes("--sql-only");

function loadEnv(): Record<string, string> {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function buildSql(): string {
  const lines: string[] = [
    "-- BUILD platform seed data (idempotent — safe to re-run)",
    "BEGIN;",
    "",
  ];

  for (const e of SEED_EVENTS) {
    lines.push(
      `INSERT INTO public.events (slug, title, summary, location, start_date, end_date, topics, prep_notes, resources, deadlines, url, published)
VALUES (
  '${sqlEscape(e.slug)}',
  '${sqlEscape(e.title)}',
  ${e.summary ? `'${sqlEscape(e.summary)}'` : "NULL"},
  ${e.location ? `'${sqlEscape(e.location)}'` : "NULL"},
  ${e.start_date ? `'${e.start_date}'` : "NULL"},
  ${e.end_date ? `'${e.end_date}'` : "NULL"},
  ARRAY[${e.topics.map((t) => `'${sqlEscape(t)}'`).join(", ")}]::text[],
  ${e.prep_notes ? `'${sqlEscape(e.prep_notes)}'` : "NULL"},
  '${sqlEscape(JSON.stringify(e.resources))}'::jsonb,
  '${sqlEscape(JSON.stringify(e.deadlines))}'::jsonb,
  ${e.url ? `'${sqlEscape(e.url)}'` : "NULL"},
  ${e.published}
) ON CONFLICT (slug) DO NOTHING;`,
      "",
    );
  }

  for (const p of SEED_PAPERS) {
    lines.push(
      `INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  '${sqlEscape(p.slug)}',
  '${sqlEscape(p.title)}',
  ${p.authors ? `'${sqlEscape(p.authors)}'` : "NULL"},
  ${p.year ?? "NULL"},
  ${p.arxiv_url ? `'${sqlEscape(p.arxiv_url)}'` : "NULL"},
  ARRAY[${p.tags.map((t) => `'${sqlEscape(t)}'`).join(", ")}]::text[],
  ${p.is_classic},
  ${p.summary ? `'${sqlEscape(p.summary)}'` : "NULL"},
  '${sqlEscape(p.review_body)}',
  ${p.published},
  '${p.published_at}'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();`,
      "",
    );
  }

  for (const n of SEED_NEWSLETTERS) {
    lines.push(
      `INSERT INTO public.newsletter_issues (slug, title, issue_number, summary, body, published, published_at)
VALUES (
  '${sqlEscape(n.slug)}',
  '${sqlEscape(n.title)}',
  ${n.issue_number ?? "NULL"},
  ${n.summary ? `'${sqlEscape(n.summary)}'` : "NULL"},
  '${sqlEscape(n.body)}',
  ${n.published},
  '${n.published_at}'
) ON CONFLICT (slug) DO NOTHING;`,
      "",
    );
  }

  for (const p of SEED_PROJECTS) {
    lines.push(
      `INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  '${sqlEscape(p.slug)}',
  '${sqlEscape(p.title)}',
  '${sqlEscape(p.description)}',
  '${p.type}',
  '${p.status}',
  ARRAY[${p.skills_needed.map((t) => `'${sqlEscape(t)}'`).join(", ")}]::text[],
  ARRAY[${p.tags.map((t) => `'${sqlEscape(t)}'`).join(", ")}]::text[],
  ${p.lead_name ? `'${sqlEscape(p.lead_name)}'` : "NULL"},
  ${p.capacity},
  ${p.team_count},
  ${p.published},
  ${p.discord_url ? `'${sqlEscape(p.discord_url)}'` : "NULL"}
) ON CONFLICT (slug) DO NOTHING;`,
      "",
    );
  }

  for (const j of SEED_JOBS) {
    lines.push(
      `INSERT INTO public.jobs (slug, title, company, location, source, employment_type, description, url, tags, published)
VALUES (
  '${sqlEscape(j.slug)}',
  '${sqlEscape(j.title)}',
  '${sqlEscape(j.company)}',
  ${j.location ? `'${sqlEscape(j.location)}'` : "NULL"},
  '${j.source}',
  ${j.employment_type ? `'${sqlEscape(j.employment_type)}'` : "NULL"},
  '${sqlEscape(j.description)}',
  ${j.url ? `'${sqlEscape(j.url)}'` : "NULL"},
  ARRAY[${j.tags.map((t) => `'${sqlEscape(t)}'`).join(", ")}]::text[],
  ${j.published}
) ON CONFLICT (slug) DO NOTHING;`,
      "",
    );
  }

  for (const a of SEED_ANNOUNCEMENTS) {
    lines.push(
      `INSERT INTO public.announcements (title, body, href, pinned, published, created_at)
SELECT
  '${sqlEscape(a.title)}',
  '${sqlEscape(a.body)}',
  ${a.href ? `'${sqlEscape(a.href)}'` : "NULL"},
  ${a.pinned},
  ${a.published},
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = '${sqlEscape(a.title)}'
);`,
      "",
    );
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

async function seedViaServiceRole(url: string, key: string) {
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { error: e1 } = await sb.from("events").upsert(
    SEED_EVENTS.map((e) => ({
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      location: e.location,
      start_date: e.start_date,
      end_date: e.end_date,
      topics: e.topics,
      prep_notes: e.prep_notes,
      resources: e.resources,
      deadlines: e.deadlines,
      url: e.url,
      published: e.published,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (e1) throw e1;

  const { error: e2 } = await sb.from("papers").upsert(
    SEED_PAPERS.map((p) => ({
      slug: p.slug,
      title: p.title,
      authors: p.authors,
      year: p.year,
      arxiv_url: p.arxiv_url,
      tags: p.tags,
      is_classic: p.is_classic,
      summary: p.summary,
      review_body: p.review_body,
      published: p.published,
      published_at: p.published_at,
    })),
    { onConflict: "slug" },
  );
  if (e2) throw e2;

  const { error: e3 } = await sb.from("newsletter_issues").upsert(
    SEED_NEWSLETTERS.map((n) => ({
      slug: n.slug,
      title: n.title,
      issue_number: n.issue_number,
      summary: n.summary,
      body: n.body,
      published: n.published,
      published_at: n.published_at,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (e3) throw e3;

  const { error: e4 } = await sb.from("projects").upsert(
    SEED_PROJECTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      type: p.type,
      status: p.status,
      skills_needed: p.skills_needed,
      tags: p.tags,
      lead_name: p.lead_name,
      capacity: p.capacity,
      team_count: p.team_count,
      published: p.published,
      discord_url: p.discord_url ?? null,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (e4) throw e4;

  const { error: e5 } = await sb.from("jobs").upsert(
    SEED_JOBS.map((j) => ({
      slug: j.slug,
      title: j.title,
      company: j.company,
      location: j.location,
      source: j.source,
      employment_type: j.employment_type,
      description: j.description,
      url: j.url,
      tags: j.tags,
      published: j.published,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (e5) throw e5;

  for (const a of SEED_ANNOUNCEMENTS) {
    const { data: existing } = await sb
      .from("announcements")
      .select("id")
      .eq("title", a.title)
      .maybeSingle();
    if (!existing) {
      const { error } = await sb.from("announcements").insert({
        title: a.title,
        body: a.body,
        href: a.href,
        pinned: a.pinned,
        published: a.published,
      });
      if (error) throw error;
    }
  }
}

async function seedViaPostgres(connectionString: string) {
  const sql = buildSql();
  const db = postgres(connectionString, { ssl: "require", max: 1 });
  try {
    await db.unsafe(sql);
  } finally {
    await db.end({ timeout: 5 });
  }
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = env.SUPABASE_DB_PASSWORD;

const sql = buildSql();
const sqlPath = resolve(root, "supabase/seed-data.sql");
writeFileSync(sqlPath, sql, "utf8");

if (sqlOnly) {
  console.log(sql);
  process.exit(0);
}

console.log(`Wrote ${sqlPath}`);

try {
  if (serviceRole && url) {
    console.log("Seeding via service role…");
    await seedViaServiceRole(url, serviceRole);
    console.log("Seed complete.");
    process.exit(0);
  }

  if (dbPassword && ref) {
    const connectionString =
      env.SUPABASE_DB_URL ??
      `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${ref}.supabase.co:5432/postgres`;
    console.log(`Seeding via Postgres (db.${ref}.supabase.co)…`);
    await seedViaPostgres(connectionString);
    console.log("Seed complete.");
    process.exit(0);
  }

  console.error(
    "No SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_PASSWORD in .env.\n" +
      "Paste supabase/seed-data.sql into the Supabase SQL editor, or add credentials and re-run.",
  );
  process.exit(1);
} catch (err) {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  console.error("Fallback: paste supabase/seed-data.sql into the Supabase SQL editor.");
  process.exit(1);
}
