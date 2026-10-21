import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("release artifacts", () => {
  test("setup bundle matches every source migration including member security", () => {
    const files = [
      "supabase/full-setup.sql",
      ...Array.from({ length: 22 }, (_, i) => `supabase/phase${i + 19}.sql`),
    ];
    const expected = files
      .map((file) => `-- BEGIN ${file}\n${read(file).trimEnd()}\n\n-- END ${file}\n`)
      .join("\n");
    expect(read("supabase/FINAL_SETUP.sql")).toBe(expected);
    const verification = read("supabase/VERIFY_SETUP.sql");
    for (const table of [
      "mentor_profiles",
      "mentorship_requests",
      "mentorship_sessions",
      "mentorship_feedback",
      "community_channels",
      "community_posts",
      "community_comments",
      "community_reactions",
    ]) {
      expect(verification.match(new RegExp(`'${table}'`, "g"))?.length).toBeGreaterThanOrEqual(3);
    }
    expect(verification).toContain("(39), (40)");
    expect(read("scripts/apply-schema.mjs")).toContain('"supabase/phase40.sql"');
    expect(read("scripts/release-readiness.mjs")).toContain('"phase40.sql"');
    expect(read("scripts/release-readiness.mjs")).toContain('"schema:check"');
  });

  test("member schema denies anonymous grants and requires parent visibility", () => {
    const sql = read("supabase/phase40.sql");
    expect(sql).toContain("from public, anon, authenticated");
    expect(sql).toContain("update (status, decision_note) on public.mentorship_requests");
    expect(sql).toContain("Only administrators can change moderation status");
    expect(sql).toContain("Invalid mentorship request transition");
    expect(sql.match(/as restrictive for all to authenticated/g)?.length).toBe(3);
    for (const guard of [
      "guard_mentor_profile_update",
      "guard_mentorship_decision",
      "guard_community_post_update",
    ]) {
      expect(sql).toContain(
        `revoke all on function public.${guard}() from public, anon, authenticated`,
      );
      expect(read("supabase/VERIFY_SETUP.sql")).toContain(`${guard}_trigger`);
    }
  });
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
    expect(finalSetup).toContain("-- BEGIN supabase/phase26.sql");
    expect(finalSetup).toContain("create table if not exists public.research_paths");
    expect(finalSetup).toContain("create table if not exists public.project_datasets");
    expect(finalSetup).toContain("insert into public.schema_migrations (phase) values ('phase26')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase27.sql");
    expect(finalSetup).toContain("assigned_reviewer_id");
    expect(finalSetup).toContain("assign_contribution_reviewer");
    expect(finalSetup).toContain("insert into public.schema_migrations (phase) values ('phase27')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase28.sql");
    expect(finalSetup).toContain("Public reads verified project contributions");
    expect(finalSetup).toContain("values ('phase28')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase29.sql");
    expect(finalSetup).toContain("weekly_commitment_hours");
    expect(finalSetup).toContain("values ('phase29')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase30.sql");
    expect(finalSetup).toContain("validate_project_brief");
    expect(finalSetup).toContain("values ('phase30')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase31.sql");
    expect(finalSetup).toContain("review_competition_submission");
    expect(finalSetup).toContain("values ('phase31')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase32.sql");
    expect(finalSetup).toContain("Contributors cannot review their own submissions");
    expect(finalSetup).toContain("values ('phase32')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase33.sql");
    expect(finalSetup).toContain("create or replace function public.submit_project_application");
    expect(finalSetup).toContain("values ('phase33')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase34.sql");
    expect(finalSetup).toContain("create or replace function public.is_project_collaborator");
    expect(finalSetup).toContain("values ('phase34')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase35.sql");
    expect(finalSetup).toContain("values ('phase35')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase36.sql");
    expect(finalSetup).toContain("values ('phase36')");
    expect(finalSetup).toContain("-- BEGIN supabase/phase37.sql");
    expect(finalSetup).toContain("values ('phase37')");
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

  test("phase 26 adds research paths, datasets, and profile enrichment", () => {
    const sql = read("supabase/phase26.sql");
    expect(sql).toContain("availability_hours_per_week");
    expect(sql).toContain("research_paths");
    expect(sql).toContain("research_path_progress");
    expect(sql).toContain("project_datasets");
    expect(sql).toContain("editorial_summary");
    expect(sql).toContain("Public reads published papers catalog");
  });

  test("phase 27 adds assigned reviewers for contributions", () => {
    const sql = read("supabase/phase27.sql");
    expect(sql).toContain("assigned_reviewer_id");
    expect(sql).toContain("assign_contribution_reviewer");
    expect(sql).toContain("contribution_row.assigned_reviewer_id = auth.uid()");
  });

  test("phase 28 exposes only evidence-safe public project output", () => {
    const sql = read("supabase/phase28.sql");
    expect(sql).toContain("grant select on table public.project_milestones to anon, authenticated");
    expect(sql).toContain(
      "grant select on table public.project_contributions to anon, authenticated",
    );
    expect(sql).toContain("to anon\n  using (visibility = 'public')");
    expect(sql).toContain(
      "to anon\n  using (visibility = 'public' and verification_status = 'verified')",
    );
    expect(sql).toContain("(visibility = 'public' and verification_status = 'verified')");
    expect(sql).toContain("to authenticated");
  });

  test("phase 29 adds weekly commitment hours for builder discovery", () => {
    const sql = read("supabase/phase29.sql");
    expect(sql).toContain("weekly_commitment_hours");
    expect(sql).toContain("projects_weekly_commitment_hours_check");
    expect(sql).toContain("values ('phase29')");
  });

  test("phase 30 validates project briefs and workspace resource links server-side", () => {
    const sql = read("supabase/phase30.sql");
    expect(sql).toContain("revoke all on table public.projects from anon");
    expect(sql).toContain("Visitors read published project catalog");
    expect(sql).toContain("to anon\n  using (published = true)");
    expect(sql).toContain("create or replace function public.validate_project_brief");
    expect(sql).toContain("validate_project_brief_trigger");
    expect(sql).toContain("Workspace links must use a safe internal path or an http(s) URL");
    expect(sql).toContain("values ('phase30')");
  });

  test("phase 31 closes authorization bypasses and seeds program cycles", () => {
    const sql = read("supabase/phase31.sql");
    expect(sql).toContain("review_competition_submission");
    expect(sql).toContain("Accept invitations through accept_invitation");
    expect(sql).toContain("review_project_deliverable");
    expect(sql).toContain('drop policy if exists "Leads assign contribution reviewers"');
    expect(sql).toContain("Leads read project memberships");
    expect(sql).toContain("'research-fellowship'");
    expect(sql).toContain("values ('phase31')");
  });

  test("phase 32 bans contribution self-review", () => {
    const sql = read("supabase/phase32.sql");
    expect(sql).toContain("Contributors cannot review their own submissions");
    expect(sql).toContain("Contributors cannot be assigned as reviewers of their own submissions");
    expect(sql).toContain("values ('phase32')");
  });

  test("phase 33 submits applications and answers atomically", () => {
    const sql = read("supabase/phase33.sql");
    expect(sql).toContain("create or replace function public.submit_project_application");
    expect(sql).toContain("for update");
    expect(sql).toContain("This project is at capacity");
    expect(sql).toContain("Answer every required application question");
    expect(sql).toContain("revoke insert on table public.project_applications from authenticated");
    expect(sql).toContain(
      "revoke insert on table public.project_application_answers from authenticated",
    );
    expect(sql).toContain(
      "revoke all on function public.submit_project_application(uuid, text, jsonb) from public",
    );
    expect(sql).toContain("values ('phase33')");
  });

  test("phase 34 grants project reads only to current collaborators", () => {
    const sql = read("supabase/phase34.sql");
    expect(sql).toContain("create or replace function public.is_project_collaborator");
    expect(sql).toContain("security definer");
    expect(sql).toContain("pm.user_id = (select auth.uid())");
    expect(sql).toContain("pm.status in ('active', 'paused')");
    expect(sql).toContain("or public.is_project_collaborator(id)");
    expect(sql).not.toContain("'alumni'");
    expect(sql).not.toContain("'removed'");
    expect(sql).toContain("values ('phase34')");
  });

  test("phase 37 binds privileged helpers to the caller and closes default execution", () => {
    const sql = read("supabase/phase37.sql");
    expect(sql).toContain("caller_id = (select auth.uid())");
    expect(sql).toContain("uid = (select auth.uid())");
    expect(sql).toContain(
      "revoke all on function public.can_notify_project_subscriber(uuid, uuid, uuid)",
    );
    expect(sql).toContain("from public, anon, authenticated");
    expect(sql).toContain("grant execute on function public.notify_users");
    expect(sql).toContain("to authenticated");
    expect(sql).toContain("values ('phase37')");
  });

  test("phase 38 enforces internal notification destinations and private trigger helpers", () => {
    const sql = read("supabase/phase38.sql");
    expect(sql).toContain("notifications_safe_href_check");
    expect(sql).toContain("href not like '//%'");
    expect(sql).toContain("position(chr(92) in href) = 0");
    expect(sql).toContain("revoke all on function public.handle_new_user()");
    expect(sql).toContain("public.promote_event_waitlist(uuid)");
    expect(sql).toContain("values ('phase38')");
  });

  test("verification and release gates require final phases", () => {
    const verifySql = read("supabase/VERIFY_SETUP.sql");
    const releaseGate = read("scripts/release-readiness.mjs");
    const schemaApply = read("scripts/apply-schema.mjs");

    expect(verifySql).toContain("('paper_analyses')");
    expect(verifySql).toContain("('invitations')");
    expect(verifySql).toContain("('project_experiments')");
    expect(verifySql).toContain("('research_paths')");
    expect(verifySql).toContain("('project_datasets')");
    expect(verifySql).toContain("('review_competition_submission')");
    expect(verifySql).toContain("('submit_project_application')");
    expect(verifySql).toContain("('is_project_collaborator')");
    expect(verifySql).toContain("definer:notification-helper-private");
    expect(verifySql).toContain("definer:authenticated-rpcs-not-anonymous");
    expect(verifySql).toContain("definer:trigger-functions-private");
    expect(verifySql).toContain(
      "(19), (20), (21), (22), (23), (24), (25), (26), (27), (28), (29), (30), (31), (32), (33), (34), (35), (36), (37), (38)",
    );
    expect(releaseGate).toContain('"phase23.sql"');
    expect(releaseGate).toContain('"phase24.sql"');
    expect(releaseGate).toContain('"phase25.sql"');
    expect(releaseGate).toContain('"phase26.sql"');
    expect(releaseGate).toContain('"phase27.sql"');
    expect(releaseGate).toContain('"phase28.sql"');
    expect(releaseGate).toContain('"phase29.sql"');
    expect(releaseGate).toContain('"phase30.sql"');
    expect(releaseGate).toContain('"phase31.sql"');
    expect(releaseGate).toContain('"phase32.sql"');
    expect(releaseGate).toContain('"phase33.sql"');
    expect(releaseGate).toContain('"phase34.sql"');
    expect(releaseGate).toContain('"phase35.sql"');
    expect(releaseGate).toContain('"phase36.sql"');
    expect(releaseGate).toContain('"phase37.sql"');
    expect(releaseGate).toContain('"phase38.sql"');
    expect(schemaApply).toContain('"supabase/phase23.sql"');
    expect(schemaApply).toContain('"supabase/phase24.sql"');
    expect(schemaApply).toContain('"supabase/phase25.sql"');
    expect(schemaApply).toContain('"supabase/phase26.sql"');
    expect(schemaApply).toContain('"supabase/phase27.sql"');
    expect(schemaApply).toContain('"supabase/phase28.sql"');
    expect(schemaApply).toContain('"supabase/phase29.sql"');
    expect(schemaApply).toContain('"supabase/phase30.sql"');
    expect(schemaApply).toContain('"supabase/phase31.sql"');
    expect(schemaApply).toContain('"supabase/phase32.sql"');
    expect(schemaApply).toContain('"supabase/phase33.sql"');
    expect(schemaApply).toContain('"supabase/phase34.sql"');
    expect(schemaApply).toContain('"supabase/phase35.sql"');
    expect(schemaApply).toContain('"supabase/phase36.sql"');
    expect(schemaApply).toContain('"supabase/phase37.sql"');
    expect(schemaApply).toContain('"supabase/phase38.sql"');
  });

  test("release checks keep public routes and the generated sitemap synchronized", () => {
    const release = readFileSync("scripts/release-readiness.mjs", "utf8");
    expect(release).toContain('run("public sitemap", "bun", ["run", "sitemap:check"]);');
    expect(release).toContain(
      'run("public portfolio manifest", "bun", ["run", "manifest:check"]);',
    );
    expect(release).toContain('run("route smoke", "bun", ["run", "smoke"]);');
    expect(release).toContain('run("ML article catalog", "bun", ["run", "guides:check"]);');
  });
});
