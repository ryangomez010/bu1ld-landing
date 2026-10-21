#!/usr/bin/env node
/**
 * Apply a single supabase/phase*.sql file via direct Postgres connection.
 * Usage: bun run supabase:apply-phase -- phase12.sql
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import {
  loadDeploymentEnv,
  databaseConnection,
  databaseIdentityErrors,
} from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phaseArg = process.argv.find((a) => /^phase[0-9]+\.sql$/.test(a));
if (!phaseArg) {
  console.error("Specify the migration explicitly: bun run supabase:apply-phase -- phase36.sql");
  process.exit(1);
}
const phaseFile = `supabase/${phaseArg}`;

const env = loadDeploymentEnv(root);
let connectionString;
try {
  connectionString = databaseConnection(env);
  const errors = databaseIdentityErrors(env);
  if (errors.length) throw new Error("Project identity mismatch");
} catch {
  console.error(
    "Configure VITE_SUPABASE_URL and SUPABASE_DB_URL (or database password + project ref) for the same project. No schema was changed.",
  );
  process.exit(1);
}

const sqlPath = resolve(root, phaseFile);
if (!existsSync(sqlPath)) {
  console.error(`Missing ${phaseFile}`);
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
console.log(`Applying ${phaseFile} to the configured Supabase project…`);

const db = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: true,
    ...(env.SUPABASE_DB_CA_FILE
      ? { ca: readFileSync(resolve(root, env.SUPABASE_DB_CA_FILE), "utf8") }
      : {}),
  },
  max: 1,
  prepare: false,
  connect_timeout: 10,
});

try {
  await db.unsafe(sql);
  console.log("Phase applied successfully.");
} catch (err) {
  console.error(
    "Migration failed. Inspect the database console for the failing migration before retrying; do not assume the full chain was applied.",
  );
  process.exitCode = 1;
} finally {
  await db.end({ timeout: 5 });
}
