#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const files = [
  "supabase/full-setup.sql",
  ...Array.from({ length: 22 }, (_, index) => `supabase/phase${index + 19}.sql`),
];
const expected = files
  .map(
    (file) =>
      `-- BEGIN ${file}\n${readFileSync(new URL(file, root), "utf8").trimEnd()}\n\n-- END ${file}\n`,
  )
  .join("\n");
const output = new URL("supabase/FINAL_SETUP.sql", root);
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== expected) {
    console.error("FINAL_SETUP.sql differs from the migration chain. Run bun run schema:generate.");
    process.exit(1);
  }
  console.log(`Setup bundle matches ${files.length} source migrations through phase40.`);
} else {
  writeFileSync(output, expected);
  console.log(`Generated ${fileURLToPath(output)} from ${files.length} source migrations.`);
}
