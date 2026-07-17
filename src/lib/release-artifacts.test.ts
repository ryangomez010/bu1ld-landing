import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("release artifacts", () => {
  test("final setup includes the complete final migration chain", () => {
    const finalSetup = read("supabase/FINAL_SETUP.sql");

    expect(finalSetup).toContain("-- BEGIN supabase/phase23.sql");
    expect(finalSetup).toContain("create table if not exists public.paper_analyses");
    expect(finalSetup).toContain("alter table public.paper_analyses enable row level security");
    expect(finalSetup).toContain(
      "grant select, insert, delete on table public.paper_analyses to authenticated",
    );
    expect(finalSetup).toContain("insert into public.schema_migrations (phase) values ('phase23')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase24.sql");
    expect(finalSetup).toContain("create table if not exists public.labs");
    expect(finalSetup).toContain("create table if not exists public.invitations");
    expect(finalSetup).toContain(
      "grant select, insert, update on table public.invitations to authenticated",
    );
    expect(finalSetup).toContain("insert into public.schema_migrations (phase) values ('phase24')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase25.sql");
    expect(finalSetup).toContain("create or replace function public.is_platform_admin");
    expect(finalSetup).toContain("create table if not exists public.project_experiments");
    expect(finalSetup).toContain("insert into public.schema_migrations (phase) values ('phase25')");
    expect(finalSetup).not.toContain("schema_migrations (version");
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

  test("phase 24 exposes public catalog tables safely", () => {
    const sql = read("supabase/phase24.sql");

    expect(sql).toContain("revoke all on table public.labs from anon");
    expect(sql).toContain("grant select on table public.labs to anon, authenticated");
    expect(sql).toContain("revoke all on table public.invitations from anon");
    expect(sql).toContain(
      "grant select, insert, update on table public.invitations to authenticated",
    );
    expect(sql).toContain("to anon, authenticated");
    expect(sql).toContain("lower(email) = lower((auth.jwt() ->> 'email'))");
  });

  test("phase 25 unifies admin checks and seeds labs", () => {
    const sql = read("supabase/phase25.sql");
    expect(sql).toContain("is_platform_admin");
    expect(sql).toContain("project_experiments");
    expect(sql).toContain("project_deliverables");
    expect(sql).toContain("'scientific-discovery'");
  });

  test("verification and release gates require final phases", () => {
    const verifySql = read("supabase/VERIFY_SETUP.sql");
    const releaseGate = read("scripts/release-readiness.mjs");
    const schemaApply = read("scripts/apply-schema.mjs");

    expect(verifySql).toContain("('paper_analyses')");
    expect(verifySql).toContain("('invitations')");
    expect(verifySql).toContain("('project_experiments')");
    expect(verifySql).toContain("(19), (20), (21), (22), (23), (24), (25)");
    expect(releaseGate).toContain('"phase23.sql"');
    expect(releaseGate).toContain('"phase24.sql"');
    expect(releaseGate).toContain('"phase25.sql"');
    expect(schemaApply).toContain('"supabase/phase23.sql"');
    expect(schemaApply).toContain('"supabase/phase24.sql"');
    expect(schemaApply).toContain('"supabase/phase25.sql"');
  });
});
