#!/usr/bin/env node
/**
 * Writes public/runtime-env.js from .env or process env.
 * Used at deploy time so Cloudflare serves Supabase keys even when the Vite
 * build ran without VITE_* vars (e.g. CI before secrets were added).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadDeploymentEnv, publicConfigErrors, publicSupabaseConfig } from "./deployment-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(root, "public/runtime-env.js");

const merged = loadDeploymentEnv(root);
const errors = publicConfigErrors(merged, merged.BU1LD_RELEASE_STRICT === "1");
if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}

const config = publicSupabaseConfig(merged);
const payload = {
  VITE_SUPABASE_URL: config.url,
  VITE_SUPABASE_ANON_KEY: config.key,
};

mkdirSync(dirname(outPath), { recursive: true });
const body = `window.__BU1LD_PUBLIC_ENV__=${JSON.stringify(payload)};\n`;
writeFileSync(outPath, body, "utf8");
console.log("Wrote public/runtime-env.js");
