#!/usr/bin/env node
/**
 * Export a logical backup of public schema metadata + row counts.
 * For full backups use Supabase Dashboard → Database → Backups (PITR on Pro).
 *
 * Usage: SUPABASE_DB_PASSWORD=... node scripts/backup-supabase.mjs [output-dir]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const url = process.env.SUPABASE_DB_URL;

const connection =
  url ??
  (password && projectRef
    ? `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    : null);

if (!connection) {
  console.error("Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF");
  process.exit(1);
}

const outDir = process.argv[2] ?? `backup-${new Date().toISOString().slice(0, 10)}`;
const sql = postgres(connection, { ssl: "require", max: 1 });

try {
  await mkdir(outDir, { recursive: true });

  const tables = await sql`
    select tablename from pg_tables
    where schemaname = 'public'
    order by tablename
  `;

  const manifest = {
    createdAt: new Date().toISOString(),
    tables: [] as { name: string; rowCount: number }[],
  };

  for (const { tablename } of tables) {
    const [{ count }] = await sql`select count(*)::int as count from public.${sql(tablename)}`;
    manifest.tables.push({ name: tablename, rowCount: count });
  }

  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`Wrote ${manifest.tables.length} table counts to ${outDir}/manifest.json`);
  console.log("For full data restore, use Supabase point-in-time recovery or pg_dump against your project.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end();
}
