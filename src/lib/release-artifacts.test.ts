import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("release artifacts", () => {
  test("final setup includes the complete analyzer migration", () => {
    const finalSetup = read("supabase/FINAL_SETUP.sql");

    expect(finalSetup).toContain("-- BEGIN supabase/phase23.sql");
    expect(finalSetup).toContain("create table if not exists public.paper_analyses");
    expect(finalSetup).toContain("alter table public.paper_analyses enable row level security");
    expect(finalSetup).toContain(
      "grant select, insert, delete on table public.paper_analyses to authenticated",
    );
    expect(finalSetup).toContain("insert into public.schema_migrations (phase) values ('phase23')");
  });

  test("paper analysis RLS stays scoped to authenticated owners and admins", () => {
    const sql = read("supabase/phase23.sql");

    expect(sql).toContain('create policy "Members read their paper analyses"');
    expect(sql).toContain("for select\n  to authenticated");
    expect(sql).toContain("user_id = (select auth.uid())");
    expect(sql).toContain(
      "from public.profiles p where p.id = (select auth.uid()) and p." + "role = " + "'admin'",
    );
    expect(sql).toContain("revoke all on table public.paper_analyses from anon");
  });

  test("verification and release gates require phase 23", () => {
    const verifySql = read("supabase/VERIFY_SETUP.sql");
    const releaseGate = read("scripts/release-readiness.mjs");
    const schemaApply = read("scripts/apply-schema.mjs");

    expect(verifySql).toContain("('paper_analyses')");
    expect(verifySql).toContain("(19), (20), (21), (22), (23)");
    expect(releaseGate).toContain('"phase23.sql"');
    expect(schemaApply).toContain('"supabase/phase23.sql"');
  });
});
