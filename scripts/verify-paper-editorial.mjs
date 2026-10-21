#!/usr/bin/env node
// Explicit staging-only, rollback-only workflow integration. Never invoked by build/test.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import {
  databaseConnection,
  databaseIdentityErrors,
  loadDeploymentEnv,
} from "./deployment-env.mjs";

if (!process.argv.includes("--staging")) {
  console.error(
    "Select a staging project, then pass --staging to run rollback-only editorial scenarios. No connection opened.",
  );
  process.exit(1);
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = loadDeploymentEnv(root);
let connection;
try {
  if (databaseIdentityErrors(env).length) throw new Error("Project mismatch");
  connection = databaseConnection(env);
  if (!connection) throw new Error("Missing database");
} catch {
  console.error(
    "Configure matching staging Supabase public and database identities. No connection opened.",
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
  connection: { statement_timeout: 15000, idle_in_transaction_session_timeout: 15000 },
});
let session;
try {
  session = await sql.reserve();
  await session.unsafe(readFileSync(resolve(root, "supabase/VERIFY_PAPER_EDITORIAL.sql"), "utf8"));
  console.log("PASS paper editorial staging scenarios; fixture transaction rolled back.");
} catch (error) {
  if (session) {
    try {
      await session.unsafe("rollback");
    } catch {
      /* Closing the connection also aborts its transaction. */
    }
  }
  const message =
    typeof error?.message === "string" && /^(FAIL |Staging fixtures require)/.test(error.message)
      ? error.message
      : "Database scenario failed; inspect the staging migration and role setup.";
  console.error(message);
  process.exitCode = 1;
} finally {
  if (session) session.release();
  await sql.end({ timeout: 5 });
}
