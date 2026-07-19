import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

const EXCLUDED_DIRS = new Set([
  ".git",
  ".turbo",
  ".wrangler",
  ".vercel",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".py",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bPLACEHOLDER\b/i,
  /\bLOREM IPSUM\b/i,
  /\bcoming soon\b/i,
  /\bunder construction\b/i,
  /\bnot implemented\b/i,
];

const SECRET_PATTERNS = [
  // Only flag assigned secret material, not documentation of env var names.
  /\bservice_role\b\s*[:=]\s*["'][A-Za-z0-9_./+=-]{16,}["']/i,
  /\bSUPABASE_SERVICE_ROLE_KEY\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}/,
  /\b(?:api|secret|private)[_-]?key\b\s*[:=]\s*["'][A-Za-z0-9_./+=-]{24,}["']/i,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
];

export const DEFAULT_ROOTS = [
  "/Users/ryan/Downloads/the-bu1ld-nexus-main",
  "/Users/ryan/Downloads/finance4all-global-reach-main",
  "/Users/ryan/Documents/Genesis",
  "/Users/ryan/Documents/GenesisE",
  "/Users/ryan/Documents/MonteCarlo",
  "/Users/ryan/.codex/visualizations/2026/07/12/019f558a-453d-7cb0-8943-42c7b533d6eb",
];

export function command(cwd, args) {
  try {
    return execFileSync(args[0], args.slice(1), {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    }).trim();
  } catch (error) {
    return "";
  }
}

export function summarizeGitStatus(statusText) {
  const lines = statusText
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return {
    dirty: lines.length > 0,
    dirty_count: lines.length,
    deleted_count: lines.filter((line) => line.startsWith("D ") || line.startsWith(" D")).length,
    untracked_count: lines.filter((line) => line.startsWith("??")).length,
    sample: lines.slice(0, 12),
  };
}

export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function findFiles(root, options = {}) {
  const maxFiles = options.maxFiles ?? 8_000;
  const files = [];
  const stack = [root];

  while (stack.length > 0 && files.length < maxFiles) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          stack.push(fullPath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (options.extensions && !options.extensions.has(extname(entry.name))) {
        continue;
      }
      files.push(fullPath);
      if (files.length >= maxFiles) {
        break;
      }
    }
  }

  return files;
}

export function detectTextRisks(text) {
  // Ignore JSX/HTML placeholder= attributes so form UX copy is not a release risk.
  const withoutFormPlaceholders = text.replace(
    /\bplaceholder\s*=\s*(?:\{[^}]*\}|["'][^"']*["'])/gi,
    "",
  );
  return {
    placeholders: PLACEHOLDER_PATTERNS.filter((pattern) =>
      pattern.test(withoutFormPlaceholders),
    ).map((pattern) => pattern.source),
    secrets: SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map(
      (pattern) => pattern.source,
    ),
  };
}

export function scanTextRisks(root, options = {}) {
  const maxMatches = options.maxMatches ?? 40;
  const files = findFiles(root, {
    extensions: TEXT_EXTENSIONS,
    maxFiles: options.maxFiles ?? 8_000,
  });
  const placeholder_matches = [];
  const secret_risk_matches = [];
  const env_files_present = [];

  for (const filePath of files) {
    const name = basename(filePath);
    const rel = relative(root, filePath);
    if (name === ".env" || name.startsWith(".env.")) {
      env_files_present.push(rel);
      continue;
    }
    // Generated runtime config and fixtures are not release-source risks.
    if (
      rel === "public/runtime-env.js" ||
      /\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/.test(name) ||
      rel.startsWith("scripts/portfolio-preflight")
    ) {
      continue;
    }

    let text = "";
    try {
      const stat = statSync(filePath);
      if (stat.size > 512_000) {
        continue;
      }
      text = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const risks = detectTextRisks(text);
    if (risks.placeholders.length > 0 && placeholder_matches.length < maxMatches) {
      placeholder_matches.push({ file: rel, patterns: risks.placeholders.slice(0, 3) });
    }
    if (risks.secrets.length > 0 && secret_risk_matches.length < maxMatches) {
      secret_risk_matches.push({ file: rel, patterns: risks.secrets.slice(0, 3) });
    }
  }

  return {
    env_files_present,
    placeholder_count: placeholder_matches.length,
    placeholder_matches,
    secret_risk_count: secret_risk_matches.length,
    secret_risk_matches,
    scanned_file_count: files.length,
  };
}

export function findBrokenMarkdownLinks(root, options = {}) {
  const maxMatches = options.maxMatches ?? 50;
  const markdownFiles = findFiles(root, {
    extensions: new Set([".md"]),
    maxFiles: options.maxFiles ?? 1_000,
  });
  const broken = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

  for (const filePath of markdownFiles) {
    let text = "";
    try {
      text = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    for (const match of text.matchAll(linkPattern)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, "");
      if (
        rawTarget.length === 0 ||
        rawTarget.startsWith("#") ||
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("mailto:") ||
        rawTarget.startsWith("tel:")
      ) {
        continue;
      }

      const withoutAnchor = rawTarget.split("#")[0];
      const targetPath = isAbsolute(withoutAnchor)
        ? withoutAnchor
        : resolve(dirname(filePath), withoutAnchor);
      if (!existsSync(targetPath)) {
        broken.push({
          file: relative(root, filePath),
          target: rawTarget,
        });
      }
      if (broken.length >= maxMatches) {
        return broken;
      }
    }
  }

  return broken;
}

export function parseRegistry(registryPath) {
  if (!existsSync(registryPath)) {
    return new Map();
  }
  const lines = readFileSync(registryPath, "utf8").split("\n");
  const projects = new Map();
  let current = null;
  let currentListKey = null;

  for (const line of lines) {
    const idMatch = line.match(/^\s{2}- id:\s*(.+?)\s*$/);
    if (idMatch) {
      current = { id: idMatch[1], missing_work: [] };
      currentListKey = null;
      projects.set(current.id, current);
      continue;
    }
    if (!current) {
      continue;
    }

    const listKey = line.match(/^\s{4}([A-Za-z0-9_]+):\s*$/);
    if (listKey) {
      currentListKey = listKey[1];
      continue;
    }

    const scalar = line.match(
      /^\s{4}(path|classification|evidence_level|recommended_final_disposition):\s*(.+?)\s*$/,
    );
    if (scalar) {
      currentListKey = null;
      current[scalar[1]] = scalar[2].replace(/^"|"$/g, "");
      continue;
    }

    const missing = line.match(/^\s{6}-\s+(.+?)\s*$/);
    if (missing && currentListKey === "missing_work") {
      current.missing_work.push(missing[1]);
    }
  }

  return projects;
}

export function registryEntryForRoot(registry, root) {
  const resolved = resolve(root);
  for (const entry of registry.values()) {
    if (entry.path && resolve(entry.path) === resolved) {
      return entry;
    }
  }
  return null;
}

export function projectCommands(root, packageJson, pyprojectPresent) {
  const scripts = packageJson?.scripts ?? {};
  const commands = {};

  for (const key of [
    "install",
    "test",
    "typecheck",
    "lint",
    "build",
    "release:check",
    "release:prod",
  ]) {
    if (key === "install") {
      if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) {
        commands.install = "bun install";
      } else if (existsSync(join(root, "package-lock.json"))) {
        commands.install = "npm ci";
      } else if (packageJson) {
        commands.install = "npm install";
      } else if (pyprojectPresent) {
        commands.install = "python3 -m pip install -e .";
      }
      continue;
    }
    if (scripts[key]) {
      const runner =
        existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb")) ? "bun" : "npm";
      commands[key] = `${runner} run ${key}`;
    }
  }

  if (!commands.test && pyprojectPresent && existsSync(join(root, "tests"))) {
    commands.test =
      "python3 -m pytest -q || PYTHONPATH=src python3 -m unittest discover -s tests -v";
  }

  return commands;
}

export function projectReleaseBlockers(project) {
  const blockers = [];
  if (project.git.dirty) {
    blockers.push(`${project.git.dirty_count} dirty git entries require review`);
  }
  if (project.package_json_present && !project.commands.test) {
    blockers.push("package project has no test command");
  }
  if (project.package_json_present && !project.commands.build) {
    blockers.push("package project has no build command");
  }
  if (project.classification === "PRODUCT" && project.migrations.sql_count === 0) {
    blockers.push("product registry entry has no detected SQL migrations");
  }
  if (project.risks.secret_risk_count > 0) {
    blockers.push("secret-like literals require human review");
  }
  if (project.broken_markdown_links.length > 0) {
    blockers.push(`${project.broken_markdown_links.length} broken local Markdown links detected`);
  }
  if (project.registry_missing_work.length > 0) {
    blockers.push(...project.registry_missing_work.slice(0, 5));
  }
  if (project.evidence_level === "E0" || project.evidence_level === "E1") {
    blockers.push(`evidence level ${project.evidence_level} is below runnable release threshold`);
  }
  return [...new Set(blockers)];
}

export function inspectProject(root, registry) {
  const packageJson = readJson(join(root, "package.json"));
  const pyprojectPresent = existsSync(join(root, "pyproject.toml"));
  const registryEntry = registryEntryForRoot(registry, root);
  const status = summarizeGitStatus(command(root, ["git", "status", "--short"]));
  const branch = command(root, ["git", "branch", "--show-current"]) || null;
  const sqlFiles = findFiles(join(root, "supabase"), {
    extensions: new Set([".sql"]),
    maxFiles: 1_000,
  });
  const risks = scanTextRisks(root);
  const brokenMarkdownLinks = findBrokenMarkdownLinks(root);

  const project = {
    root,
    name: registryEntry?.id ?? packageJson?.name ?? basename(root),
    branch,
    git: status,
    classification: registryEntry?.classification ?? "UNKNOWN",
    evidence_level: registryEntry?.evidence_level ?? "UNKNOWN",
    recommended_final_disposition:
      registryEntry?.recommended_final_disposition ?? registryEntry?.classification ?? "UNKNOWN",
    package_json_present: Boolean(packageJson),
    pyproject_present: pyprojectPresent,
    commands: projectCommands(root, packageJson, pyprojectPresent),
    migrations: {
      sql_count: sqlFiles.length,
      sample: sqlFiles.slice(0, 8).map((filePath) => relative(root, filePath)),
    },
    risks,
    broken_markdown_links: brokenMarkdownLinks,
    registry_missing_work: registryEntry?.missing_work ?? [],
  };

  return {
    ...project,
    release_blockers: projectReleaseBlockers(project),
  };
}

export function buildPortfolioReport(options = {}) {
  const roots = (options.roots ?? DEFAULT_ROOTS).filter((root) => existsSync(root));
  const registryPath =
    options.registryPath ?? join(roots[0] ?? process.cwd(), "research", "PROJECT_REGISTRY.yaml");
  const registry = parseRegistry(registryPath);
  const projects = roots.map((root) => inspectProject(root, registry));

  return {
    generated_at: new Date().toISOString(),
    registry_path: registryPath,
    roots,
    summary: {
      project_count: projects.length,
      dirty_project_count: projects.filter((project) => project.git.dirty).length,
      secret_risk_project_count: projects.filter((project) => project.risks.secret_risk_count > 0)
        .length,
      broken_link_project_count: projects.filter(
        (project) => project.broken_markdown_links.length > 0,
      ).length,
      release_blocker_count: projects.reduce(
        (sum, project) => sum + project.release_blockers.length,
        0,
      ),
    },
    projects,
  };
}

export function renderMarkdownReport(report) {
  const lines = [
    "# Portfolio Preflight Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    "## Summary",
    "",
    `- Projects inspected: ${report.summary.project_count}`,
    `- Dirty projects: ${report.summary.dirty_project_count}`,
    `- Projects with secret-like source risks: ${report.summary.secret_risk_project_count}`,
    `- Projects with broken local Markdown links: ${report.summary.broken_link_project_count}`,
    `- Total release blockers: ${report.summary.release_blocker_count}`,
    "",
    "## Projects",
    "",
  ];

  for (const project of report.projects) {
    lines.push(
      `### ${project.name}`,
      "",
      `- Root: \`${project.root}\``,
      `- Branch: ${project.branch ?? "unknown"}`,
      `- Classification: ${project.classification}`,
      `- Evidence level: ${project.evidence_level}`,
      `- Dirty entries: ${project.git.dirty_count}`,
      `- SQL migrations detected: ${project.migrations.sql_count}`,
      `- Commands: ${
        Object.keys(project.commands).length
          ? Object.entries(project.commands)
              .map(([key, value]) => `${key} = \`${value}\``)
              .join("; ")
          : "none detected"
      }`,
      `- Placeholder/source-risk matches: ${project.risks.placeholder_count}`,
      `- Secret-like source-risk matches: ${project.risks.secret_risk_count}`,
      `- Broken local Markdown links: ${project.broken_markdown_links.length}`,
      "",
      "Release blockers:",
      "",
    );
    if (project.release_blockers.length === 0) {
      lines.push("- None detected by this local preflight.");
    } else {
      for (const blocker of project.release_blockers) {
        lines.push(`- ${blocker}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writePortfolioReport(report, outDir) {
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, "portfolio-preflight.json");
  const markdownPath = join(outDir, "portfolio-preflight.md");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdownReport(report));
  return { jsonPath, markdownPath };
}
