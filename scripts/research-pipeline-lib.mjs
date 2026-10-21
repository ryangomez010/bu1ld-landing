import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";

export const CHECKPOINTS = [
  [1, "IDEA_READY"],
  [2, "MODEL_SPECIFICATION_READY"],
  [3, "METHODOLOGY_READY"],
  [4, "MODEL_IMPLEMENTED"],
  [5, "EXPERIMENT_SYSTEM_IMPLEMENTED"],
  [6, "RUN_READY"],
  [7, "CONFIRMATORY_PROTOCOL_FROZEN"],
  [8, "EVIDENCE_LOCKED"],
  [9, "VERIFIED"],
  [10, "RESEARCH_COMPLETE"],
];

const REQUIRED_CONTRACT_FIELDS = [
  "exact_research_question",
  "scientific_objective",
  "current_hypothesis",
  "intended_contribution",
  "project_scope",
  "current_phase",
  "development_budget",
  "compute_budget",
  "protected_evaluation_boundary",
];

function command(cwd, args) {
  try {
    return execFileSync(args[0], args.slice(1), {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    }).trim();
  } catch {
    return "";
  }
}

export function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function inspectSource(binding) {
  const sourcePath = binding.source_path;
  if (!sourcePath || !existsSync(sourcePath)) {
    return {
      declared_path: sourcePath,
      exists: false,
      source_status: binding.source_status,
      binding_note: binding.binding_note,
      git: null,
    };
  }

  const topLevel = command(sourcePath, ["git", "rev-parse", "--show-toplevel"]);
  const status = topLevel ? command(sourcePath, ["git", "status", "--short"]) : "";
  const entries = status ? status.split("\n").filter(Boolean) : [];
  const fileCount = readdirSync(sourcePath).filter((name) => name !== ".DS_Store").length;

  return {
    declared_path: sourcePath,
    resolved_path: resolve(sourcePath),
    exists: true,
    directory_entry_count: fileCount,
    source_status: binding.source_status,
    binding_note: binding.binding_note,
    git: topLevel
      ? {
          top_level: topLevel,
          commit: command(sourcePath, ["git", "rev-parse", "HEAD"]) || null,
          branch: command(sourcePath, ["git", "branch", "--show-current"]) || null,
          remote: command(sourcePath, ["git", "remote", "get-url", "origin"]) || null,
          dirty: entries.length > 0,
          dirty_entry_count: entries.length,
          dirty_sample: entries.slice(0, 12),
        }
      : null,
  };
}

export function initialState(binding, source, now) {
  const unresolvedSource = !source.exists || binding.source_status.startsWith("UNRESOLVED");
  const nonResearch = ["PRODUCT", "ARCHIVE"].includes(binding.classification);
  const blockers = [];
  if (unresolvedSource) blockers.push("SOURCE_IDENTITY_UNRESOLVED");
  if (source.git?.dirty) blockers.push("SOURCE_WORKTREE_DIRTY_REVIEW_REQUIRED");
  blockers.push("RESEARCH_QUESTION_NOT_FROZEN");
  blockers.push("DEVELOPMENT_AND_COMPUTE_BUDGETS_UNDEFINED");
  blockers.push("PROTECTED_EVALUATION_BOUNDARY_NOT_FROZEN");

  return {
    schema_version: 1,
    project: {
      id: binding.id,
      name: binding.name,
      classification: binding.classification,
      evidence_level: binding.evidence_level,
    },
    initialized_at: now,
    updated_at: now,
    source,
    research_contract: {
      exact_research_question: null,
      scientific_objective: null,
      current_hypothesis: null,
      intended_contribution: null,
      project_scope: nonResearch
        ? "Pipeline applicability review required; do not force a research-paper lifecycle onto a product or archive."
        : null,
      current_phase: "INITIALIZE",
      development_budget: null,
      compute_budget: null,
      protected_evaluation_boundary: {
        status: "NOT_DEFINED",
        opened: false,
        protected_artifacts: [],
      },
      repositories: source.exists ? [source.resolved_path] : [],
      datasets: [],
      artifacts: [],
      claims: [],
      decisions: [
        {
          at: now,
          decision:
            "Initialize fail-closed canonical research state without inferring missing science.",
          basis: "Portfolio-wide research pipeline request and evidence-gated workspace rules.",
        },
      ],
      failures: unresolvedSource
        ? [
            {
              at: now,
              kind: "SOURCE_DISCOVERY",
              detail: binding.binding_note,
              status: "OPEN",
            },
          ]
        : [],
    },
    checkpoints: CHECKPOINTS.map(([number, name]) => ({
      number,
      name,
      status: "NOT_READY",
      evidence: [],
      blockers: number === 1 ? blockers : [`CHECKPOINT_${number - 1}_NOT_COMPLETE`],
    })),
    scientific_result: {
      disposition: "NOT_EVALUATED",
      scope: null,
      evidence_locked: false,
    },
    controls: {
      development_and_confirmatory_separated: false,
      protected_outcomes_observed: false,
      negative_results_preserved: true,
      overwrite_policy: "PRESERVE_EXISTING_STATE_AND_APPEND_HISTORY",
    },
    next_actions: unresolvedSource
      ? [
          "Resolve and verify the authoritative source identity before implementation.",
          "Define the exact research question, falsifier, scope, and budgets.",
        ]
      : nonResearch
        ? [
            "Review whether the research pipeline applies to this product/archive and record the decision.",
            "Preserve product release gates separately from scientific checkpoints.",
          ]
        : [
            "Read the bound repository's existing protocol, evidence, decisions, and negative results.",
            "Define or reconcile the exact research question, hypothesis, falsifier, scope, and budgets.",
            "Do not open protected evaluation until Checkpoint 7 is frozen.",
          ],
  };
}

export function contractCompleteness(state) {
  const contract = state.research_contract ?? {};
  const missing = REQUIRED_CONTRACT_FIELDS.filter((field) => {
    const value = contract[field];
    if (field === "protected_evaluation_boundary") {
      return !value || value.status === "NOT_DEFINED";
    }
    return value === null || value === undefined || value === "";
  });
  return {
    required: REQUIRED_CONTRACT_FIELDS.length,
    complete: REQUIRED_CONTRACT_FIELDS.length - missing.length,
    missing,
  };
}

export function initializeProject(binding, options) {
  const projectDir = join(options.stateRoot, binding.id);
  const statePath = join(projectDir, "STATE.json");
  const historyPath = join(projectDir, "HISTORY.jsonl");
  mkdirSync(projectDir, { recursive: true });
  const source = inspectSource(binding);

  if (!existsSync(statePath)) {
    const state = initialState(binding, source, options.now);
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    const event = {
      at: options.now,
      event: "STATE_INITIALIZED",
      state_sha256: sha256(state),
      source_status: source.source_status,
      source_commit: source.git?.commit ?? null,
    };
    appendFileSync(historyPath, `${JSON.stringify(event)}\n`);
    return { statePath, historyPath, created: true, state };
  }

  const state = readJson(statePath);
  return { statePath, historyPath, created: false, state };
}

export function renderPortfolioStatus(result) {
  const lines = [
    "# Research Pipeline Portfolio Status",
    "",
    `Generated: ${result.generated_at}`,
    "",
    "This report records initialization and source binding only. It does not certify scientific or product completion.",
    "",
    "## Summary",
    "",
    `- Project states: ${result.summary.project_count}`,
    `- Newly initialized: ${result.summary.created_count}`,
    `- Bound sources present: ${result.summary.bound_source_count}`,
    `- Unresolved sources: ${result.summary.unresolved_source_count}`,
    `- Research complete: ${result.summary.research_complete_count}`,
    "",
    "## Projects",
    "",
    "| Project | Source | Contract | Checkpoint | Result |",
    "| --- | --- | ---: | --- | --- |",
  ];

  for (const project of result.projects) {
    lines.push(
      `| ${project.name} | ${project.source_exists ? "bound" : "unresolved"} | ${project.contract.complete}/${project.contract.required} | ${project.highest_checkpoint} | ${project.scientific_result} |`,
    );
  }
  lines.push("", "## Fail-closed rules", "");
  lines.push(
    "- A source binding is not a reproduction receipt.",
    "- Checkpoints advance only from retained evidence; documentation alone is insufficient.",
    "- Protected outcomes stay unopened until Checkpoint 7 is frozen.",
    "- Negative, mixed, inconclusive, and invalid outcomes remain valid terminal evidence states.",
    "- Dirty source worktrees are never reset or normalized by this pipeline.",
  );
  return `${lines.join("\n")}\n`;
}

export function initializePortfolio(options) {
  const bindings = readJson(options.bindingsPath);
  mkdirSync(options.outputRoot, { recursive: true });
  mkdirSync(options.stateRoot, { recursive: true });
  const projects = bindings.projects.map((binding) => {
    const initialized = initializeProject(binding, options);
    const state = initialized.state;
    const contract = contractCompleteness(state);
    const completed = state.checkpoints.filter((checkpoint) => checkpoint.status === "COMPLETE");
    return {
      id: binding.id,
      name: binding.name,
      classification: binding.classification,
      source_exists: state.source.exists,
      source_status: state.source.source_status,
      source_path: state.source.resolved_path ?? state.source.declared_path,
      source_commit: state.source.git?.commit ?? null,
      source_dirty: state.source.git?.dirty ?? null,
      contract,
      highest_checkpoint: completed.length ? completed.at(-1).name : "INITIALIZE_ONLY",
      scientific_result: state.scientific_result.disposition,
      created: initialized.created,
      state_path: initialized.statePath,
      history_path: initialized.historyPath,
      next_actions: state.next_actions,
    };
  });

  const result = {
    schema_version: 1,
    generated_at: options.now,
    bindings_path: options.bindingsPath,
    summary: {
      project_count: projects.length,
      created_count: projects.filter((project) => project.created).length,
      bound_source_count: projects.filter((project) => project.source_exists).length,
      unresolved_source_count: projects.filter((project) => !project.source_exists).length,
      research_complete_count: projects.filter(
        (project) => project.scientific_result !== "NOT_EVALUATED",
      ).length,
    },
    projects,
  };

  writeFileSync(
    join(options.outputRoot, "PORTFOLIO_STATUS.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  writeFileSync(join(options.outputRoot, "PORTFOLIO_STATUS.md"), renderPortfolioStatus(result));
  const queue = projects.flatMap((project) =>
    project.next_actions.map((action, index) => ({
      project_id: project.id,
      priority: project.source_exists ? index + 2 : index + 1,
      action,
      status: "OPEN",
    })),
  );
  writeFileSync(
    join(options.outputRoot, "ACTION_QUEUE.json"),
    `${JSON.stringify(queue, null, 2)}\n`,
  );
  return result;
}

export function validateStateTree(stateRoot) {
  const errors = [];
  if (!existsSync(stateRoot)) return ["state root does not exist"];
  for (const name of readdirSync(stateRoot)) {
    const projectDir = join(stateRoot, name);
    if (!statSync(projectDir).isDirectory()) continue;
    for (const required of ["STATE.json", "HISTORY.jsonl"]) {
      if (!existsSync(join(projectDir, required))) errors.push(`${name}/${required} missing`);
    }
    if (existsSync(join(projectDir, "STATE.json"))) {
      const state = readJson(join(projectDir, "STATE.json"));
      if (state.project?.id !== name) errors.push(`${name}/STATE.json project id mismatch`);
      if (state.checkpoints?.length !== CHECKPOINTS.length) {
        errors.push(`${name}/STATE.json checkpoint count mismatch`);
      }
    }
  }
  return errors;
}
