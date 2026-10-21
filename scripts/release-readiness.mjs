#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  loadDeploymentEnv,
  publicConfigErrors,
  databaseConnection,
  databaseIdentityErrors,
} from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, command, args) {
  console.log(`\n[${label}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function collectFiles(path) {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  if (!stat.isDirectory()) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(path, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
}

function assertNoMatches(label, paths, patterns) {
  const matches = [];
  for (const filePath of paths.flatMap((path) => collectFiles(path))) {
    if (!/\.(ts|tsx|js|jsx|mjs|md|sql|jsonc?)$/.test(filePath)) continue;
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(text)) matches.push(`${filePath.replace(`${root}/`, "")}: ${pattern}`);
    }
  }
  if (matches.length) {
    console.error(`\n${label}:`);
    matches.forEach((match) => console.error(`  - ${match}`));
    process.exit(1);
  }
}

const env = loadDeploymentEnv(root);
const strict = env.BU1LD_RELEASE_STRICT === "1";
const failures = publicConfigErrors(env, strict);
if (strict) {
  try {
    if (!databaseConnection(env))
      failures.push(
        "Set SUPABASE_DB_URL or both SUPABASE_DB_PASSWORD and SUPABASE_PROJECT_REF for schema verification.",
      );
    else failures.push(...databaseIdentityErrors(env));
  } catch {
    failures.push("Set a valid SUPABASE_DB_URL from the project's dashboard.");
  }
}
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  if (strict) {
    failures.push(
      "Set SUPABASE_SERVICE_ROLE_KEY only in the server runtime for email recipient lookup and account deletion.",
    );
  }
}
if (!env.RESEND_API_KEY && strict) {
  failures.push(
    "Set RESEND_API_KEY in the server runtime to enable transactional email and digests.",
  );
}
if (!env.DIGEST_API_SECRET && strict) {
  failures.push("Set DIGEST_API_SECRET for the daily digest endpoint.");
}
if (!env.VITE_EMAIL_ENDPOINT && strict) {
  failures.push("Set VITE_EMAIL_ENDPOINT to the deployed same-origin or trusted email handler.");
}
if (strict) {
  let siteOrigin;
  try {
    const siteUrl = new URL(env.BU1LD_SITE_ORIGIN || "https://thebu1ld.com");
    if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password) throw new Error();
    siteOrigin = siteUrl.origin;
  } catch {
    failures.push("Set BU1LD_SITE_ORIGIN to a valid HTTPS origin.");
  }
  for (const name of ["VITE_EMAIL_ENDPOINT", "VITE_ACCOUNT_DELETION_ENDPOINT"]) {
    const endpoint = env[name];
    if (!endpoint || (endpoint.startsWith("/") && !endpoint.startsWith("//"))) continue;
    try {
      const parsed = new URL(endpoint);
      if (parsed.protocol !== "https:" || parsed.origin !== siteOrigin) {
        failures.push(`${name} receives bearer tokens and must use the production site origin.`);
      }
    } catch {
      failures.push(`${name} must be a same-origin path or production HTTPS URL.`);
    }
  }
}

for (const unsafe of [
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_RESEND_API_KEY",
  "VITE_EMAIL_API_SECRET",
  "VITE_DIGEST_API_SECRET",
]) {
  if (env[unsafe]) failures.push(`Remove ${unsafe}; server secrets must never use a VITE_ prefix.`);
}

for (const phase of [
  "phase19.sql",
  "phase20.sql",
  "phase21.sql",
  "phase22.sql",
  "phase23.sql",
  "phase24.sql",
  "phase25.sql",
  "phase26.sql",
  "phase27.sql",
  "phase28.sql",
  "phase29.sql",
  "phase30.sql",
  "phase31.sql",
  "phase32.sql",
  "phase33.sql",
  "phase34.sql",
  "phase35.sql",
  "phase36.sql",
  "phase37.sql",
  "phase38.sql",
  "phase39.sql",
  "phase40.sql",
]) {
  if (!existsSync(resolve(root, "supabase", phase)))
    failures.push(`Missing required migration supabase/${phase}.`);
}

for (const artifact of [
  "supabase/FINAL_SETUP.sql",
  "supabase/VERIFY_SETUP.sql",
  "FINAL_COMPLETION_REPORT.md",
  "SECURITY_AUDIT.md",
  "DATABASE_SETUP.md",
  "DEPLOYMENT.md",
  "REMAINING_EXTERNAL_ACTIONS.md",
  "TEST_REPORT.md",
]) {
  if (!existsSync(resolve(root, artifact)))
    failures.push(`Missing required release artifact ${artifact}.`);
}

assertNoMatches(
  "Release copy blockers",
  [
    resolve(root, "src"),
    resolve(root, "README.md"),
    resolve(root, "supabase/phase22.sql"),
    resolve(root, "supabase/seed-data.sql"),
    resolve(root, "supabase/FINAL_SETUP.sql"),
  ],
  [
    /Generate draft/i,
    /coming soon/i,
    /lorem ipsum/i,
    /\bTODO\b/,
    /\bTBD\b/i,
    /sample issue/i,
    /not implemented/i,
  ],
);

assertNoMatches(
  "Unsupported public claim blockers",
  [
    resolve(root, "src/data/seed"),
    resolve(root, "supabase/seed-data.sql"),
    resolve(root, "supabase/FINAL_SETUP.sql"),
  ],
  [
    /\bMIT\b/,
    /\bStanford\b/,
    /\bUC Physics\b/i,
    /\bpaying (customers|teams|users)\b/i,
    /\bspun out\b/i,
    /\bA100\b/,
    /\bunder \d+ hours?\b/i,
  ],
);

assertNoMatches(
  "Production UI copy blockers",
  [resolve(root, "src")],
  [
    /Supabase is not configured yet/i,
    /Supabase is not configured/i,
    /Add Supabase env vars/i,
    /Copy\s+.*\.env\.example/i,
    /role\s*=\s*['"]admin['"]/i,
    /phase\d+\.sql/i,
    /Supabase required/i,
    /Connect Supabase/i,
  ],
);

const phase22 = resolve(root, "supabase/phase22.sql");
if (existsSync(phase22)) {
  const sql = readFileSync(phase22, "utf8");
  for (const signature of [
    "review_project_contribution(uuid, text, text)",
    "resubmit_project_contribution(uuid)",
    "set_project_membership_status(uuid, uuid, text)",
    "review_institutional_claim(uuid, text)",
  ]) {
    if (!sql.includes(`revoke all on function public.${signature} from public`)) {
      failures.push(`phase22.sql must revoke PUBLIC execution on ${signature}.`);
    }
    if (!sql.includes(`grant execute on function public.${signature} to authenticated`)) {
      failures.push(`phase22.sql must grant authenticated execution on ${signature}.`);
    }
  }
}

const phase32 = resolve(root, "supabase/phase32.sql");
if (existsSync(phase32)) {
  const sql = readFileSync(phase32, "utf8");
  for (const invariant of [
    "Contributors cannot review their own submissions",
    "Contributors cannot be assigned as reviewers of their own submissions",
    "set search_path = public",
    "values ('phase32')",
  ]) {
    if (!sql.includes(invariant)) {
      failures.push(`phase32.sql is missing required invariant: ${invariant}.`);
    }
  }
}

const phase33 = resolve(root, "supabase/phase33.sql");
if (existsSync(phase33)) {
  const sql = readFileSync(phase33, "utf8");
  for (const invariant of [
    "create or replace function public.submit_project_application",
    "for update",
    "Answer every required application question",
    "revoke insert on table public.project_applications from authenticated",
    "revoke all on function public.submit_project_application(uuid, text, jsonb) from public",
    "values ('phase33')",
  ]) {
    if (!sql.includes(invariant)) {
      failures.push(`phase33.sql is missing required invariant: ${invariant}.`);
    }
  }
}

const phase34 = resolve(root, "supabase/phase34.sql");
if (existsSync(phase34)) {
  const sql = readFileSync(phase34, "utf8");
  for (const invariant of [
    "create or replace function public.is_project_collaborator",
    "security definer",
    "pm.user_id = (select auth.uid())",
    "pm.status in ('active', 'paused')",
    "or public.is_project_collaborator(id)",
    "revoke all on function public.is_project_collaborator(uuid) from public",
    "values ('phase34')",
  ]) {
    if (!sql.includes(invariant)) {
      failures.push(`phase34.sql is missing required invariant: ${invariant}.`);
    }
  }
}

const phase37 = resolve(root, "supabase/phase37.sql");
if (existsSync(phase37)) {
  const sql = readFileSync(phase37, "utf8");
  for (const invariant of [
    "caller_id = (select auth.uid())",
    "uid = (select auth.uid())",
    "revoke all on function public.can_notify_project_subscriber(uuid, uuid, uuid)",
    "from public, anon, authenticated",
    "values ('phase37')",
  ]) {
    if (!sql.includes(invariant)) {
      failures.push(`phase37.sql is missing required invariant: ${invariant}.`);
    }
  }
}

const phase38 = resolve(root, "supabase/phase38.sql");
if (existsSync(phase38)) {
  const sql = readFileSync(phase38, "utf8");
  for (const invariant of [
    "notifications_safe_href_check",
    "href not like '//%'",
    "revoke all on function public.handle_new_user()",
    "values ('phase38')",
  ]) {
    if (!sql.includes(invariant)) {
      failures.push(`phase38.sql is missing required invariant: ${invariant}.`);
    }
  }
}

const phase39 = resolve(root, "supabase/phase39.sql");
if (existsSync(phase39)) {
  const sql = readFileSync(phase39, "utf8");
  for (const invariant of [
    "create table if not exists public.mentor_profiles",
    "alter table public.mentorship_requests enable row level security",
    "create table if not exists public.community_channels",
    "alter table public.community_posts enable row level security",
    "values ('phase39')",
  ]) {
    if (!sql.includes(invariant))
      failures.push(`phase39.sql is missing required invariant: ${invariant}.`);
  }
}

run("schema bundle", "bun", ["run", "schema:check"]);
run("public sitemap", "bun", ["run", "sitemap:check"]);
run("public portfolio manifest", "bun", ["run", "manifest:check"]);
run("ML article catalog", "bun", ["run", "guides:check"]);
run("route smoke", "bun", ["run", "smoke"]);

if (failures.length) {
  console.error("\nRelease configuration blockers:");
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

run("types", "bun", ["run", "typecheck"]);
run("tests", "bun", ["run", "test"]);
run("lint", "bun", ["run", "lint"]);
run("build", "bun", ["run", "build"]);
if (strict) {
  run("supabase API connectivity", "bun", ["run", "supabase:verify"]);
  run("supabase schema and RLS flags", "bun", ["run", "supabase:rls"]);
}

console.log("\nCode release checks passed.");
console.log(
  strict
    ? "Configured APIs, schema presence, and RLS flags passed. Complete live role, email, account-deletion, and browser QA before declaring production acceptance."
    : "Run BU1LD_RELEASE_STRICT=1 bun run release:check in the deployment environment before release.",
);
