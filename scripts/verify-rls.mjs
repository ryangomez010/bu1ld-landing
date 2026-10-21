#!/usr/bin/env node
// Read-only schema, migration, function-presence, and RLS-flag checks.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { databaseConnection, loadDeploymentEnv } from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = loadDeploymentEnv(root);
let connection;
try {
  connection = databaseConnection(env);
} catch {
  console.error("Invalid SUPABASE_DB_URL; use the project's dashboard connection string.");
  process.exit(1);
}
if (!connection) {
  console.error(
    "Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF. For IPv4, use the project's explicit pooler connection URL.",
  );
  process.exit(1);
}
const sql = postgres(connection, {
  ssl: {
    rejectUnauthorized: true,
    ...(env.SUPABASE_DB_CA_FILE
      ? { ca: readFileSync(resolve(root, env.SUPABASE_DB_CA_FILE), "utf8") }
      : {}),
  },
  max: 1,
  prepare: false,
  connect_timeout: 10,
  connection: { statement_timeout: 15000, default_transaction_read_only: "on" },
});
try {
  const rows = await sql.unsafe(readFileSync(resolve(root, "supabase/VERIFY_SETUP.sql"), "utf8"));
  if (!rows.length) throw new Error("Empty verification result");
  for (const row of rows) {
    console.log(`${row.status === "ok" ? "OK" : "FAILED"} ${row.check_name}: ${row.status}`);
    if (row.status !== "ok") process.exitCode = 1;
  }
  if (!process.exitCode)
    console.log(
      "Schema and RLS flags verified. This does not establish owner/other-member/admin policy behavior; run the live role QA checklist.",
    );
} catch {
  console.error(
    "Schema verification failed. Check connectivity, the configured project, and applied migrations in the database console. No schema was changed.",
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
