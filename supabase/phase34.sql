-- phase34: member workspace project visibility
-- Active/paused collaborators may read the project they belong to, including
-- an unpublished project. Removed/alumni memberships do not grant access.

create or replace function public.is_project_collaborator(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.project_memberships pm
      where pm.project_id = p_project_id
        and pm.user_id = (select auth.uid())
        and pm.status in ('active', 'paused')
    );
$$;

revoke all on function public.is_project_collaborator(uuid) from public;
grant execute on function public.is_project_collaborator(uuid) to authenticated;

drop policy if exists "Members read published projects" on public.projects;
create policy "Members read published projects" on public.projects
  for select
  to authenticated
  using (
    published = true
    or lead_id = (select auth.uid())
    or public.is_project_collaborator(id)
    or public.is_platform_admin()
  );

insert into public.schema_migrations (phase) values ('phase34')
on conflict (phase) do nothing;
