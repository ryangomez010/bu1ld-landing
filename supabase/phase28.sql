-- Phase 28 — Public project output archive.
-- Additive. Apply after phase27.sql.

-- RLS policies from phase19 already restrict anonymous reads to visibility = 'public'.
-- Granting SELECT makes those policy-approved rows available to the public evidence register.
revoke all on table public.project_milestones from anon;
grant select on table public.project_milestones to anon, authenticated;

revoke all on table public.project_contributions from anon;
grant select on table public.project_contributions to anon, authenticated;

-- Re-scope the phase19 policies to authenticated users. Without this, their
-- implicit PUBLIC role would also expose submitted (unverified) public rows.
drop policy if exists "Project collaborators read permitted milestones" on public.project_milestones;
create policy "Project collaborators read permitted milestones" on public.project_milestones
  for select
  to authenticated
  using (
    visibility = 'public'
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_milestones.project_id
        and pm.user_id = auth.uid()
        and pm.status in ('active', 'paused')
    )
    or exists (
      select 1 from public.projects p
      where p.id = project_milestones.project_id and p.lead_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists "Collaborators read permitted contributions" on public.project_contributions;
create policy "Collaborators read permitted contributions" on public.project_contributions
  for select
  to authenticated
  using (
    -- Evidence-safe public branch: unverified submissions stay out of the open archive.
    (visibility = 'public' and verification_status = 'verified')
    or contributor_id = auth.uid()
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_contributions.project_id
        and pm.user_id = auth.uid()
        and pm.status in ('active', 'paused')
    )
    or exists (
      select 1 from public.projects p
      where p.id = project_contributions.project_id and p.lead_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- Keep the anonymous public branch explicit and evidence-safe.
drop policy if exists "Public reads public project milestones" on public.project_milestones;
create policy "Public reads public project milestones" on public.project_milestones
  for select
  to anon
  using (visibility = 'public');

drop policy if exists "Public reads verified project contributions" on public.project_contributions;
create policy "Public reads verified project contributions" on public.project_contributions
  for select
  to anon
  using (visibility = 'public' and verification_status = 'verified');

insert into public.schema_migrations (phase) values ('phase28') on conflict (phase) do nothing;
