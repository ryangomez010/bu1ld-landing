#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
        return [
          line.slice(0, index).trim(),
          line
            .slice(index + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}

function readWranglerVars() {
  const path = resolve(root, "wrangler.jsonc");
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  const result = {};
  for (const key of [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ]) {
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

const env = { ...readWranglerVars(), ...readEnvFile(), ...process.env };
const failures = [];
const strict = env.BU1LD_RELEASE_STRICT === "1" || env.CI === "true";

if (!env.VITE_SUPABASE_URL) failures.push("Set VITE_SUPABASE_URL in the deployment environment.");
if (!env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  failures.push("Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.");
}
if (!env.SUPABASE_DB_PASSWORD && !env.SUPABASE_DB_URL) {
  if (strict) {
    failures.push(
      "Set SUPABASE_DB_PASSWORD or SUPABASE_DB_URL so production schema and RLS can be verified.",
    );
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

for (const unsafe of [
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_RESEND_API_KEY",
  "VITE_DIGEST_API_SECRET",
]) {
  if (env[unsafe]) failures.push(`Remove ${unsafe}; server secrets must never use a VITE_ prefix.`);
}

for (const phase of ["phase19.sql", "phase20.sql", "phase21.sql", "phase22.sql", "phase23.sql"]) {
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
    /phase2\.sql/i,
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
  run("supabase schema", "bun", ["run", "supabase:verify"]);
  run("supabase rls", "bun", ["run", "supabase:rls"]);
}

console.log("\nCode release checks passed.");
console.log(
  strict
    ? "Production environment checks passed."
    : "Run BU1LD_RELEASE_STRICT=1 bun run release:check in the deployment environment before release.",
);
