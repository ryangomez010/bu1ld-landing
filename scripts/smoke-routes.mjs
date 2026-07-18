#!/usr/bin/env node
/**
 * Lightweight route smoke — verifies critical paths exist in the generated route tree.
 * Does not require a browser or live server.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routeTree = resolve(root, "src/routeTree.gen.ts");

const REQUIRED = [
  "/",
  "/labs",
  "/labs/$slug",
  "/publications",
  "/programs-public",
  "/partnerships",
  "/competitions",
  "/apply",
  "/evidence",
  "/login",
  "/signup",
  "/dashboard",
  "/announcements",
  "/projects",
  "/projects/$slug",
  "/projects/manage/$slug",
  "/research",
  "/papers",
  "/events",
  "/admin",
  "/privacy",
  "/terms",
];

if (!existsSync(routeTree)) {
  console.error(
    "Missing src/routeTree.gen.ts — run a Vite build or start once to generate routes.",
  );
  process.exit(1);
}

const text = readFileSync(routeTree, "utf8");
const missing = REQUIRED.filter((path) => {
  // routeTree encodes path as path: '/labs' or similar
  const needle = `path: '${path}'`;
  const needle2 = `path: "${path}"`;
  return !text.includes(needle) && !text.includes(needle2);
});

if (missing.length) {
  console.error("Route smoke failed — missing paths:");
  for (const path of missing) console.error(`  - ${path}`);
  process.exit(1);
}

console.log(`Route smoke OK — ${REQUIRED.length} critical paths present.`);
process.exit(0);
