#!/usr/bin/env node
/**
 * Verify Supabase RLS is enabled on core public tables.
 * Usage: SUPABASE_DB_PASSWORD=... node scripts/verify-rls.mjs
 */
import postgres from "postgres";

const password = process.env.SUPABASE_DB_PASSWORD;
const url = process.env.SUPABASE_DB_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;

const connection =
  url ??
  (password && projectRef
    ? `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    : null);

if (!connection) {
  console.error("Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF");
  process.exit(1);
}

const CORE_TABLES = [
  "profiles",
  "projects",
  "project_applications",
  "saved_items",
  "saved_collections",
  "notifications",
  "security_events",
  "admin_audit_log",
  "papers",
  "paper_analyses",
  "events",
  "jobs",
  "member_roles",
  "project_memberships",
  "project_milestones",
  "project_contributions",
  "programs",
  "program_applications",
  "institutional_claims",
  "labs",
  "lab_memberships",
  "competitions",
  "competition_submissions",
  "partnerships",
  "invitations",
  "project_experiments",
  "project_deliverables",
];

const sql = postgres(connection, { ssl: "require", max: 1 });

try {
  const rows = await sql`
    select c.relname as table_name, c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any(${CORE_TABLES})
    order by c.relname
  `;

  const found = new Map(rows.map((r) => [r.table_name, r.rls_enabled]));
  let failed = false;

  for (const table of CORE_TABLES) {
    if (!found.has(table)) {
      console.error(`MISSING TABLE: ${table}`);
      failed = true;
      continue;
    }
    if (!found.get(table)) {
      console.error(`RLS DISABLED: ${table}`);
      failed = true;
    } else {
      console.log(`OK  ${table} (RLS enabled)`);
    }
  }

  process.exit(failed ? 1 : 0);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end();
}
