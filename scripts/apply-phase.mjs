#!/usr/bin/env node
/**
 * Apply a single supabase/phase*.sql file via direct Postgres connection.
 * Usage: bun run supabase:apply-phase -- phase12.sql
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phaseArg = process.argv.find((a) => a.endsWith(".sql")) ?? process.argv[2] ?? "phase11.sql";
const phaseFile = phaseArg.includes("/") ? phaseArg : `supabase/${phaseArg}`;

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
  console.error("Set SUPABASE_DB_PASSWORD in .env, then re-run.");
  console.error(`Or paste ${phaseFile} into the Supabase SQL editor.`);
  process.exit(1);
}

const sqlPath = resolve(root, phaseFile);
if (!existsSync(sqlPath)) {
  console.error(`Missing ${phaseFile}`);
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const connectionString =
  env.SUPABASE_DB_URL ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;

console.log(`Applying ${phaseFile} to db.${ref}.supabase.co…`);

const db = postgres(connectionString, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);
  console.log("Phase applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message ?? err);
  process.exit(1);
} finally {
  await db.end({ timeout: 5 });
}
