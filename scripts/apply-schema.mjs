#!/usr/bin/env node
/**
 * Apply supabase/full-setup.sql via direct Postgres connection.
 * Requires SUPABASE_DB_PASSWORD in .env (Database password from Supabase dashboard).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const password = env.SUPABASE_DB_PASSWORD;

if (!ref) {
  console.error("Could not parse project ref from VITE_SUPABASE_URL");
  process.exit(1);
}

if (!password) {
  console.error(
    "Set SUPABASE_DB_PASSWORD in .env (Supabase → Project Settings → Database → password)",
  );
  console.error("Then run: bun run supabase:apply");
  process.exit(1);
}

const sqlFiles = [
  "supabase/full-setup.sql",
  "supabase/phase19.sql",
  "supabase/phase20.sql",
  "supabase/phase21.sql",
  "supabase/phase22.sql",
  "supabase/phase23.sql",
];
const sql = sqlFiles.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n\n");

const connectionString =
  env.SUPABASE_DB_URL ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;

console.log(`Connecting to db.${ref}.supabase.co…`);

const db = postgres(connectionString, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);
  console.log(`Schema applied successfully (${sqlFiles.join(", ")}).`);
  console.log("\nNext: sign up in the app, then promote your user in SQL editor:");
  console.log(`  update public.profiles set role = 'admin' where id = '<your-user-uuid>';`);
} catch (err) {
  console.error("Migration failed:", err.message ?? err);
  process.exit(1);
} finally {
  await db.end({ timeout: 5 });
}
