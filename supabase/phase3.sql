-- Phase 3: projects, applications, jobs, lead verification (run after phase2.sql)

-- Extend profile roles to include project_lead
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'project_lead', 'admin'));

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  type text not null check (type in ('research', 'startup', 'program')),
  status text not null default 'open' check (status in ('open', 'active', 'closed')),
  skills_needed text[] default '{}',
  tags text[] default '{}',
  lead_id uuid references public.profiles(id) on delete set null,
  capacity int not null default 5,
  team_count int not null default 0,
  published boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Project applications
create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pitch text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'waitlist')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (project_id, user_id)
);

-- Lead verification requests
create table if not exists public.lead_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- Jobs board
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  company text not null,
  location text,
  source text not null default 'external' check (source in ('internal', 'external')),
  employment_type text,
  description text not null,
  url text,
  tags text[] default '{}',
  published boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.projects enable row level security;
alter table public.project_applications enable row level security;
alter table public.lead_verification_requests enable row level security;
alter table public.jobs enable row level security;

-- Projects: members read published; leads manage own; admins all
create policy "Members read published projects"
  on public.projects for select
  using (
    published = true
    or lead_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Leads and admins insert projects"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('project_lead', 'admin')
    )
  );

create policy "Leads update own projects"
  on public.projects for update
  using (
    lead_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins delete projects"
  on public.projects for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Applications
create policy "Users read own applications"
  on public.project_applications for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.lead_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Members apply to projects"
  on public.project_applications for insert
  with check (user_id = auth.uid());

create policy "Leads update application status"
  on public.project_applications for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.lead_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Lead requests
create policy "Users read own lead requests"
  on public.lead_verification_requests for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Members request lead status"
  on public.lead_verification_requests for insert
  with check (user_id = auth.uid());

create policy "Admins review lead requests"
  on public.lead_verification_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Jobs
create policy "Members read published jobs"
  on public.jobs for select
  using (
    published = true
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins manage jobs"
  on public.jobs for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
