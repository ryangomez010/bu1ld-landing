-- Phase 24 — labs, competitions, partnerships, invitations
-- Additive migration. Apply after phase23.sql / FINAL_SETUP.sql.

create extension if not exists pgcrypto;

-- Institutional labs (public catalog + member collaboration anchor)
create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(trim(slug)) between 2 and 80),
  name text not null check (char_length(trim(name)) between 3 and 160),
  short_name text not null check (char_length(trim(short_name)) between 2 and 80),
  tagline text not null default '' check (char_length(tagline) <= 280),
  summary text not null check (char_length(trim(summary)) between 20 and 4000),
  focus text[] not null default '{}',
  methods text[] not null default '{}',
  open_roles text[] not null default '{}',
  color text not null default 'bone' check (color in ('blue', 'green', 'red', 'bone', 'violet', 'orange')),
  published boolean not null default false,
  lead_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists labs_published_idx on public.labs (published, slug);
alter table public.labs enable row level security;

drop policy if exists "Public reads published labs" on public.labs;
create policy "Public reads published labs" on public.labs for select
  using (published = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage labs" on public.labs;
create policy "Admins manage labs" on public.labs for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Optional project → lab linkage
do $$ begin
  alter table public.projects add column if not exists lab_id uuid references public.labs(id) on delete set null;
exception when others then null;
end $$;

create index if not exists projects_lab_idx on public.projects (lab_id) where lab_id is not null;

create table if not exists public.lab_memberships (
  lab_id uuid not null references public.labs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'contributor' check (member_role in ('lab_lead', 'researcher', 'contributor', 'mentor')),
  status text not null default 'active' check (status in ('active', 'paused', 'alumni', 'removed')),
  joined_at timestamptz not null default now(),
  primary key (lab_id, user_id)
);

alter table public.lab_memberships enable row level security;

drop policy if exists "Members read own lab memberships" on public.lab_memberships;
create policy "Members read own lab memberships" on public.lab_memberships for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.labs l where l.id = lab_id and l.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins and lab leads manage lab memberships" on public.lab_memberships;
create policy "Admins and lab leads manage lab memberships" on public.lab_memberships for all
  using (
    exists (select 1 from public.labs l where l.id = lab_id and l.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.labs l where l.id = lab_id and l.lead_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Competitions
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(trim(slug)) between 2 and 80),
  title text not null check (char_length(trim(title)) between 3 and 160),
  summary text not null check (char_length(trim(summary)) between 20 and 4000),
  status text not null default 'upcoming' check (status in ('upcoming', 'open', 'judging', 'closed')),
  prize text not null default '' check (char_length(prize) <= 280),
  deadline date,
  lab_id uuid references public.labs(id) on delete set null,
  evaluation_protocol text not null default '' check (char_length(evaluation_protocol) <= 8000),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists competitions_status_idx on public.competitions (published, status, deadline);
alter table public.competitions enable row level security;

drop policy if exists "Public reads published competitions" on public.competitions;
create policy "Public reads published competitions" on public.competitions for select
  using (published = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage competitions" on public.competitions;
create policy "Admins manage competitions" on public.competitions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.competition_submissions (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  summary text not null check (char_length(trim(summary)) between 20 and 4000),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  status text not null default 'submitted' check (status in ('submitted', 'accepted', 'rejected', 'withdrawn')),
  score numeric,
  review_note text check (review_note is null or char_length(review_note) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, submitter_id)
);

alter table public.competition_submissions enable row level security;

drop policy if exists "Members manage own competition submissions" on public.competition_submissions;
create policy "Members manage own competition submissions" on public.competition_submissions for all
  using (
    submitter_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (submitter_id = auth.uid());

drop policy if exists "Admins review competition submissions" on public.competition_submissions;
create policy "Admins review competition submissions" on public.competition_submissions for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Partnerships (public disclosure ledger)
create table if not exists public.partnerships (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  kind text not null check (kind in ('academic', 'industry', 'community', 'infrastructure')),
  summary text not null check (char_length(trim(summary)) between 20 and 2000),
  status text not null default 'exploring' check (status in ('active', 'exploring', 'ended')),
  published boolean not null default false,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partnerships enable row level security;

drop policy if exists "Public reads published partnerships" on public.partnerships;
create policy "Public reads published partnerships" on public.partnerships for select
  using (published = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage partnerships" on public.partnerships;
create policy "Admins manage partnerships" on public.partnerships for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Team invitations (email or member id)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  invite_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invitation_type text not null check (invitation_type in ('project', 'lab', 'program')),
  target_id uuid not null,
  email text check (email is null or email ~* '^[^@]+@[^@]+\.[^@]+$'),
  invitee_id uuid references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  role_offered text not null default 'contributor',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  message text check (message is null or char_length(message) <= 2000),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (email is not null or invitee_id is not null)
);

create index if not exists invitations_invitee_idx on public.invitations (invitee_id, status);
create index if not exists invitations_token_idx on public.invitations (invite_token) where status = 'pending';
alter table public.invitations enable row level security;

drop policy if exists "Invitees and inviters read invitations" on public.invitations;
create policy "Invitees and inviters read invitations" on public.invitations for select
  using (
    invitee_id = auth.uid()
    or invited_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Leads and admins create invitations" on public.invitations;
create policy "Leads and admins create invitations" on public.invitations for insert
  with check (
    invited_by = auth.uid()
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'project_lead'))
      or exists (select 1 from public.member_roles mr where mr.user_id = auth.uid() and mr.role in ('project_lead', 'administrator', 'mentor'))
    )
  );

drop policy if exists "Invitees update own invitation status" on public.invitations;
create policy "Invitees update own invitation status" on public.invitations for update
  using (
    invitee_id = auth.uid()
    or invited_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    invitee_id = auth.uid()
    or invited_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Expand institutional roles for founders / lab leads / super-admin mapping
-- (member_roles check constraint widened via drop/recreate if present)
do $$ begin
  alter table public.member_roles drop constraint if exists member_roles_role_check;
  alter table public.member_roles add constraint member_roles_role_check
    check (role in (
      'researcher',
      'project_lead',
      'reviewer',
      'mentor',
      'administrator',
      'lab_lead',
      'startup_founder',
      'applicant'
    ));
exception when others then null;
end $$;

-- Program types: include incubation + competition for portal listings
do $$ begin
  alter table public.programs drop constraint if exists programs_program_type_check;
  alter table public.programs add constraint programs_program_type_check
    check (program_type in ('cohort', 'fellowship', 'workshop', 'incubation', 'competition'));
exception when others then null;
end $$;

insert into public.schema_migrations (version, applied_at)
values ('phase24', now())
on conflict (version) do nothing;

-- Accepting a project invitation creates / reactivates membership when still pending.
create or replace function public.accept_invitation(p_invitation_id uuid)
returns public.invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.invitations where id = p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if inv.invitee_id is distinct from auth.uid() and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Not authorized';
  end if;
  if inv.status <> 'pending' then raise exception 'Invitation is not pending'; end if;
  if inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = inv.id;
    raise exception 'Invitation expired';
  end if;

  if inv.invitation_type = 'project' then
    insert into public.project_memberships (project_id, user_id, member_role, status)
    values (inv.target_id, coalesce(inv.invitee_id, auth.uid()), inv.role_offered, 'active')
    on conflict (project_id, user_id) do update
      set status = 'active', member_role = excluded.member_role, left_at = null;
  elsif inv.invitation_type = 'lab' then
    insert into public.lab_memberships (lab_id, user_id, member_role, status)
    values (inv.target_id, coalesce(inv.invitee_id, auth.uid()), inv.role_offered, 'active')
    on conflict (lab_id, user_id) do update
      set status = 'active', member_role = excluded.member_role;
  end if;

  update public.invitations
    set status = 'accepted', accepted_at = now(), invitee_id = coalesce(invitee_id, auth.uid())
    where id = inv.id
    returning * into inv;
  return inv;
end;
$$;

revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;
