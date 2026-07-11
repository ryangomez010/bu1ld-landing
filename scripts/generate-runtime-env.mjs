#!/usr/bin/env node
/**
 * Writes public/runtime-env.js from .env or process env.
 * Used at deploy time so Cloudflare serves Supabase keys even when the Vite
 * build ran without VITE_* vars (e.g. CI before secrets were added).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(root, "public/runtime-env.js");

function loadEnvFile() {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = loadEnvFile();
const wranglerEnv = loadWranglerVars();
const merged = { ...wranglerEnv, ...fileEnv, ...process.env };

function loadWranglerVars() {
  const path = resolve(root, "wrangler.jsonc");
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8").replace(/\/\/.*$/gm, "");
  try {
    const parsed = JSON.parse(raw);
    return parsed.vars && typeof parsed.vars === "object" ? parsed.vars : {};
  } catch {
    return {};
  }
}

const payload = {
  VITE_SUPABASE_URL:
    merged.VITE_SUPABASE_URL ?? merged.NEXT_PUBLIC_SUPABASE_URL ?? undefined,
  VITE_SUPABASE_ANON_KEY:
    merged.VITE_SUPABASE_ANON_KEY ??
    merged.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    merged.VITE_SUPABASE_PUBLISHABLE_KEY ??
    merged.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    undefined,
  VITE_SUPABASE_PUBLISHABLE_KEY: merged.VITE_SUPABASE_PUBLISHABLE_KEY ?? undefined,
  NEXT_PUBLIC_SUPABASE_URL: merged.NEXT_PUBLIC_SUPABASE_URL ?? undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: merged.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? undefined,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    merged.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? undefined,
};

if (!payload.VITE_SUPABASE_URL || !payload.VITE_SUPABASE_ANON_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env or the environment before deploy.",
  );
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });
const body = `window.__BU1LD_PUBLIC_ENV__=${JSON.stringify(payload)};\n`;
writeFileSync(outPath, body, "utf8");
console.log("Wrote public/runtime-env.js");
