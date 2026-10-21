// Local disposable database only. No production fallback or deployment-env loading.
import { readFileSync } from "node:fs";
import postgres from "postgres";
let url;
try {
  url = new URL(process.env.BU1LD_MEMBER_TEST_DATABASE_URL ?? "");
} catch {
  /* denied below */
}
if (
  !url ||
  !["postgres:", "postgresql:"].includes(url.protocol) ||
  !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
  process.env.BU1LD_DISPOSABLE_DATABASE !== "yes"
) {
  console.error(
    "BLOCKED: use a disposable local Supabase database with phase40 applied, BU1LD_MEMBER_TEST_DATABASE_URL, and BU1LD_DISPOSABLE_DATABASE=yes. No database was contacted.",
  );
  process.exit(1);
}
const db = postgres(url.href, {
  max: 1,
  prepare: false,
  connect_timeout: 5,
  connection: { statement_timeout: 15000 },
});
try {
  await db.unsafe(
    readFileSync(new URL("../supabase/TEST_MEMBER_FEATURES.sql", import.meta.url), "utf8"),
  );
  console.log(
    "PASS: anonymous denial, pair isolation, mentor upsert and revocation, immutable request content, decision transitions, moderation and hidden-parent visibility. All fixtures rolled back. Hosted role/browser QA remains separate.",
  );
} catch (error) {
  console.error(`FAIL: local member feature contract: ${error.message}`);
  process.exitCode = 1;
} finally {
  try {
    await db.unsafe("rollback");
  } catch {
    /* connection may already be closed */
  }
  await db.end({ timeout: 5 });
}
