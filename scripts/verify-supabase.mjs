#!/usr/bin/env node
/**
 * Verify Supabase connectivity and that expected tables exist.
 * Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from .env (no shell export needed).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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
const url = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.VITE_SUPABASE_ANON_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or anon key in .env");
  process.exit(1);
}

const TABLES = [
  "profiles",
  "events",
  "papers",
  "newsletter_issues",
  "reading_progress",
  "projects",
  "project_applications",
  "lead_verification_requests",
  "jobs",
  "notifications",
  "saved_items",
  "announcements",
];

const supabase = createClient(url, key);

console.log(`Project: ${url}`);
console.log("Checking tables…\n");

let missing = 0;
for (const table of TABLES) {
  const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    const code = error.code ?? error.message;
    console.log(`  ✗ ${table} — ${code}`);
    missing++;
  } else {
    console.log(`  ✓ ${table}`);
  }
}

const { error: authError } = await supabase.auth.getSession();
if (authError) {
  console.log(`\nAuth check failed: ${authError.message}`);
} else {
  console.log("\nAuth API: reachable");
}

if (missing > 0) {
  console.log(`\n${missing} table(s) missing. Run: bun run supabase:apply`);
  console.log("Or paste supabase/full-setup.sql into the Supabase SQL editor.");
  process.exit(1);
}

console.log("\nAll tables present. Supabase is ready.");
process.exit(0);
