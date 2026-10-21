#!/usr/bin/env node
// Run the installed TypeScript compiler's diagnostics in sequential bounded workers.
// Every source file in the program is checked with the unchanged tsconfig options.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const script = fileURLToPath(import.meta.url);
const root = resolve(dirname(script), "..");
const host = {
  getCanonicalFileName: (file) => file,
  getCurrentDirectory: () => root,
  getNewLine: () => "\n",
};

function program() {
  const configPath = resolve(root, "tsconfig.json");
  const input = ts.readConfigFile(configPath, ts.sys.readFile);
  if (input.error) {
    console.error(ts.formatDiagnosticsWithColorAndContext([input.error], host));
    process.exit(1);
  }
  const config = ts.parseJsonConfigFileContent(input.config, ts.sys, root);
  if (config.errors.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(config.errors, host));
    process.exit(1);
  }
  return ts.createProgram(config.fileNames, config.options);
}

if (process.argv[2] === "--inventory") {
  const compiler = program();
  // Do not skip imported application files outside tsconfig's explicit include paths.
  const files = compiler
    .getSourceFiles()
    .filter((file) => !file.isDeclarationFile || !file.fileName.includes("/node_modules/"))
    .map((file) => file.fileName);
  console.log(JSON.stringify(files));
} else if (process.argv[2] === "--batch") {
  const compiler = program();
  const diagnostics = [...compiler.getOptionsDiagnostics(), ...compiler.getGlobalDiagnostics()];
  for (const name of process.argv.slice(3)) {
    const source = compiler.getSourceFile(name);
    if (!source) throw new Error(`Source disappeared during typecheck: ${name}`);
    diagnostics.push(
      ...compiler.getSyntacticDiagnostics(source),
      ...compiler.getSemanticDiagnostics(source),
    );
  }
  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
    process.exit(1);
  }
} else {
  function run(args, capture = false) {
    const result = spawnSync(process.execPath, ["--max-old-space-size=512", script, ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: capture ? "pipe" : "inherit",
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) {
      if (result.stderr) console.error(result.stderr);
      console.error(
        result.error?.message ?? `Typecheck worker failed (${result.signal ?? result.status}).`,
      );
      process.exit(1);
    }
    return result.stdout;
  }
  const files = JSON.parse(run(["--inventory"], true));
  const batchSize = 16;
  for (let offset = 0; offset < files.length; offset += batchSize) {
    const batch = files.slice(offset, offset + batchSize);
    run(["--batch", ...batch]);
    console.log(
      `Typecheck: ${Math.min(offset + batch.length, files.length)}/${files.length} source files passed.`,
    );
  }
  console.log(
    `Full-program diagnostics passed across ${files.length} source files using sequential 512 MiB heap workers.`,
  );
}
