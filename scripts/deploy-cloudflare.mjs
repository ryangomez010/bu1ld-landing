#!/usr/bin/env node
/**
 * Production deploy: generate runtime env, build with VITE_* inlined, upload to Cloudflare.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.error(
    "Cloudflare auth required. Run `npx wrangler login` or set CLOUDFLARE_API_TOKEN, then retry `bun run deploy:cf`.",
  );
  process.exit(1);
}

run("node", ["scripts/generate-runtime-env.mjs"]);

const buildEnv = { ...process.env };
if (!buildEnv.VITE_SUPABASE_URL || !buildEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn("VITE_* not in shell env; build will still use .env via Vite loadEnv + runtime-env.js fallback.");
}

run("bun", ["run", "build"], buildEnv);
run("npx", ["wrangler", "deploy"]);
console.log("Deployed to Cloudflare. Verify https://thebu1ld.com/signup");
