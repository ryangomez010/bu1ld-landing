#!/usr/bin/env node

import { resolve } from "node:path";
import { initializePortfolio, validateStateTree } from "./research-pipeline-lib.mjs";

const command = process.argv[2] ?? "init";
const now = new Date().toISOString();
const options = {
  now,
  bindingsPath: resolve("research/SOURCE_BINDINGS.json"),
  outputRoot: resolve("research/pipeline"),
  stateRoot: resolve("research/project-states"),
};

if (command === "init" || command === "status") {
  const result = initializePortfolio(options);
  console.log(
    [
      `research pipeline ${command} complete`,
      `projects=${result.summary.project_count}`,
      `created=${result.summary.created_count}`,
      `bound_sources=${result.summary.bound_source_count}`,
      `unresolved_sources=${result.summary.unresolved_source_count}`,
      `research_complete=${result.summary.research_complete_count}`,
      `status=${resolve("research/pipeline/PORTFOLIO_STATUS.md")}`,
    ].join("\n"),
  );
} else if (command === "validate") {
  const errors = validateStateTree(options.stateRoot);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("research pipeline state tree valid");
  }
} else {
  console.error(`unknown command: ${command}`);
  process.exitCode = 2;
}
