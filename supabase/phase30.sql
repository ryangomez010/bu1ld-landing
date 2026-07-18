-- Phase 30 — Server-side project brief validation.
-- Additive. Apply after phase29.sql.

-- Visitors can inspect only the fields needed to evaluate published opportunities.
-- Internal workspace links and Discord coordinates remain available to authenticated collaborators.
revoke all on table public.projects from anon;
grant select (
  id, slug, title, description, type, status, skills_needed, tags, lead_name,
  capacity, team_count, published, publication_status, lab_id,
  weekly_commitment_hours, created_at, updated_at
) on table public.projects to anon;

drop policy if exists "Members read published projects" on public.projects;
create policy "Members read published projects" on public.projects
  for select
  to authenticated
  using (
    published = true
    or lead_id = auth.uid()
    or public.is_platform_admin()
  );

drop policy if exists "Visitors read published project catalog" on public.projects;
create policy "Visitors read published project catalog" on public.projects
  for select
  to anon
  using (published = true);

create or replace function public.validate_project_brief()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare resource jsonb;
declare resource_url text;
begin
  new.title := trim(new.title);
  new.description := trim(new.description);

  if char_length(new.title) < 3 or char_length(new.title) > 120 then
    raise exception 'Project title must be between 3 and 120 characters';
  end if;
  if char_length(new.description) < 20 or char_length(new.description) > 4000 then
    raise exception 'Project description must be between 20 and 4000 characters';
  end if;
  if new.capacity < 1 or new.capacity > 50 then
    raise exception 'Project capacity must be between 1 and 50';
  end if;
  if cardinality(new.skills_needed) > 20 or cardinality(new.tags) > 20 then
    raise exception 'Projects support at most 20 skills and 20 topic tags';
  end if;
  if exists (
    select 1 from unnest(coalesce(new.skills_needed, '{}'::text[]) || coalesce(new.tags, '{}'::text[])) item
    where char_length(trim(item)) = 0 or char_length(trim(item)) > 40
  ) then
    raise exception 'Project skills and tags must contain 1 to 40 characters';
  end if;
  if new.discord_url is not null
     and (char_length(new.discord_url) > 500 or new.discord_url !~* '^https?://') then
    raise exception 'Project Discord URL must be an http(s) URL';
  end if;

  if jsonb_typeof(coalesce(new.workspace_links, '[]'::jsonb)) <> 'array' then
    raise exception 'Project workspace links must be an array';
  end if;
  if jsonb_array_length(coalesce(new.workspace_links, '[]'::jsonb)) > 20 then
    raise exception 'Projects support at most 20 workspace links';
  end if;

  for resource in
    select value from jsonb_array_elements(coalesce(new.workspace_links, '[]'::jsonb))
  loop
    if jsonb_typeof(resource) <> 'object'
       or char_length(trim(coalesce(resource ->> 'label', ''))) not between 1 and 80 then
      raise exception 'Each workspace link requires a label between 1 and 80 characters';
    end if;
    resource_url := trim(coalesce(resource ->> 'url', ''));
    if char_length(resource_url) = 0
       or char_length(resource_url) > 500
       or not (
         resource_url ~ '^/([^/\\]|$)'
         or resource_url ~* '^https?://'
       ) then
      raise exception 'Workspace links must use a safe internal path or an http(s) URL';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists validate_project_brief_trigger on public.projects;
create trigger validate_project_brief_trigger
  before insert or update of title, description, capacity, skills_needed, tags, discord_url, workspace_links
  on public.projects
  for each row execute function public.validate_project_brief();

insert into public.schema_migrations (phase)
values ('phase30')
on conflict (phase) do nothing;
