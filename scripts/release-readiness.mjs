#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readEnvFile() {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
      }),
  );
}

function readWranglerVars() {
  const path = resolve(root, "wrangler.jsonc");
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  const result = {};
  for (const key of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
    const match = raw.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
    if (match) result[key] = match[1];
  }
  return result;
}

function run(label, command, args) {
  console.log(`\n[${label}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const env = { ...readWranglerVars(), ...readEnvFile(), ...process.env };
const manual = [];
const failures = [];

if (!env.VITE_SUPABASE_URL) failures.push("Set VITE_SUPABASE_URL in the deployment environment.");
if (!env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  failures.push("Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.");
}
if (!env.SUPABASE_DB_PASSWORD && !env.SUPABASE_DB_URL) {
  manual.push("Add SUPABASE_DB_PASSWORD or SUPABASE_DB_URL locally, then run bun run supabase:apply.");
}
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  manual.push("Set SUPABASE_SERVICE_ROLE_KEY only in the server runtime for email recipient lookup and account deletion.");
}
if (!env.RESEND_API_KEY) manual.push("Set RESEND_API_KEY in the server runtime to enable transactional email and digests.");
if (!env.DIGEST_API_SECRET) manual.push("Set DIGEST_API_SECRET and configure the daily digest cron.");
if (!env.VITE_EMAIL_ENDPOINT) manual.push("Set VITE_EMAIL_ENDPOINT to the deployed same-origin or trusted email handler.");

for (const unsafe of ["VITE_SUPABASE_SERVICE_ROLE_KEY", "VITE_RESEND_API_KEY", "VITE_DIGEST_API_SECRET"]) {
  if (env[unsafe]) failures.push(`Remove ${unsafe}; server secrets must never use a VITE_ prefix.`);
}

for (const phase of ["phase19.sql", "phase20.sql", "phase21.sql", "phase22.sql"]) {
  if (!existsSync(resolve(root, "supabase", phase))) failures.push(`Missing required migration supabase/${phase}.`);
}

if (failures.length) {
  console.error("\nRelease configuration blockers:");
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

run("types", "bun", ["run", "typecheck"]);
run("tests", "bun", ["test", "src/lib/*.test.ts"]);
run("lint", "bun", ["run", "lint"]);
run("build", "bun", ["run", "build"]);

console.log("\nCode release checks passed.");
if (manual.length) {
  console.log("\nManual production actions:");
  manual.forEach((item) => console.log(`  - ${item}`));
} else {
  console.log("No manual environment actions detected.");
}
