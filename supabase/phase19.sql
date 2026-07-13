-- Phase 19 — institutional research operations, private collaboration, and role hardening
-- Apply after phase18.sql. This migration is intentionally additive so existing member data remains valid.

-- Roles are additive: a person can be a researcher and a mentor while retaining their primary
-- legacy role for compatibility with the existing member portal.
create table if not exists public.member_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('researcher', 'project_lead', 'reviewer', 'mentor', 'administrator')),
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.member_roles enable row level security;

create or replace function public.has_institution_role(p_user_id uuid, p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id = auth.uid()
    and (
      exists (select 1 from public.profiles p where p.id = p_user_id and p.role = 'admin')
      or exists (
        select 1 from public.member_roles mr
        where mr.user_id = p_user_id and mr.role = p_role
      )
      or (p_role = 'project_lead' and exists (
        select 1 from public.profiles p where p.id = p_user_id and p.role = 'project_lead'
      ))
    );
$$;

drop policy if exists "Members read own roles" on public.member_roles;
create policy "Members read own roles" on public.member_roles for select
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage member roles" on public.member_roles;
create policy "Admins manage member roles" on public.member_roles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- A project member is a durable collaboration record, unlike an application status.
create table if not exists public.project_memberships (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'contributor' check (member_role in ('lead', 'contributor', 'mentor', 'reviewer')),
  status text not null default 'active' check (status in ('active', 'paused', 'alumni', 'removed')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id),
  check ((status in ('active', 'paused')) or left_at is not null)
);

create index if not exists project_memberships_user_idx on public.project_memberships (user_id, status);
alter table public.project_memberships enable row level security;

drop policy if exists "Members read their project memberships" on public.project_memberships;
create policy "Members read their project memberships" on public.project_memberships for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Leads manage project memberships" on public.project_memberships;
create policy "Leads manage project memberships" on public.project_memberships for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'blocked', 'completed')),
  visibility text not null default 'team' check (visibility in ('team', 'public')),
  due_date date,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_milestones_project_idx on public.project_milestones (project_id, created_at desc);
alter table public.project_milestones enable row level security;

drop policy if exists "Project collaborators read permitted milestones" on public.project_milestones;
create policy "Project collaborators read permitted milestones" on public.project_milestones for select
  using (
    visibility = 'public'
    or exists (select 1 from public.project_memberships pm where pm.project_id = project_milestones.project_id and pm.user_id = auth.uid() and pm.status in ('active', 'paused'))
    or exists (select 1 from public.projects p where p.id = project_milestones.project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Leads manage project milestones" on public.project_milestones;
create policy "Leads manage project milestones" on public.project_milestones for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    created_by = auth.uid()
    and (
      exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

create table if not exists public.project_contributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  contributor_id uuid not null references public.profiles(id) on delete restrict,
  contribution_type text not null check (contribution_type in ('research', 'experiment', 'code', 'review', 'design', 'product', 'operations')),
  title text not null check (char_length(trim(title)) between 3 and 160),
  summary text not null check (char_length(trim(summary)) between 20 and 4000),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  visibility text not null default 'team' check (visibility in ('team', 'public')),
  verification_status text not null default 'submitted' check (verification_status in ('submitted', 'verified', 'needs_changes')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_contributions_project_idx on public.project_contributions (project_id, created_at desc);
create index if not exists project_contributions_contributor_idx on public.project_contributions (contributor_id, created_at desc);
alter table public.project_contributions enable row level security;

drop policy if exists "Collaborators read permitted contributions" on public.project_contributions;
create policy "Collaborators read permitted contributions" on public.project_contributions for select
  using (
    visibility = 'public'
    or contributor_id = auth.uid()
    or exists (select 1 from public.project_memberships pm where pm.project_id = project_contributions.project_id and pm.user_id = auth.uid() and pm.status in ('active', 'paused'))
    or exists (select 1 from public.projects p where p.id = project_contributions.project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Collaborators submit contributions" on public.project_contributions;
create policy "Collaborators submit contributions" on public.project_contributions for insert
  with check (
    contributor_id = auth.uid()
    and exists (select 1 from public.project_memberships pm where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status in ('active', 'paused'))
  );

drop policy if exists "Contributors update drafts and leads verify" on public.project_contributions;
create policy "Contributors update drafts and leads verify" on public.project_contributions for update
  using (
    contributor_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    contributor_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Applications are reviewed server-side. Acceptance is atomic and cannot exceed capacity.
create or replace function public.review_project_application(
  p_application_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.project_applications;
  project_row public.projects;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;

  select * into app from public.project_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into project_row from public.projects where id = app.project_id for update;
  if project_row.lead_id <> auth.uid() and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Not authorized';
  end if;

  if p_status = 'accepted' and app.status <> 'accepted' then
    if (select count(*) from public.project_memberships pm where pm.project_id = app.project_id and pm.member_role = 'contributor' and pm.status in ('active', 'paused')) >= project_row.capacity then
      raise exception 'Project capacity has been reached';
    end if;
    insert into public.project_memberships (project_id, user_id, member_role, status)
    values (app.project_id, app.user_id, 'contributor', 'active')
    on conflict (project_id, user_id) do update set status = 'active', left_at = null;
  elsif app.status = 'accepted' and p_status <> 'accepted' then
    update public.project_memberships
      set status = 'removed', left_at = now()
      where project_id = app.project_id and user_id = app.user_id;
  end if;

  update public.projects
    set team_count = (select count(*) from public.project_memberships pm where pm.project_id = app.project_id and pm.member_role = 'contributor' and pm.status in ('active', 'paused')),
        updated_at = now()
    where id = app.project_id;

  update public.project_applications
    set status = p_status, updated_at = now()
    where id = p_application_id
    returning * into app;
  return app;
end;
$$;

revoke all on function public.review_project_application(uuid, text, text) from public;
grant execute on function public.review_project_application(uuid, text, text) to authenticated;

-- Project updates are collaboration records, not a public feed.
drop policy if exists "Members read project updates" on public.project_updates;
create policy "Collaborators read project updates" on public.project_updates for select
  using (
    author_id = auth.uid()
    or exists (select 1 from public.project_memberships pm where pm.project_id = project_updates.project_id and pm.user_id = auth.uid() and pm.status in ('active', 'paused'))
    or exists (select 1 from public.projects p where p.id = project_updates.project_id and p.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Leads insert project updates" on public.project_updates;
create policy "Collaborators insert project updates" on public.project_updates for insert
  with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.project_memberships pm where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status in ('active', 'paused'))
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

-- Programme records are intentionally separate from research/startup projects.
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null check (char_length(trim(title)) between 3 and 160),
  program_type text not null check (program_type in ('cohort', 'fellowship', 'workshop')),
  summary text not null check (char_length(trim(summary)) between 20 and 2000),
  application_instructions text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int check (capacity is null or capacity > 0),
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_applications (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  statement text not null check (char_length(trim(statement)) between 40 and 4000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'waitlist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, user_id)
);

alter table public.programs enable row level security;
alter table public.program_applications enable row level security;

create policy "Members read published programs" on public.programs for select
  using (published or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins manage programs" on public.programs for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Applicants read own program applications" on public.program_applications for select
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Members apply to programs" on public.program_applications for insert with check (user_id = auth.uid());
create policy "Admins review program applications" on public.program_applications for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Paper-library metadata makes review, explainer, and research-note status explicit.
alter table public.papers
  add column if not exists content_kind text not null default 'review' check (content_kind in ('review', 'explainer', 'research_note')),
  add column if not exists field text,
  add column if not exists difficulty text check (difficulty is null or difficulty in ('introductory', 'intermediate', 'advanced')),
  add column if not exists source_url text check (source_url is null or source_url ~ '^https?://'),
  add column if not exists reviewer_id uuid references public.profiles(id) on delete set null,
  add column if not exists review_status text not null default 'published' check (review_status in ('draft', 'in_review', 'published'));

-- Basic database-level safety checks for private artifacts.
create or replace function public.assert_private_collaboration_tables()
returns table (check_name text, passed boolean)
language sql
stable
security definer
set search_path = public
as $$
  select 'project_applications_rls', (select relrowsecurity from pg_class where oid = 'public.project_applications'::regclass)
  union all select 'project_memberships_rls', (select relrowsecurity from pg_class where oid = 'public.project_memberships'::regclass)
  union all select 'project_contributions_rls', (select relrowsecurity from pg_class where oid = 'public.project_contributions'::regclass)
  union all select 'program_applications_rls', (select relrowsecurity from pg_class where oid = 'public.program_applications'::regclass);
$$;
revoke all on function public.assert_private_collaboration_tables() from public;
grant execute on function public.assert_private_collaboration_tables() to authenticated;

insert into public.schema_migrations (phase) values ('phase19') on conflict (phase) do nothing;
