#!/usr/bin/env node
/**
 * Apply supabase/full-setup.sql via direct Postgres connection.
 * Requires the matching public Supabase URL and database connection in the deployment environment.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import {
  loadDeploymentEnv,
  databaseConnection,
  databaseIdentityErrors,
} from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const sqlFiles = [
  "supabase/full-setup.sql",
  "supabase/phase19.sql",
  "supabase/phase20.sql",
  "supabase/phase21.sql",
  "supabase/phase22.sql",
  "supabase/phase23.sql",
  "supabase/phase24.sql",
  "supabase/phase25.sql",
  "supabase/phase26.sql",
  "supabase/phase27.sql",
  "supabase/phase28.sql",
  "supabase/phase29.sql",
  "supabase/phase30.sql",
  "supabase/phase31.sql",
  "supabase/phase32.sql",
  "supabase/phase33.sql",
  "supabase/phase34.sql",
  "supabase/phase35.sql",
  "supabase/phase36.sql",
  "supabase/phase37.sql",
  "supabase/phase38.sql",
  "supabase/phase39.sql",
  "supabase/phase40.sql",
];
const sql = sqlFiles.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n\n");

console.log("Applying the complete schema chain to the configured Supabase project…");

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
  console.log(`Schema applied successfully (${sqlFiles.join(", ")}).`);
  console.log("\nNext: sign up in the app, then promote your user in SQL editor:");
  console.log(`  update public.profiles set role = 'admin' where id = '<your-user-uuid>';`);
} catch (err) {
  console.error(
    "Migration failed. Inspect the database console for the failing migration before retrying; do not assume the full chain was applied.",
  );
  process.exitCode = 1;
} finally {
  await db.end({ timeout: 5 });
}
