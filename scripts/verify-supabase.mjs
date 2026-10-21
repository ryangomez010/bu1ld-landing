#!/usr/bin/env node
// Bounded anonymous API probes. Private tables use the database verifier.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDeploymentEnv, publicConfigErrors, publicSupabaseConfig } from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = loadDeploymentEnv(root);
const errors = publicConfigErrors(env, env.BU1LD_RELEASE_STRICT === "1");
if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}
const { url, key } = publicSupabaseConfig(env);
for (const [label, path] of [
  ["Auth settings API", "/auth/v1/settings"],
  ["Public project catalog API", "/rest/v1/projects?select=id&published=eq.true&limit=0"],
]) {
  try {
    const response = await fetch(new URL(path, url), {
      headers: { apikey: key, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.json();
    console.log(`OK ${label}`);
  } catch (error) {
    const status = /^HTTP [0-9]+$/.test(error.message)
      ? error.message
      : "network, timeout, or invalid response";
    console.error(`FAILED ${label}: ${status}`);
    process.exitCode = 1;
  }
}
if (!process.exitCode)
  console.log(
    "Anonymous APIs reachable. Run supabase:rls for schema checks; signed-in role journeys require separate verification.",
  );
