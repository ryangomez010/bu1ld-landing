#!/usr/bin/env node

import { resolve } from "node:path";

import {
  DEFAULT_ROOTS,
  buildPortfolioReport,
  writePortfolioReport,
} from "./portfolio-preflight-lib.mjs";

function parseArgs(argv) {
  const options = {
    roots: DEFAULT_ROOTS,
    outDir: "research/preflight",
    write: true,
    failOnBlockers: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--roots") {
      options.roots = argv[index + 1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
    } else if (arg === "--out-dir") {
      options.outDir = argv[index + 1];
      index += 1;
    } else if (arg === "--no-write") {
      options.write = false;
    } else if (arg === "--fail-on-blockers") {
      options.failOnBlockers = true;
    }
  }

  if (process.env.PORTFOLIO_ROOTS) {
    options.roots = process.env.PORTFOLIO_ROOTS.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const report = buildPortfolioReport({
  roots: options.roots,
  registryPath: resolve("research/PROJECT_REGISTRY.yaml"),
});

let paths = null;
if (options.write) {
  paths = writePortfolioReport(report, resolve(options.outDir));
}

console.log(
  [
    `portfolio preflight inspected ${report.summary.project_count} project(s)`,
    `dirty=${report.summary.dirty_project_count}`,
    `secret_risk_projects=${report.summary.secret_risk_project_count}`,
    `broken_link_projects=${report.summary.broken_link_project_count}`,
    `release_blockers=${report.summary.release_blocker_count}`,
    paths ? `json=${paths.jsonPath}` : null,
    paths ? `markdown=${paths.markdownPath}` : null,
  ]
    .filter(Boolean)
    .join("\n"),
);

if (options.failOnBlockers && report.summary.release_blocker_count > 0) {
  process.exitCode = 1;
}
