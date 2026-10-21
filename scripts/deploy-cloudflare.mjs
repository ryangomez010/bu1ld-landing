#!/usr/bin/env node
// Release through the configured Worker only after strict verification.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDeploymentEnv } from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...loadDeploymentEnv(root), BU1LD_RELEASE_STRICT: "1", CI: "true" };
const wrangler = resolve(root, "node_modules/wrangler/bin/wrangler.js");
function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
    env,
  });
  if (result.status !== 0) {
    if (capture)
      console.error(
        "Worker binding check failed. Check Cloudflare access and the Worker named in wrangler.jsonc.",
      );
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}
if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
  console.error(
    "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for the intended account, then retry deploy:cf.",
  );
  process.exit(1);
}
run("bun", ["run", "release:prod"]);
// Build-time variables are not Worker runtime bindings. Check binding names without reading values.
let names;
try {
  names = new Set(
    JSON.parse(run(process.execPath, [wrangler, "secret", "list", "--format", "json"], true)).map(
      (secret) => secret.name,
    ),
  );
} catch {
  console.error("Could not verify Worker secret bindings. Nothing was deployed.");
  process.exit(1);
}
const required = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "DIGEST_API_SECRET",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];
const missing = required.filter((name) => !names.has(name));
if (missing.length) {
  console.error(
    `Provision these Worker secret bindings before deployment: ${missing.join(", ")}. Use the same Supabase project as the build.`,
  );
  process.exit(1);
}
run(process.execPath, [wrangler, "deploy"]);
console.log(
  "Uploaded the Worker configured in wrangler.jsonc. Verify its assigned route and complete live role/browser QA before declaring release acceptance.",
);
