-- BEGIN supabase/full-setup.sql

-- ═══════════════════════════════════════════════════════════════════════════
-- schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- The Bu1ld — profiles table (run in Supabase SQL editor)

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  bio text,
  background text check (background in ('researcher', 'engineer', 'founder', 'student', 'other')),
  interests text[] default '{}',
  github_url text,
  linkedin_url text,
  timezone text,
  onboarding_completed boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- phase2.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Phase 2: content tables (run after schema.sql)

-- Add admin role to profiles
alter table public.profiles
  add column if not exists role text default 'member'
    check (role in ('member', 'admin'));

-- Events (conferences, meetups, deadlines)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  location text,
  start_date date,
  end_date date,
  topics text[] default '{}',
  prep_notes text,
  resources jsonb default '[]',
  deadlines jsonb default '[]',
  url text,
  published boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Paper reviews
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  authors text,
  year int,
  arxiv_url text,
  tags text[] default '{}',
  is_classic boolean default false,
  summary text,
  review_body text not null,
  published boolean default true,
  published_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Newsletter issues
create table if not exists public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  issue_number int,
  summary text,
  body text not null,
  published boolean default true,
  published_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Guide scroll progress (not comprehension — scroll depth only)
create table if not exists public.reading_progress (
  user_id uuid references auth.users on delete cascade,
  guide_slug text not null,
  progress_percent int default 0 check (progress_percent >= 0 and progress_percent <= 100),
  updated_at timestamptz default now() not null,
  primary key (user_id, guide_slug)
);

-- RLS
alter table public.events enable row level security;
alter table public.papers enable row level security;
alter table public.newsletter_issues enable row level security;
alter table public.reading_progress enable row level security;

-- Members read published content
create policy "Members read published events"
  on public.events for select
  using (published = true or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Members read published papers"
  on public.papers for select
  using (published = true or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Members read published newsletters"
  on public.newsletter_issues for select
  using (published = true or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Admins manage content
create policy "Admins manage events"
  on public.events for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins manage papers"
  on public.papers for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins manage newsletters"
  on public.newsletter_issues for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Reading progress: own rows only
create policy "Users manage own reading progress"
  on public.reading_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- phase3.sql
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- phase4.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Phase 4: notifications, saved items (run after phase3.sql)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  body text not null,
  href text,
  read boolean default false,
  created_at timestamptz default now() not null
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  item_type text not null check (item_type in ('event', 'paper', 'project', 'job', 'guide', 'newsletter')),
  item_slug text not null,
  item_title text not null,
  created_at timestamptz default now() not null,
  unique (user_id, item_type, item_slug)
);

alter table public.notifications enable row level security;
alter table public.saved_items enable row level security;

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "System insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users manage own saved items"
  on public.saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can list all profiles (for member management)
create policy "Admins read all profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read, created_at desc);

create index if not exists saved_items_user_idx
  on public.saved_items (user_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- phase5.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Phase 5: announcements, project discord links (run after phase4.sql)

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  href text,
  pinned boolean default false,
  published boolean default true,
  created_at timestamptz default now() not null
);

alter table public.projects
  add column if not exists discord_url text;

alter table public.announcements enable row level security;

create policy "Members read published announcements"
  on public.announcements for select
  using (published = true);

create policy "Admins manage announcements"
  on public.announcements for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists announcements_pinned_idx
  on public.announcements (pinned desc, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- phase6.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Phase 6 — admin member role updates + content moderation policies
-- Run after phase5.sql

-- Admins can update any profile (role changes, etc.)
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- phase7.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Phase 7 — security hardening (run after phase6.sql)
-- Fixes: role self-escalation, notification fan-out, lead profile reads,
-- members-only content, project lead_id binding, notification deletes.

-- ─── Profiles: prevent non-admins from changing role ───────────────────────
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- Tighten user update policy — role column protected by trigger above
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Project leads can read profiles of applicants to their projects
drop policy if exists "Leads read applicant profiles" on public.profiles;
create policy "Leads read applicant profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.project_applications pa
      join public.projects pr on pr.id = pa.project_id
      where pa.user_id = profiles.id
        and pr.lead_id = auth.uid()
    )
  );

-- ─── Notifications: admin fan-out + user dismiss ───────────────────────────
drop policy if exists "System insert notifications" on public.notifications;
create policy "Users insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Admins insert notifications"
  on public.notifications for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ─── Projects: bind lead_id on insert + lead_name column ─────────────────────
alter table public.projects add column if not exists lead_name text;

drop policy if exists "Leads and admins insert projects" on public.projects;
create policy "Leads and admins insert projects"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('project_lead', 'admin')
    )
    and (
      lead_id is null
      or lead_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

-- ─── Members-only content reads (require authenticated session) ──────────────
drop policy if exists "Members read published events" on public.events;
create policy "Members read published events"
  on public.events for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published papers" on public.papers;
create policy "Members read published papers"
  on public.papers for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published newsletters" on public.newsletter_issues;
create policy "Members read published newsletters"
  on public.newsletter_issues for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published projects" on public.projects;
create policy "Members read published projects"
  on public.projects for select
  using (
    auth.uid() is not null
    and (
      published = true
      or lead_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published jobs" on public.jobs;
create policy "Members read published jobs"
  on public.jobs for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

-- Announcements (phase5)
drop policy if exists "Members read published announcements" on public.announcements;
create policy "Members read published announcements"
  on public.announcements for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

-- Phase 8 — additional security constraints (see supabase/phase8.sql)
alter table public.profiles
  drop constraint if exists profiles_full_name_len,
  add constraint profiles_full_name_len check (char_length(full_name) <= 120);

alter table public.profiles
  drop constraint if exists profiles_bio_len,
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 2000);

alter table public.profiles
  drop constraint if exists profiles_github_url_len,
  add constraint profiles_github_url_len check (github_url is null or char_length(github_url) <= 500);

alter table public.profiles
  drop constraint if exists profiles_linkedin_url_len,
  add constraint profiles_linkedin_url_len check (linkedin_url is null or char_length(linkedin_url) <= 500);

alter table public.notifications
  drop constraint if exists notifications_title_len,
  add constraint notifications_title_len check (char_length(title) <= 200);

alter table public.notifications
  drop constraint if exists notifications_body_len,
  add constraint notifications_body_len check (char_length(body) <= 500);

alter table public.notifications
  drop constraint if exists notifications_href_safe,
  add constraint notifications_href_safe check (
    href is null
    or (
      href ~ '^/[^/]'
      and href !~ '[:\\]'
      and char_length(href) <= 500
    )
  );

alter table public.announcements
  drop constraint if exists announcements_title_len,
  add constraint announcements_title_len check (char_length(title) <= 200);

alter table public.announcements
  drop constraint if exists announcements_body_len,
  add constraint announcements_body_len check (char_length(body) <= 5000);

alter table public.project_applications
  drop constraint if exists project_applications_pitch_len,
  add constraint project_applications_pitch_len check (char_length(pitch) <= 4000);

create or replace function public.default_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is distinct from 'member' then
      if not exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      ) then
        new.role := 'member';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists default_profile_role_trigger on public.profiles;
create trigger default_profile_role_trigger
  before insert on public.profiles
  for each row
  execute function public.default_profile_role();

-- Phase 9 — member directory + project updates (see supabase/phase9.sql)
drop policy if exists "Members read directory profiles" on public.profiles;
create policy "Members read directory profiles"
  on public.profiles for select
  using (
    auth.uid() is not null
    and onboarding_completed = true
  );

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_idx
  on public.project_updates (project_id, created_at desc);

alter table public.project_updates enable row level security;

drop policy if exists "Members read project updates" on public.project_updates;
create policy "Members read project updates"
  on public.project_updates for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.projects p
      where p.id = project_updates.project_id
      and (
        p.published = true
        or p.lead_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
    )
  );

drop policy if exists "Leads insert project updates" on public.project_updates;
create policy "Leads insert project updates"
  on public.project_updates for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.projects
      where id = project_id and lead_id = auth.uid()
    )
  );

drop policy if exists "Leads delete own project updates" on public.project_updates;
create policy "Leads delete own project updates"
  on public.project_updates for delete
  using (author_id = auth.uid());

-- Phase 10 — membership hardening (see supabase/phase10.sql)

alter table public.profiles
  add column if not exists directory_visible boolean not null default true;

drop policy if exists "Members read directory profiles" on public.profiles;
create policy "Members read directory profiles"
  on public.profiles for select
  using (
    auth.uid() is not null
    and onboarding_completed = true
    and coalesce(directory_visible, true) = true
  );

create table if not exists public.paper_reads (
  user_id uuid references public.profiles(id) on delete cascade not null,
  paper_slug text not null check (char_length(paper_slug) <= 200),
  read_at timestamptz not null default now(),
  primary key (user_id, paper_slug)
);

alter table public.paper_reads enable row level security;

drop policy if exists "Users read own paper reads" on public.paper_reads;
create policy "Users read own paper reads"
  on public.paper_reads for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own paper reads" on public.paper_reads;
create policy "Users insert own paper reads"
  on public.paper_reads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own paper reads" on public.paper_reads;
create policy "Users delete own paper reads"
  on public.paper_reads for delete
  using (auth.uid() = user_id);

create table if not exists public.event_rsvps (
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);

alter table public.event_rsvps enable row level security;

drop policy if exists "Members read event rsvps" on public.event_rsvps;
create policy "Members read event rsvps"
  on public.event_rsvps for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.events e
      where e.id = event_rsvps.event_id
      and (
        e.published = true
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
    )
  );

drop policy if exists "Users manage own event rsvps" on public.event_rsvps;
create policy "Users manage own event rsvps"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own event rsvps" on public.event_rsvps;
create policy "Users delete own event rsvps"
  on public.event_rsvps for delete
  using (auth.uid() = user_id);

-- Phase 11 — paper notes/progress sync + newsletter subscriptions

alter table public.paper_reads
  add column if not exists scroll_percent smallint not null default 0
    check (scroll_percent >= 0 and scroll_percent <= 100);

alter table public.paper_reads
  add column if not exists notes text check (notes is null or char_length(notes) <= 4000);

drop policy if exists "Users update own paper reads" on public.paper_reads;
create policy "Users update own paper reads"
  on public.paper_reads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.newsletter_subscriptions (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  subscribed boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions enable row level security;

drop policy if exists "Users read own newsletter subscription" on public.newsletter_subscriptions;
create policy "Users read own newsletter subscription"
  on public.newsletter_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage own newsletter subscription" on public.newsletter_subscriptions;
create policy "Users manage own newsletter subscription"
  on public.newsletter_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own newsletter subscription" on public.newsletter_subscriptions;
create policy "Users update own newsletter subscription"
  on public.newsletter_subscriptions for update
  using (auth.uid() = user_id);

-- Phase 12 — portal search RPC, admin audit log, project workspace links

alter table public.projects
  add column if not exists workspace_links jsonb not null default '[]'::jsonb;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) <= 120),
  target_type text check (target_type is null or char_length(target_type) <= 60),
  target_id text check (target_id is null or char_length(target_id) <= 200),
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log"
  on public.admin_audit_log for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins insert audit log" on public.admin_audit_log;
create policy "Admins insert audit log"
  on public.admin_audit_log for insert
  with check (
    auth.uid() = actor_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create or replace function public.search_portal_content(search_query text)
returns table (
  content_type text,
  slug text,
  title text,
  summary text,
  rank integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := trim(search_query);
  like_q text;
begin
  if auth.uid() is null or length(q) < 2 then
    return;
  end if;

  like_q := '%' || replace(replace(q, '%', ''), '_', '') || '%';

  return query
  select * from (
    select
      'paper'::text,
      p.slug,
      p.title,
      coalesce(p.summary, ''),
      (case when p.title ilike like_q then 12 else 0 end)
        + (case when p.summary ilike like_q then 6 else 0 end)
        + (case when p.review_body ilike like_q then 3 else 0 end)
    from public.papers p
    where p.published
      and (p.title ilike like_q or p.summary ilike like_q or p.review_body ilike like_q)

    union all

    select
      'event'::text,
      e.slug,
      e.title,
      coalesce(e.summary, ''),
      (case when e.title ilike like_q then 12 else 0 end)
        + (case when e.summary ilike like_q then 5 else 0 end)
    from public.events e
    where e.published
      and (e.title ilike like_q or e.summary ilike like_q)

    union all

    select
      'project'::text,
      pr.slug,
      pr.title,
      left(pr.description, 160),
      (case when pr.title ilike like_q then 12 else 0 end)
        + (case when pr.description ilike like_q then 4 else 0 end)
    from public.projects pr
    where pr.published
      and (pr.title ilike like_q or pr.description ilike like_q)

    union all

    select
      'job'::text,
      j.slug,
      j.title,
      left(j.company || ' — ' || j.description, 160),
      (case when j.title ilike like_q then 10 else 0 end)
        + (case when j.description ilike like_q then 4 else 0 end)
    from public.jobs j
    where j.published
      and (j.title ilike like_q or j.description ilike like_q or j.company ilike like_q)

    union all

    select
      'newsletter'::text,
      n.slug,
      n.title,
      coalesce(n.summary, ''),
      (case when n.title ilike like_q then 10 else 0 end)
        + (case when n.summary ilike like_q then 4 else 0 end)
    from public.newsletter_issues n
    where n.published
      and (n.title ilike like_q or n.summary ilike like_q)
  ) hits
  where rank > 0
  order by rank desc, title asc
  limit 40;
end;
$$;

revoke all on function public.search_portal_content(text) from public;
grant execute on function public.search_portal_content(text) to authenticated;
-- Phase 13 — saved collections, account deletion RPC, security event log

create table if not exists public.saved_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1 and char_length(name) <= 80),
  description text check (description is null or char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists saved_collections_user_idx on public.saved_collections (user_id, updated_at desc);

create table if not exists public.saved_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.saved_collections(id) on delete cascade,
  item_type text not null check (item_type in ('event', 'paper', 'project', 'job', 'guide', 'newsletter')),
  item_slug text not null check (char_length(item_slug) <= 200),
  item_title text not null check (char_length(item_title) <= 300),
  created_at timestamptz not null default now(),
  unique (collection_id, item_type, item_slug)
);

create index if not exists saved_collection_items_collection_idx
  on public.saved_collection_items (collection_id, created_at desc);

alter table public.saved_collections enable row level security;
alter table public.saved_collection_items enable row level security;

drop policy if exists "Users read own collections" on public.saved_collections;
create policy "Users read own collections"
  on public.saved_collections for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own collections" on public.saved_collections;
create policy "Users insert own collections"
  on public.saved_collections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own collections" on public.saved_collections;
create policy "Users update own collections"
  on public.saved_collections for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own collections" on public.saved_collections;
create policy "Users delete own collections"
  on public.saved_collections for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own collection items" on public.saved_collection_items;
create policy "Users read own collection items"
  on public.saved_collection_items for select
  using (
    exists (
      select 1 from public.saved_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own collection items" on public.saved_collection_items;
create policy "Users insert own collection items"
  on public.saved_collection_items for insert
  with check (
    exists (
      select 1 from public.saved_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own collection items" on public.saved_collection_items;
create policy "Users delete own collection items"
  on public.saved_collection_items for delete
  using (
    exists (
      select 1 from public.saved_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (char_length(event_type) <= 60),
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_created_idx on public.security_events (created_at desc);
create index if not exists security_events_user_idx on public.security_events (user_id, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists "Users read own security events" on public.security_events;
create policy "Users read own security events"
  on public.security_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own security events" on public.security_events;
create policy "Users insert own security events"
  on public.security_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all security events" on public.security_events;
create policy "Admins read all security events"
  on public.security_events for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Anonymize member data; auth.users deletion requires service role / dashboard.
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles set
    full_name = 'Deleted member',
    bio = null,
    github_url = null,
    linkedin_url = null,
    interests = '{}',
    timezone = null,
    directory_visible = false,
    onboarding_completed = false,
    updated_at = now()
  where id = uid;

  delete from public.saved_items where user_id = uid;
  delete from public.saved_collection_items
    where collection_id in (select id from public.saved_collections where user_id = uid);
  delete from public.saved_collections where user_id = uid;
  delete from public.notifications where user_id = uid;
  delete from public.project_applications where user_id = uid;
  delete from public.reading_progress where user_id = uid;
  delete from public.paper_reads where user_id = uid;
  delete from public.newsletter_subscriptions where user_id = uid;

  insert into public.security_events (user_id, event_type, detail)
  values (uid, 'account_deletion_requested', jsonb_build_object('at', now()));
end;
$$;

revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;

-- Phase 14 — member engagement: preferences, streaks, highlights, follows, endorsements, jobs, feedback

alter table public.profiles
  add column if not exists profile_slug text unique,
  add column if not exists weekly_paper_goal int not null default 2 check (weekly_paper_goal between 1 and 20);

create index if not exists profiles_profile_slug_idx on public.profiles (profile_slug) where profile_slug is not null;

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pref_key text not null check (pref_key in (
    'application', 'project_update', 'mention', 'announcement', 'event', 'digest'
  )),
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, pref_key)
);

create index if not exists notification_preferences_user_idx on public.notification_preferences (user_id);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users manage own notification prefs" on public.notification_preferences;
create policy "Users manage own notification prefs"
  on public.notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.reading_activity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  papers_read int not null default 0 check (papers_read >= 0),
  primary key (user_id, activity_date)
);

create index if not exists reading_activity_user_idx on public.reading_activity (user_id, activity_date desc);

alter table public.reading_activity enable row level security;

drop policy if exists "Users manage own reading activity" on public.reading_activity;
create policy "Users manage own reading activity"
  on public.reading_activity for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.paper_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  paper_slug text not null check (char_length(paper_slug) <= 200),
  highlighted_text text not null check (char_length(highlighted_text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists paper_highlights_user_paper_idx
  on public.paper_highlights (user_id, paper_slug, created_at desc);

alter table public.paper_highlights enable row level security;

drop policy if exists "Users manage own paper highlights" on public.paper_highlights;
create policy "Users manage own paper highlights"
  on public.paper_highlights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.project_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  notify_updates boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create index if not exists project_follows_user_idx on public.project_follows (user_id, created_at desc);
create index if not exists project_follows_project_idx on public.project_follows (project_id);

alter table public.project_follows enable row level security;

drop policy if exists "Users manage own project follows" on public.project_follows;
create policy "Users manage own project follows"
  on public.project_follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.skill_endorsements (
  id uuid primary key default gen_random_uuid(),
  endorser_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null check (char_length(skill) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (endorser_id, profile_id, skill),
  check (endorser_id <> profile_id)
);

create index if not exists skill_endorsements_profile_idx on public.skill_endorsements (profile_id, created_at desc);

alter table public.skill_endorsements enable row level security;

drop policy if exists "Anyone reads endorsements" on public.skill_endorsements;
create policy "Anyone reads endorsements"
  on public.skill_endorsements for select
  using (true);

drop policy if exists "Users insert own endorsements" on public.skill_endorsements;
create policy "Users insert own endorsements"
  on public.skill_endorsements for insert
  with check (auth.uid() = endorser_id);

drop policy if exists "Users delete own endorsements" on public.skill_endorsements;
create policy "Users delete own endorsements"
  on public.skill_endorsements for delete
  using (auth.uid() = endorser_id);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_slug text not null check (char_length(job_slug) <= 200),
  job_title text not null check (char_length(job_title) <= 300),
  status text not null default 'applied' check (status in ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_slug)
);

create index if not exists job_applications_user_idx on public.job_applications (user_id, updated_at desc);

alter table public.job_applications enable row level security;

drop policy if exists "Users manage own job applications" on public.job_applications;
create policy "Users manage own job applications"
  on public.job_applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.member_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'general' check (category in ('bug', 'feature', 'content', 'general')),
  body text not null check (char_length(trim(body)) between 10 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists member_feedback_created_idx on public.member_feedback (created_at desc);

alter table public.member_feedback enable row level security;

drop policy if exists "Users insert own feedback" on public.member_feedback;
create policy "Users insert own feedback"
  on public.member_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own feedback" on public.member_feedback;
create policy "Users read own feedback"
  on public.member_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "Admins read all feedback" on public.member_feedback;
create policy "Admins read all feedback"
  on public.member_feedback for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Phase 15 — moderation queue and content reports

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('paper', 'event', 'project', 'job', 'guide', 'newsletter', 'member')),
  content_slug text not null check (char_length(content_slug) <= 200),
  reason text not null check (char_length(trim(reason)) between 5 and 500),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists content_reports_status_idx on public.content_reports (status, created_at desc);
create index if not exists content_reports_reporter_idx on public.content_reports (reporter_id, created_at desc);

alter table public.content_reports enable row level security;

drop policy if exists "Users insert own reports" on public.content_reports;
create policy "Users insert own reports"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.content_reports;
create policy "Users read own reports"
  on public.content_reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "Admins manage all reports" on public.content_reports;
create policy "Admins manage all reports"
  on public.content_reports for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- phase 16
-- Phase 16 — rich profiles, member preferences, avatar storage

alter table public.profiles
  add column if not exists goals text[] not null default '{}',
  add column if not exists avatar_url text,
  add column if not exists twitter_url text,
  add column if not exists website_url text;

create table if not exists public.member_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  content_density text not null default 'comfortable'
    check (content_density in ('compact', 'comfortable', 'spacious')),
  email_digest_frequency text not null default 'weekly'
    check (email_digest_frequency in ('daily', 'weekly', 'never')),
  updated_at timestamptz not null default now()
);

alter table public.member_preferences enable row level security;

drop policy if exists "Users manage own member preferences" on public.member_preferences;
create policy "Users manage own member preferences"
  on public.member_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Avatar uploads (public read, owner write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Phase 17 — digest send tracking

alter table public.member_preferences
  add column if not exists last_digest_sent_at timestamptz;

-- Phase 18 — secure cross-user notifications + project subscriber lookup

create or replace function public.can_notify_project_subscriber(
  caller_id uuid,
  p_project_id uuid,
  target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects pr
    where pr.id = p_project_id
      and (
        pr.lead_id = caller_id
        or exists (
          select 1
          from public.project_applications pa
          where pa.project_id = p_project_id
            and pa.user_id = caller_id
            and pa.status = 'accepted'
        )
        or exists (
          select 1 from public.profiles p where p.id = caller_id and p.role = 'admin'
        )
      )
  )
  and (
    target_id = (select lead_id from public.projects where id = p_project_id)
    or exists (
      select 1
      from public.project_follows pf
      where pf.project_id = p_project_id
        and pf.user_id = target_id
        and pf.notify_updates = true
    )
    or exists (
      select 1
      from public.project_applications pa
      where pa.project_id = p_project_id
        and pa.user_id = target_id
        and pa.status = 'accepted'
    )
  );
$$;

create or replace function public.notify_users(
  target_user_ids uuid[],
  p_title text,
  p_body text,
  p_href text default null,
  p_project_id uuid default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  caller_role text;
  target_id uuid;
  inserted int := 0;
  safe_title text;
  safe_body text;
  safe_href text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  safe_title := left(trim(coalesce(p_title, '')), 200);
  safe_body := left(trim(coalesce(p_body, '')), 500);
  safe_href := nullif(left(trim(coalesce(p_href, '')), ''), '');

  if safe_title = '' or safe_body = '' then
    return 0;
  end if;

  if safe_href is not null and safe_href !~ '^(/|https://)' then
    safe_href := null;
  end if;

  select role into caller_role from public.profiles where id = uid;

  foreach target_id in array coalesce(target_user_ids, '{}') loop
    if target_id is null then
      continue;
    end if;

    if not (
      target_id = uid
      or caller_role = 'admin'
      or (
        caller_role in ('project_lead', 'admin')
        and exists (
          select 1
          from public.project_applications pa
          join public.projects pr on pr.id = pa.project_id
          where pa.user_id = target_id
            and pr.lead_id = uid
        )
      )
      or (
        p_project_id is not null
        and public.can_notify_project_subscriber(uid, p_project_id, target_id)
      )
    ) then
      continue;
    end if;

    insert into public.notifications (user_id, title, body, href, read)
    values (target_id, safe_title, safe_body, safe_href, false);
    inserted := inserted + 1;
  end loop;

  return inserted;
end;
$$;

create or replace function public.get_project_update_subscribers(p_project_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.projects pr
    where pr.id = p_project_id
      and (
        pr.lead_id = uid
        or exists (
          select 1
          from public.project_applications pa
          where pa.project_id = p_project_id
            and pa.user_id = uid
            and pa.status = 'accepted'
        )
        or exists (
          select 1 from public.profiles p where p.id = uid and p.role = 'admin'
        )
      )
  ) then
    raise exception 'Not authorized';
  end if;

  return query
    select distinct s.user_id
    from (
      select pf.user_id
      from public.project_follows pf
      where pf.project_id = p_project_id
        and pf.notify_updates = true
      union
      select pa.user_id
      from public.project_applications pa
      where pa.project_id = p_project_id
        and pa.status = 'accepted'
    ) s;
end;
$$;

create or replace function public.increment_reading_activity(p_user_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  insert into public.reading_activity (user_id, activity_date, papers_read)
  values (p_user_id, p_date, 1)
  on conflict (user_id, activity_date)
  do update set papers_read = public.reading_activity.papers_read + 1;
end;
$$;

create table if not exists public.schema_migrations (
  phase text primary key,
  applied_at timestamptz not null default now()
);

insert into public.schema_migrations (phase)
values ('phase18')
on conflict (phase) do nothing;

grant execute on function public.notify_users(uuid[], text, text, text, uuid) to authenticated;
grant execute on function public.get_project_update_subscribers(uuid) to authenticated;
grant execute on function public.increment_reading_activity(uuid, date) to authenticated;

-- Phase 19 is maintained separately so existing installations can migrate safely.
-- For a fresh setup, run supabase/phase19.sql immediately after this file.
-- END supabase/full-setup.sql

-- BEGIN supabase/phase19.sql
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
-- END supabase/phase19.sql

-- BEGIN supabase/phase20.sql
-- Phase 20 — private application integrity, event RSVP privacy, and operational guards.
-- Apply after phase19.sql. This migration replaces permissive legacy policies.

-- An applicant may refine or withdraw only their own pending application. Project leads
-- never receive a direct client-side status update; review_project_application is the only path.
drop policy if exists "Leads update application status" on public.project_applications;
drop policy if exists "Applicants update pending project applications" on public.project_applications;
create policy "Applicants update pending project applications"
  on public.project_applications for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "Applicants withdraw pending project applications" on public.project_applications;
create policy "Applicants withdraw pending project applications"
  on public.project_applications for delete
  using (user_id = auth.uid() and status = 'pending');

-- RLS cannot compare OLD and NEW values. This trigger prevents an applicant from changing
-- project, applicant, or review status while still allowing a pending pitch correction.
create or replace function public.guard_project_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;
  if new.user_id = auth.uid() then
    if old.user_id <> new.user_id
      or old.project_id <> new.project_id
      or old.status <> new.status
      or old.status <> 'pending' then
      raise exception 'Applicants may only edit a pending pitch';
    end if;
    return new;
  end if;
  -- Direct lead writes are blocked by RLS. The review RPC runs as the lead and is permitted here.
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or exists (
    select 1 from public.projects p
    where p.id = old.project_id and p.lead_id = auth.uid()
  ) then
    return new;
  end if;
  raise exception 'Application reviews must use the review RPC';
end;
$$;

drop trigger if exists guard_project_application_update_trigger on public.project_applications;
create trigger guard_project_application_update_trigger
  before update on public.project_applications
  for each row execute function public.guard_project_application_update();

alter table public.project_applications
  add column if not exists review_note text check (review_note is null or char_length(review_note) <= 2000),
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Apply review decisions atomically, including a member record and a private decision note.
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
  safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Review note is too long'; end if;

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
    update public.project_memberships set status = 'removed', left_at = now()
    where project_id = app.project_id and user_id = app.user_id and member_role = 'contributor';
  end if;

  update public.project_applications
  set status = p_status,
      review_note = safe_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
  returning * into app;
  return app;
end;
$$;

revoke all on function public.review_project_application(uuid, text, text) from public;
grant execute on function public.review_project_application(uuid, text, text) to authenticated;

-- RSVP rows reveal attendance patterns. Members may only read their own, while admins retain
-- operational visibility. Aggregated counts can be exposed later through a separate RPC.
drop policy if exists "Members read event rsvps" on public.event_rsvps;
drop policy if exists "Users read own event rsvps" on public.event_rsvps;
create policy "Users read own event rsvps"
  on public.event_rsvps for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Prevent contributors from self-verifying or changing ownership/visibility after submission.
create or replace function public.guard_project_contribution_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if new.contributor_id = auth.uid() then
    if old.contributor_id <> new.contributor_id
      or old.project_id <> new.project_id
      or old.milestone_id is distinct from new.milestone_id
      or old.visibility <> new.visibility
      or old.verification_status <> new.verification_status
      or old.verified_by is distinct from new.verified_by
      or old.verified_at is distinct from new.verified_at then
      raise exception 'Contributors may only revise their submitted content';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_project_contribution_update_trigger on public.project_contributions;
create trigger guard_project_contribution_update_trigger
  before update on public.project_contributions
  for each row execute function public.guard_project_contribution_update();

-- Keep a lead membership record for projects created before collaboration tracking existed.
insert into public.project_memberships (project_id, user_id, member_role, status)
select p.id, p.lead_id, 'lead', 'active'
from public.projects p
where p.lead_id is not null
on conflict (project_id, user_id) do nothing;

-- New project leads are recorded atomically. The public team count continues to represent
-- accepted contributors, not the lead, so capacity is not reduced by the operator.
create or replace function public.create_lead_project_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.lead_id is not null then
    insert into public.project_memberships (project_id, user_id, member_role, status)
    values (new.id, new.lead_id, 'lead', 'active')
    on conflict (project_id, user_id) do update set member_role = 'lead', status = 'active', left_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists create_lead_project_membership_trigger on public.projects;
create trigger create_lead_project_membership_trigger
  after insert or update of lead_id on public.projects
  for each row execute function public.create_lead_project_membership();

-- Count contributor seats only; leads, reviewers, and mentors do not consume a seat.
create or replace function public.sync_project_team_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare affected_project uuid := coalesce(new.project_id, old.project_id);
begin
  update public.projects
  set team_count = (
    select count(*) from public.project_memberships pm
    where pm.project_id = affected_project
      and pm.member_role = 'contributor'
      and pm.status in ('active', 'paused')
  ), updated_at = now()
  where id = affected_project;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_project_team_count_trigger on public.project_memberships;
create trigger sync_project_team_count_trigger
  after insert or update or delete on public.project_memberships
  for each row execute function public.sync_project_team_count();

insert into public.schema_migrations (phase) values ('phase20') on conflict (phase) do nothing;
-- END supabase/phase20.sql

-- BEGIN supabase/phase21.sql
-- Phase 21 — publication governance, programme decisions, and institutional roles.
-- Apply after phase20.sql. This migration closes the remaining client-side moderation gaps.

-- A project listing is a reviewed institutional opportunity, not an automatically public post.
alter table public.projects
  add column if not exists publication_status text not null default 'published'
    check (publication_status in ('draft', 'submitted', 'changes_requested', 'published', 'archived')),
  add column if not exists publication_note text
    check (publication_note is null or char_length(publication_note) <= 2000),
  add column if not exists published_by uuid references public.profiles(id) on delete set null,
  add column if not exists published_at timestamptz;

update public.projects
set publication_status = case when published then 'published' else 'draft' end
where publication_status = 'published' and published is false;

-- Institutional project-lead grants are operational, not merely decorative: they authorize
-- draft creation alongside the legacy primary role.
drop policy if exists "Leads and admins insert projects" on public.projects;
create policy "Leads and admins insert projects" on public.projects for insert
  with check (
    public.has_institution_role(auth.uid(), 'project_lead')
    and (lead_id is null or lead_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  );

-- A client cannot submit an application to a private, closed, or non-existent project merely by
-- guessing its UUID. Capacity is still enforced atomically at the acceptance decision.
drop policy if exists "Members apply to projects" on public.project_applications;
create policy "Members apply to projects" on public.project_applications for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.published = true and p.status = 'open'
    )
  );

-- A lead can edit a brief, but only an administrator can make it public or change its review state.
create or replace function public.guard_project_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare is_admin boolean;
begin
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into is_admin;
  if tg_op = 'INSERT' then
    if not coalesce(is_admin, false) then
      new.published := false;
      new.publication_status := 'draft';
      new.publication_note := null;
      new.published_by := null;
      new.published_at := null;
    end if;
    return new;
  end if;

  if not coalesce(is_admin, false) and current_setting('app.project_publication_submit', true) is distinct from 'true' and (
    new.published is distinct from old.published
    or new.publication_status is distinct from old.publication_status
    or new.publication_note is distinct from old.publication_note
    or new.published_by is distinct from old.published_by
    or new.published_at is distinct from old.published_at
  ) then
    raise exception 'Project publication decisions require an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_project_publication_trigger on public.projects;
create trigger guard_project_publication_trigger
  before insert or update on public.projects
  for each row execute function public.guard_project_publication();

create or replace function public.submit_project_for_review(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare project_row public.projects;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into project_row from public.projects where id = p_project_id for update;
  if not found then raise exception 'Project not found'; end if;
  if project_row.lead_id <> auth.uid()
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;
  if char_length(trim(project_row.description)) < 80
     or cardinality(project_row.skills_needed) = 0
     or cardinality(project_row.tags) = 0 then
    raise exception 'Add an 80-character brief, at least one skill, and at least one topic before submitting';
  end if;
  perform set_config('app.project_publication_submit', 'true', true);
  update public.projects
  set published = false,
      publication_status = 'submitted',
      publication_note = null,
      published_by = null,
      published_at = null,
      updated_at = now()
  where id = p_project_id
  returning * into project_row;
  return project_row;
end;
$$;

create or replace function public.review_project_publication(
  p_project_id uuid,
  p_decision text,
  p_note text default null
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare project_row public.projects;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_decision not in ('published', 'changes_requested', 'archived') then
    raise exception 'Invalid publication decision';
  end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Publication note is too long'; end if;

  update public.projects
  set published = p_decision = 'published',
      publication_status = p_decision,
      publication_note = safe_note,
      published_by = auth.uid(),
      published_at = case when p_decision = 'published' then now() else null end,
      updated_at = now()
  where id = p_project_id
  returning * into project_row;
  if not found then raise exception 'Project not found'; end if;
  return project_row;
end;
$$;

revoke all on function public.submit_project_for_review(uuid) from public;
revoke all on function public.review_project_publication(uuid, text, text) from public;
grant execute on function public.submit_project_for_review(uuid) to authenticated;
grant execute on function public.review_project_publication(uuid, text, text) to authenticated;

-- Programme decisions are atomic, capacity-aware, and return a private note to the applicant.
alter table public.program_applications
  add column if not exists review_note text
    check (review_note is null or char_length(review_note) <= 2000),
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Private programme IDs must not be a backdoor into an unpublished application cycle.
drop policy if exists "Members apply to programs" on public.program_applications;
create policy "Members apply to programs" on public.program_applications for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.programs p where p.id = program_id and p.published = true)
  );

create or replace function public.guard_program_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then return new; end if;
  raise exception 'Programme decisions require an administrator';
end;
$$;

drop trigger if exists guard_program_application_update_trigger on public.program_applications;
create trigger guard_program_application_update_trigger
  before update on public.program_applications
  for each row execute function public.guard_program_application_update();

create or replace function public.review_program_application(
  p_application_id uuid,
  p_status text,
  p_note text default null
)
returns public.program_applications
language plpgsql
security definer
set search_path = public
as $$
declare app public.program_applications;
declare program_row public.programs;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Review note is too long'; end if;

  select * into app from public.program_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into program_row from public.programs where id = app.program_id for update;
  if p_status = 'accepted' and app.status <> 'accepted' and program_row.capacity is not null
     and (select count(*) from public.program_applications where program_id = app.program_id and status = 'accepted') >= program_row.capacity then
    raise exception 'Programme capacity has been reached';
  end if;
  update public.program_applications
  set status = p_status,
      review_note = safe_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
  returning * into app;
  return app;
end;
$$;

revoke all on function public.review_program_application(uuid, text, text) from public;
grant execute on function public.review_program_application(uuid, text, text) to authenticated;

-- Preserve at least one operational administrator. This avoids accidentally locking the institution
-- out of its own moderation controls.
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'At least one administrator must remain';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists prevent_last_admin_removal_trigger on public.profiles;
create trigger prevent_last_admin_removal_trigger
  before update of role or delete on public.profiles
  for each row execute function public.prevent_last_admin_removal();

-- Reviewer status grants a tightly-scoped way to create and revise unpublished analysis without
-- granting administrator powers. Published work still goes through the editorial queue.
drop policy if exists "Members read published papers" on public.papers;
create policy "Members read published papers" on public.papers for select
  using (
    auth.uid() is not null and (
      published = true
      or reviewer_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

drop policy if exists "Reviewers submit paper drafts" on public.papers;
create policy "Reviewers submit paper drafts" on public.papers for insert
  with check (
    reviewer_id = auth.uid()
    and published = false
    and review_status = 'draft'
    and public.has_institution_role(auth.uid(), 'reviewer')
  );

drop policy if exists "Reviewers revise own paper drafts" on public.papers;
create policy "Reviewers revise own paper drafts" on public.papers for update
  using (reviewer_id = auth.uid() and public.has_institution_role(auth.uid(), 'reviewer'))
  with check (
    reviewer_id = auth.uid()
    and published = false
    and review_status in ('draft', 'in_review')
    and public.has_institution_role(auth.uid(), 'reviewer')
  );

insert into public.schema_migrations (phase) values ('phase21') on conflict (phase) do nothing;
-- END supabase/phase21.sql

-- BEGIN supabase/phase22.sql
-- Phase 22 — evidence governance, contribution review integrity, and complete lifecycle controls.
-- Apply after phase21.sql.

-- Contribution verification is an explicit decision with a durable note. Leads cannot mutate a
-- contributor's authorship or content while reviewing it.
alter table public.project_contributions
  add column if not exists verification_note text
    check (verification_note is null or char_length(verification_note) <= 2000);

create or replace function public.guard_project_contribution_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if current_setting('app.contribution_review', true) = 'true'
     or current_setting('app.contribution_resubmit', true) = 'true' then
    return new;
  end if;
  if new.contributor_id = auth.uid() then
    if old.contributor_id <> new.contributor_id
      or old.project_id <> new.project_id
      or old.milestone_id is distinct from new.milestone_id
      or old.visibility <> new.visibility
      or old.verification_status <> new.verification_status
      or old.verification_note is distinct from new.verification_note
      or old.verified_by is distinct from new.verified_by
      or old.verified_at is distinct from new.verified_at then
      raise exception 'Contributors may only revise their submitted content';
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists "Contributors update drafts and leads verify" on public.project_contributions;
drop policy if exists "Contributors revise own submissions" on public.project_contributions;
create policy "Contributors revise own submissions" on public.project_contributions for update
  using (contributor_id = auth.uid())
  with check (contributor_id = auth.uid());

create or replace function public.review_project_contribution(
  p_contribution_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('verified', 'needs_changes') then raise exception 'Invalid verification status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Verification note is too long'; end if;
  if p_status = 'needs_changes' and safe_note is null then raise exception 'A revision request requires a note'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;
  if not exists (
    select 1 from public.projects p
    where p.id = contribution_row.project_id and p.lead_id = auth.uid()
  ) and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Only the project lead or an administrator may review contributions';
  end if;

  perform set_config('app.contribution_review', 'true', true);
  update public.project_contributions
  set verification_status = p_status,
      verification_note = safe_note,
      verified_by = auth.uid(),
      verified_at = now(),
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.review_project_contribution(uuid, text, text) from public;
grant execute on function public.review_project_contribution(uuid, text, text) to authenticated;

create or replace function public.resubmit_project_contribution(p_contribution_id uuid)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  perform set_config('app.contribution_resubmit', 'true', true);
  update public.project_contributions
  set verification_status = 'submitted',
      verification_note = null,
      verified_by = null,
      verified_at = null,
      updated_at = now()
  where id = p_contribution_id
    and contributor_id = auth.uid()
    and verification_status = 'needs_changes'
  returning * into contribution_row;
  if not found then raise exception 'Only your contribution awaiting changes can be resubmitted'; end if;
  return contribution_row;
end;
$$;

revoke all on function public.resubmit_project_contribution(uuid) from public;
grant execute on function public.resubmit_project_contribution(uuid) to authenticated;

-- Re-open is a valid editorial action. Moving an accepted application away from accepted removes
-- the active contributor membership atomically.
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
declare app public.project_applications;
declare project_row public.projects;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('pending', 'accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Review note is too long'; end if;

  select * into app from public.project_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into project_row from public.projects where id = app.project_id for update;
  if project_row.lead_id <> auth.uid()
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
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
    where project_id = app.project_id and user_id = app.user_id and member_role = 'contributor';
  end if;

  update public.project_applications
  set status = p_status,
      review_note = safe_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
  returning * into app;
  return app;
end;
$$;

revoke all on function public.review_project_application(uuid, text, text) from public;
grant execute on function public.review_project_application(uuid, text, text) to authenticated;

-- Leads can intentionally pause, graduate, reactivate, or remove a collaborator without editing
-- application history. The RPC also enforces the required left_at invariant.
create or replace function public.set_project_membership_status(
  p_project_id uuid,
  p_user_id uuid,
  p_status text
)
returns public.project_memberships
language plpgsql
security definer
set search_path = public
as $$
declare membership_row public.project_memberships;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('active', 'paused', 'alumni', 'removed') then raise exception 'Invalid membership status'; end if;
  if not exists (select 1 from public.projects p where p.id = p_project_id and p.lead_id = auth.uid())
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;
  update public.project_memberships
  set status = p_status,
      left_at = case when p_status in ('alumni', 'removed') then now() else null end
  where project_id = p_project_id and user_id = p_user_id and member_role <> 'lead'
  returning * into membership_row;
  if not found then raise exception 'Membership not found'; end if;
  return membership_row;
end;
$$;

revoke all on function public.set_project_membership_status(uuid, uuid, text) from public;
grant execute on function public.set_project_membership_status(uuid, uuid, text) to authenticated;

-- Programme application windows remove ambiguity and are enforced at the database boundary.
alter table public.programs
  add column if not exists applications_open_at timestamptz,
  add column if not exists applications_close_at timestamptz,
  add column if not exists outcomes text check (outcomes is null or char_length(outcomes) <= 4000);
alter table public.programs drop constraint if exists programs_application_window_valid;
alter table public.programs add constraint programs_application_window_valid
  check (applications_close_at is null or applications_open_at is null or applications_close_at > applications_open_at);

drop policy if exists "Members apply to programs" on public.program_applications;
create policy "Members apply to programs" on public.program_applications for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.programs p
      where p.id = program_id
        and p.published = true
        and (p.applications_open_at is null or p.applications_open_at <= now())
        and (p.applications_close_at is null or p.applications_close_at > now())
    )
  );

drop policy if exists "Applicants withdraw pending program applications" on public.program_applications;
create policy "Applicants withdraw pending program applications" on public.program_applications for delete
  using (user_id = auth.uid() and status = 'pending');

-- Every public institutional claim has a durable primary source. This table is intentionally
-- separate from marketing copy so unverifiable statements cannot quietly become public facts.
create table if not exists public.institutional_claims (
  id uuid primary key default gen_random_uuid(),
  claim_type text not null check (claim_type in ('affiliation', 'publication', 'project_outcome', 'member_stat', 'program_outcome', 'other')),
  statement text not null check (char_length(trim(statement)) between 20 and 1000),
  context text check (context is null or char_length(context) <= 4000),
  evidence_url text not null check (evidence_url ~ '^https?://'),
  evidence_label text not null check (char_length(trim(evidence_label)) between 3 and 160),
  status text not null default 'draft' check (status in ('draft', 'verified', 'retired')),
  valid_until date,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists institutional_claims_status_idx
  on public.institutional_claims (status, claim_type, updated_at desc);
alter table public.institutional_claims enable row level security;

drop policy if exists "Public reads verified institutional claims" on public.institutional_claims;
create policy "Public reads verified institutional claims" on public.institutional_claims for select
  using (
    (status = 'verified' and (valid_until is null or valid_until >= current_date))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins manage institutional claims" on public.institutional_claims;
create policy "Admins manage institutional claims" on public.institutional_claims for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace function public.review_institutional_claim(
  p_claim_id uuid,
  p_status text
)
returns public.institutional_claims
language plpgsql
security definer
set search_path = public
as $$
declare claim_row public.institutional_claims;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('verified', 'retired') then raise exception 'Invalid claim status'; end if;
  update public.institutional_claims
  set status = p_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_claim_id
  returning * into claim_row;
  if not found then raise exception 'Claim not found'; end if;
  return claim_row;
end;
$$;

revoke all on function public.review_institutional_claim(uuid, text) from public;
grant execute on function public.review_institutional_claim(uuid, text) to authenticated;

insert into public.schema_migrations (phase) values ('phase22') on conflict (phase) do nothing;
-- END supabase/phase22.sql

-- BEGIN supabase/phase23.sql
-- Phase 23 — private research paper analyzer workspace.
-- Apply after phase22.sql.

create table if not exists public.paper_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 4 and 180),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  input_kind text not null default 'text' check (input_kind in ('text')),
  input_excerpt text not null check (char_length(trim(input_excerpt)) between 200 and 2400),
  input_sha256 text not null check (input_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'completed' check (status in ('completed', 'failed')),
  provider text not null default 'local_structured_v1' check (provider in ('local_structured_v1')),
  prompt_version text not null default 'paper-analysis-v1',
  structured_result jsonb not null check (
    jsonb_typeof(structured_result) = 'object'
    and structured_result ? 'problem'
    and structured_result ? 'contribution'
    and structured_result ? 'method'
    and structured_result ? 'limitations'
    and structured_result ? 'safety_note'
    and jsonb_typeof(structured_result -> 'problem') = 'array'
    and jsonb_typeof(structured_result -> 'contribution') = 'array'
    and jsonb_typeof(structured_result -> 'method') = 'array'
    and jsonb_typeof(structured_result -> 'limitations') = 'array'
    and jsonb_typeof(structured_result -> 'safety_note') = 'string'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paper_analyses_user_created_idx
  on public.paper_analyses (user_id, created_at desc);
create index if not exists paper_analyses_hash_idx
  on public.paper_analyses (user_id, input_sha256);

alter table public.paper_analyses enable row level security;
revoke all on table public.paper_analyses from anon;
grant select, insert, delete on table public.paper_analyses to authenticated;

drop policy if exists "Members read their paper analyses" on public.paper_analyses;
create policy "Members read their paper analyses" on public.paper_analyses for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Members create their paper analyses" on public.paper_analyses;
create policy "Members create their paper analyses" on public.paper_analyses for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and jsonb_array_length(coalesce(structured_result -> 'problem', '[]'::jsonb)) <= 6
    and jsonb_array_length(coalesce(structured_result -> 'contribution', '[]'::jsonb)) <= 6
    and jsonb_array_length(coalesce(structured_result -> 'method', '[]'::jsonb)) <= 6
    and jsonb_array_length(coalesce(structured_result -> 'limitations', '[]'::jsonb)) <= 6
  );

drop policy if exists "Members delete their paper analyses" on public.paper_analyses;
create policy "Members delete their paper analyses" on public.paper_analyses for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

insert into public.schema_migrations (phase) values ('phase23') on conflict (phase) do nothing;
-- END supabase/phase23.sql

-- BEGIN supabase/phase24.sql
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
revoke all on table public.labs from anon;
grant select on table public.labs to anon, authenticated;
grant insert, update, delete on table public.labs to authenticated;

drop policy if exists "Public reads published labs" on public.labs;
create policy "Public reads published labs" on public.labs for select
  to anon, authenticated
  using (published = true or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins manage labs" on public.labs;
create policy "Admins manage labs" on public.labs for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

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
revoke all on table public.lab_memberships from anon;
grant select, insert, update, delete on table public.lab_memberships to authenticated;

drop policy if exists "Members read own lab memberships" on public.lab_memberships;
create policy "Members read own lab memberships" on public.lab_memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.labs l where l.id = lab_id and l.lead_id = (select auth.uid()))
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Admins and lab leads manage lab memberships" on public.lab_memberships;
create policy "Admins and lab leads manage lab memberships" on public.lab_memberships for all
  to authenticated
  using (
    exists (select 1 from public.labs l where l.id = lab_id and l.lead_id = (select auth.uid()))
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.labs l where l.id = lab_id and l.lead_id = (select auth.uid()))
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
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
revoke all on table public.competitions from anon;
grant select on table public.competitions to anon, authenticated;
grant insert, update, delete on table public.competitions to authenticated;

drop policy if exists "Public reads published competitions" on public.competitions;
create policy "Public reads published competitions" on public.competitions for select
  to anon, authenticated
  using (published = true or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins manage competitions" on public.competitions;
create policy "Admins manage competitions" on public.competitions for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

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
revoke all on table public.competition_submissions from anon;
grant select, insert, update, delete on table public.competition_submissions to authenticated;

drop policy if exists "Members manage own competition submissions" on public.competition_submissions;
create policy "Members manage own competition submissions" on public.competition_submissions for all
  to authenticated
  using (
    submitter_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (submitter_id = (select auth.uid()));

drop policy if exists "Admins review competition submissions" on public.competition_submissions;
create policy "Admins review competition submissions" on public.competition_submissions for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

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
revoke all on table public.partnerships from anon;
grant select on table public.partnerships to anon, authenticated;
grant insert, update, delete on table public.partnerships to authenticated;

drop policy if exists "Public reads published partnerships" on public.partnerships;
create policy "Public reads published partnerships" on public.partnerships for select
  to anon, authenticated
  using (published = true or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins manage partnerships" on public.partnerships;
create policy "Admins manage partnerships" on public.partnerships for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

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
revoke all on table public.invitations from anon;
grant select, insert, update on table public.invitations to authenticated;

drop policy if exists "Invitees and inviters read invitations" on public.invitations;
create policy "Invitees and inviters read invitations" on public.invitations for select
  to authenticated
  using (
    invitee_id = (select auth.uid())
    or lower(email) = lower((auth.jwt() ->> 'email'))
    or invited_by = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Leads and admins create invitations" on public.invitations;
create policy "Leads and admins create invitations" on public.invitations for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and (
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'project_lead'))
      or exists (select 1 from public.member_roles mr where mr.user_id = (select auth.uid()) and mr.role in ('project_lead', 'administrator', 'mentor'))
    )
  );

drop policy if exists "Invitees update own invitation status" on public.invitations;
create policy "Invitees update own invitation status" on public.invitations for update
  to authenticated
  using (
    invitee_id = (select auth.uid())
    or lower(email) = lower((auth.jwt() ->> 'email'))
    or invited_by = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    invitee_id = (select auth.uid())
    or lower(email) = lower((auth.jwt() ->> 'email'))
    or invited_by = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
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

insert into public.schema_migrations (phase) values ('phase24') on conflict (phase) do nothing;

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
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.invitations where id = p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if inv.invitee_id is distinct from (select auth.uid())
     and lower(coalesce(inv.email, '')) <> lower(coalesce(auth.jwt() ->> 'email', ''))
     and not exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
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
    values (inv.target_id, coalesce(inv.invitee_id, (select auth.uid())), inv.role_offered, 'active')
    on conflict (project_id, user_id) do update
      set status = 'active', member_role = excluded.member_role, left_at = null;
  elsif inv.invitation_type = 'lab' then
    insert into public.lab_memberships (lab_id, user_id, member_role, status)
    values (inv.target_id, coalesce(inv.invitee_id, (select auth.uid())), inv.role_offered, 'active')
    on conflict (lab_id, user_id) do update
      set status = 'active', member_role = excluded.member_role;
  end if;

  update public.invitations
    set status = 'accepted', accepted_at = now(), invitee_id = coalesce(invitee_id, (select auth.uid()))
    where id = inv.id
    returning * into inv;
  return inv;
end;
$$;

revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;
-- END supabase/phase24.sql



-- ===== Phase 25 (appended)
-- BEGIN supabase/phase25.sql
-- Phase 25 — platform admin helper, institution seeds, experiments & deliverables
-- Additive migration. Apply after phase24.sql.

create extension if not exists pgcrypto;

-- Unified admin check: legacy profiles.role = 'admin' OR member_roles.administrator
create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  )
  or exists (
    select 1 from public.member_roles mr
    where mr.user_id = uid and mr.role = 'administrator'
  );
$$;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated, anon;

-- Refresh phase24 admin policies to accept institutional administrators
drop policy if exists "Admins manage labs" on public.labs;
create policy "Admins manage labs" on public.labs for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins manage competitions" on public.competitions;
create policy "Admins manage competitions" on public.competitions for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins review competition submissions" on public.competition_submissions;
create policy "Admins review competition submissions" on public.competition_submissions for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins manage partnerships" on public.partnerships;
create policy "Admins manage partnerships" on public.partnerships for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- First-class experiment records (linked to projects)
create table if not exists public.project_experiments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  hypothesis text not null check (char_length(trim(hypothesis)) between 10 and 4000),
  method text not null default '' check (char_length(method) <= 8000),
  result_summary text not null default '' check (char_length(result_summary) <= 8000),
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'abandoned')),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_experiments_project_idx on public.project_experiments (project_id, created_at desc);
alter table public.project_experiments enable row level security;
revoke all on table public.project_experiments from anon;
grant select, insert, update, delete on table public.project_experiments to authenticated;

drop policy if exists "Collaborators read project experiments" on public.project_experiments;
create policy "Collaborators read project experiments" on public.project_experiments for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and (p.lead_id = auth.uid() or p.published = true)
    )
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_experiments.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

drop policy if exists "Collaborators write project experiments" on public.project_experiments;
create policy "Collaborators write project experiments" on public.project_experiments for all
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or (
      created_by = auth.uid()
      and exists (
        select 1 from public.project_memberships pm
        where pm.project_id = project_experiments.project_id
          and pm.user_id = auth.uid()
          and pm.status = 'active'
      )
    )
  )
  with check (
    created_by = auth.uid()
    and (
      public.is_platform_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (
        select 1 from public.project_memberships pm
        where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status = 'active'
      )
    )
  );

-- Deliverables (milestone-adjacent artifacts with review)
create table if not exists public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 8000),
  artifact_url text check (artifact_url is null or artifact_url ~ '^https?://'),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'accepted', 'changes_requested')),
  review_note text check (review_note is null or char_length(review_note) <= 4000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_deliverables_project_idx on public.project_deliverables (project_id, status, created_at desc);
alter table public.project_deliverables enable row level security;
revoke all on table public.project_deliverables from anon;
grant select, insert, update, delete on table public.project_deliverables to authenticated;

drop policy if exists "Collaborators read project deliverables" on public.project_deliverables;
create policy "Collaborators read project deliverables" on public.project_deliverables for select
  to authenticated
  using (
    public.is_platform_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_deliverables.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

drop policy if exists "Members submit project deliverables" on public.project_deliverables;
create policy "Members submit project deliverables" on public.project_deliverables for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and (
      public.is_platform_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (
        select 1 from public.project_memberships pm
        where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status = 'active'
      )
    )
  );

drop policy if exists "Leads and authors update deliverables" on public.project_deliverables;
create policy "Leads and authors update deliverables" on public.project_deliverables for update
  to authenticated
  using (
    public.is_platform_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  )
  with check (
    public.is_platform_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  );

-- Seed published labs (idempotent by slug)
insert into public.labs (slug, name, short_name, tagline, summary, focus, methods, open_roles, color, published)
values
  (
    'scientific-discovery',
    'Machine Learning for Scientific Discovery',
    'Scientific Discovery',
    'Surrogates, simulators, and discovery loops that survive contact with real data.',
    'This lab studies how learned models accelerate scientific workflows — from PDE surrogates and experimental design to literature-grounded hypothesis generation — without treating benchmark wins as discovery.',
    array['Neural PDE surrogates and dynamical phase transitions','Active learning and experimental design under budget','Scientific literature → testable hypothesis pipelines','Uncertainty, calibration, and failure localization'],
    array['Controlled defect injection in world models','Reproducible training recipes with published configs','Ablations that name when a surrogate silently breaks'],
    array['Research contributor','Systems engineer','Domain collaborator'],
    'green',
    true
  ),
  (
    'mathematical-intelligence',
    'Mathematical Approaches to Intelligence',
    'Mathematical Intelligence',
    'Geometry, information, and theory that constrain what models can and cannot learn.',
    'We treat representation geometry, inductive bias, and information bottlenecks as first-class objects — not afterthoughts to scale. The lab connects classical theory to measurable structure inside modern models.',
    array['Latent manifold geometry and intrinsic dimension','Theory-laden structure in adaptive representations','Formalizing residual / surprise-bearing tokenization','Limits of generalization under distribution shift'],
    array['Probe suites on synthetic and real manifolds','Scaling-law aware experimental design','Proof-oriented writeups paired with runnable notebooks'],
    array['Theory researcher','ML engineer','Reviewer'],
    'blue',
    true
  ),
  (
    'robotics',
    'Robotics and Autonomous Intelligence',
    'Robotics',
    'Agents that plan, recover, and explain themselves when the world breaks.',
    'Autonomy fails at the edge cases. This lab focuses on recovery under perturbation, residual event streams, and evaluation protocols that punish confident wrongness.',
    array['Latent safety and recovery under perturbation','Residual event tokenization for continuous streams','Sim-to-real evaluation with explicit failure catalogs','Multi-agent coordination under partial observability'],
    array['Counterfactual defect worlds','Closed-loop demos with logged trajectories','Weekly postmortems on silent failure modes'],
    array['Robotics engineer','RL researcher','Hardware collaborator'],
    'red',
    true
  ),
  (
    'computational-finance',
    'Computational Finance and Economics',
    'Comp. Finance',
    'Markets as dynamical systems — models that are inspectable under stress.',
    'We build decision systems for financial and economic regimes where calibration, regime detection, and auditability matter more than leaderboard deltas.',
    array['Regime-aware forecasting and risk models','Market microstructure and agent-based simulation','Causal evaluation under non-stationarity','Governance-ready model cards for financial ML'],
    array['Walk-forward evaluation with frozen protocols','Adversarial stress tests on regime shifts','Public postmortems on what failed and why'],
    array['Quant researcher','ML engineer','Risk reviewer'],
    'violet',
    true
  ),
  (
    'real-world-ai',
    'Real-World AI Applications',
    'Real-World AI',
    'End-to-end systems that ship evidence, not decks.',
    'Applied threads that turn a narrow technical hypothesis into an inspectable prototype — with users, evaluators, or operators who can falsify the claim.',
    array['Text-to-structure and generative design tools','Documented research-to-product decision gates','Reliability under messy real inputs','Member-facing tools that dogfood our own methods'],
    array['30-day shipping checkpoints','User / evaluator sessions with written findings','Kill criteria decided before the first demo'],
    array['Founding engineer','Product-minded researcher','Designer'],
    'orange',
    true
  ),
  (
    'emerging',
    'Interdisciplinary & Emerging Projects',
    'Emerging',
    'Threads that do not fit a single lab — yet.',
    'A holding bay for interdisciplinary proposals, early probes, and cross-lab collaborations. Threads graduate into a home lab once scope, method, and ownership are clear.',
    array['Cross-lab collaborations with shared milestones','Early probes that need two weeks, not six months','Open calls for emerging problem statements'],
    array['Lightweight charters with explicit kill dates','Rotation of mentors across labs','Promotion criteria into a primary lab'],
    array['Any background with a falsifiable claim'],
    'bone',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  tagline = excluded.tagline,
  summary = excluded.summary,
  focus = excluded.focus,
  methods = excluded.methods,
  open_roles = excluded.open_roles,
  color = excluded.color,
  published = excluded.published,
  updated_at = now();

-- Seed competitions
insert into public.competitions (slug, title, summary, status, prize, deadline, lab_id, evaluation_protocol, published)
select
  'defect-worlds-challenge',
  'Defect Worlds Challenge',
  'Inject controlled defects into a shared world-model baseline and measure recovery quality under a frozen evaluation protocol.',
  'upcoming',
  'Lab invitation + featured project record',
  null,
  l.id,
  'Protocol freezes before submissions open. Scoring weights recovery quality, calibration under defect, and reproducibility of the submission package.',
  true
from public.labs l where l.slug = 'scientific-discovery'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  status = excluded.status,
  prize = excluded.prize,
  evaluation_protocol = excluded.evaluation_protocol,
  published = excluded.published,
  lab_id = excluded.lab_id,
  updated_at = now();

insert into public.competitions (slug, title, summary, status, prize, deadline, lab_id, evaluation_protocol, published)
select
  'residual-stream-hack',
  'Residual Stream Hack',
  'Compress a continuous sensor stream with residual event tokens and beat a published bitrate / fidelity frontier.',
  'upcoming',
  'Mentorship slot + demo day feature',
  null,
  l.id,
  'Entrants receive a fixed stream corpus and bitrate budget. Primary metric: fidelity under budget; secondary: recovery after stream corruption.',
  true
from public.labs l where l.slug = 'robotics'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  status = excluded.status,
  prize = excluded.prize,
  evaluation_protocol = excluded.evaluation_protocol,
  published = excluded.published,
  lab_id = excluded.lab_id,
  updated_at = now();

insert into public.partnerships (name, kind, summary, status, published)
select v.name, v.kind, v.summary, v.status, v.published
from (
  values
    (
      'Academic collaborators',
      'academic',
      'Co-advised research threads targeting strong venue submissions and clean open-source reference code. Selective — apply through the fellowship track.',
      'exploring',
      true
    ),
    (
      'Infrastructure partners',
      'infrastructure',
      'Compute, data, and tooling relationships that remove bottlenecks for member experiments — disclosed when active and material.',
      'exploring',
      true
    ),
    (
      'Builder communities',
      'community',
      'Discord and peer networks for demos, paper clubs, and cross-project critique. Community channels are opt-in and moderated.',
      'active',
      true
    )
) as v(name, kind, summary, status, published)
where not exists (
  select 1 from public.partnerships p where p.name = v.name
);

insert into public.schema_migrations (phase) values ('phase25') on conflict (phase) do nothing;


-- BEGIN supabase/phase26.sql
-- Phase 26 — Pass 2 heavy additions: profile enrichment, paper metadata,
-- public papers catalog, research paths, application questions, project datasets.
-- Additive migration. Apply after phase25.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profile enrichment
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists availability_hours_per_week integer
    check (availability_hours_per_week is null or availability_hours_per_week between 0 and 80);

alter table public.profiles
  add column if not exists experience_level text
    check (experience_level is null or experience_level in (
      'student', 'early_career', 'mid_career', 'senior', 'researcher'
    ));

alter table public.profiles
  add column if not exists desired_roles text[] not null default '{}';

alter table public.profiles
  add column if not exists member_skills text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Paper metadata + public catalog RLS
-- ---------------------------------------------------------------------------
alter table public.papers
  add column if not exists venue text check (venue is null or char_length(venue) <= 200);

alter table public.papers
  add column if not exists prerequisites text[] not null default '{}';

alter table public.papers
  add column if not exists editorial_summary text
    check (editorial_summary is null or char_length(editorial_summary) <= 4000);

-- Anon may read fully published papers (separate from authenticated member policy)
drop policy if exists "Public reads published papers catalog" on public.papers;
create policy "Public reads published papers catalog" on public.papers for select
  to anon
  using (published = true and review_status = 'published');

-- Ensure authenticated can still read published papers without auth.uid() gate for catalog
drop policy if exists "Authenticated read published papers catalog" on public.papers;
create policy "Authenticated read published papers catalog" on public.papers for select
  to authenticated
  using (published = true and review_status = 'published');

-- ---------------------------------------------------------------------------
-- Research paths (DB-backed learning pathways)
-- ---------------------------------------------------------------------------
create table if not exists public.research_paths (
  id text primary key check (char_length(trim(id)) between 2 and 80),
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id text not null references public.research_paths(id) on delete cascade,
  step_kind text not null check (step_kind in ('guide', 'paper')),
  step_slug text not null check (char_length(trim(step_slug)) between 2 and 120),
  sort_order integer not null default 0,
  unique (path_id, step_kind, step_slug)
);

create index if not exists research_path_steps_path_idx
  on public.research_path_steps (path_id, sort_order);

create table if not exists public.research_path_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id text not null references public.research_paths(id) on delete cascade,
  completed_steps integer not null default 0 check (completed_steps >= 0),
  last_step_slug text,
  updated_at timestamptz not null default now(),
  primary key (user_id, path_id)
);

alter table public.research_paths enable row level security;
alter table public.research_path_steps enable row level security;
alter table public.research_path_progress enable row level security;

revoke all on table public.research_paths from anon;
revoke all on table public.research_path_steps from anon;
revoke all on table public.research_path_progress from anon;

grant select on table public.research_paths to anon, authenticated;
grant select on table public.research_path_steps to anon, authenticated;
grant select, insert, update, delete on table public.research_paths to authenticated;
grant select, insert, update, delete on table public.research_path_steps to authenticated;
grant select, insert, update, delete on table public.research_path_progress to authenticated;

drop policy if exists "Public reads published research paths" on public.research_paths;
create policy "Public reads published research paths" on public.research_paths for select
  to anon, authenticated
  using (published = true or public.is_platform_admin());

drop policy if exists "Admins manage research paths" on public.research_paths;
create policy "Admins manage research paths" on public.research_paths for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Public reads research path steps" on public.research_path_steps;
create policy "Public reads research path steps" on public.research_path_steps for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.research_paths p
      where p.id = path_id and (p.published = true or public.is_platform_admin())
    )
  );

drop policy if exists "Admins manage research path steps" on public.research_path_steps;
create policy "Admins manage research path steps" on public.research_path_steps for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Members manage own path progress" on public.research_path_progress;
create policy "Members manage own path progress" on public.research_path_progress for all
  to authenticated
  using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());

-- Seed static research paths when empty
insert into public.research_paths (id, title, description, sort_order)
values
  ('foundations', 'Transformer foundations',
   'Start with attention mechanics, then read the paper that made it the default.', 1),
  ('world-models', 'World models & JEPA',
   'Representation-space prediction and residual tokenization threads.', 2),
  ('scaling-alignment', 'Scaling & alignment',
   'Compute budgeting and preference optimization in practice.', 3),
  ('build-method', 'Paper → prototype',
   'How The Bu1ld reads papers and scopes prototypes.', 4)
on conflict (id) do nothing;

insert into public.research_path_steps (path_id, step_kind, step_slug, sort_order)
select * from (values
  ('foundations', 'guide', 'what-is-attention', 1),
  ('foundations', 'paper', 'attention-is-all-you-need', 2),
  ('foundations', 'guide', 'math-behind-ai', 3),
  ('world-models', 'guide', 'what-is-jepa', 1),
  ('world-models', 'paper', 'lecun-jepa-world-models', 2),
  ('world-models', 'paper', 'residual-event-tokenization', 3),
  ('scaling-alignment', 'paper', 'chinchilla-scaling-laws', 1),
  ('scaling-alignment', 'paper', 'direct-preference-optimization', 2),
  ('scaling-alignment', 'guide', 'how-llms-work', 3),
  ('build-method', 'guide', 'paper-to-prototype', 1),
  ('build-method', 'guide', 'physics-informed-nns', 2),
  ('build-method', 'paper', 'residual-event-tokenization', 3)
) as v(path_id, step_kind, step_slug, sort_order)
where not exists (
  select 1 from public.research_path_steps s
  where s.path_id = v.path_id and s.step_kind = v.step_kind and s.step_slug = v.step_slug
);

-- ---------------------------------------------------------------------------
-- Project application questions
-- ---------------------------------------------------------------------------
create table if not exists public.project_application_questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) between 5 and 500),
  required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_application_questions_project_idx
  on public.project_application_questions (project_id, sort_order);

create table if not exists public.project_application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.project_applications(id) on delete cascade,
  question_id uuid not null references public.project_application_questions(id) on delete cascade,
  answer text not null check (char_length(trim(answer)) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique (application_id, question_id)
);

alter table public.project_application_questions enable row level security;
alter table public.project_application_answers enable row level security;

revoke all on table public.project_application_questions from anon;
revoke all on table public.project_application_answers from anon;
grant select on table public.project_application_questions to authenticated;
grant select, insert, update, delete on table public.project_application_questions to authenticated;
grant select, insert on table public.project_application_answers to authenticated;

drop policy if exists "Members read project questions" on public.project_application_questions;
create policy "Members read project questions" on public.project_application_questions for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.published = true or p.lead_id = auth.uid() or public.is_platform_admin())
    )
  );

drop policy if exists "Leads manage project questions" on public.project_application_questions;
create policy "Leads manage project questions" on public.project_application_questions for all
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  )
  with check (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  );

drop policy if exists "Applicants insert answers" on public.project_application_answers;
create policy "Applicants insert answers" on public.project_application_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Applicants and leads read answers" on public.project_application_answers;
create policy "Applicants and leads read answers" on public.project_application_answers for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_applications a
      join public.projects p on p.id = a.project_id
      where a.id = application_id and p.lead_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Project datasets registry
-- ---------------------------------------------------------------------------
create table if not exists public.project_datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  version_label text not null default 'v1' check (char_length(trim(version_label)) between 1 and 40),
  description text not null default '' check (char_length(description) <= 4000),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  license text check (license is null or char_length(license) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_datasets_project_idx
  on public.project_datasets (project_id, created_at desc);

alter table public.project_datasets enable row level security;
revoke all on table public.project_datasets from anon;
grant select, insert, update, delete on table public.project_datasets to authenticated;

drop policy if exists "Collaborators read project datasets" on public.project_datasets;
create policy "Collaborators read project datasets" on public.project_datasets for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and (p.lead_id = auth.uid() or p.published = true)
    )
    or exists (
      select 1 from public.project_memberships m
      where m.project_id = project_datasets.project_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "Leads and members write project datasets" on public.project_datasets;
create policy "Leads and members write project datasets" on public.project_datasets for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_platform_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (
        select 1 from public.project_memberships m
        where m.project_id = project_id and m.user_id = auth.uid() and m.status = 'active'
      )
    )
  );

drop policy if exists "Leads update project datasets" on public.project_datasets;
create policy "Leads update project datasets" on public.project_datasets for update
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or created_by = auth.uid()
  )
  with check (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or created_by = auth.uid()
  );

drop policy if exists "Leads delete project datasets" on public.project_datasets;
create policy "Leads delete project datasets" on public.project_datasets for delete
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  );

insert into public.schema_migrations (phase) values ('phase26') on conflict (phase) do nothing;

-- END supabase/phase26.sql


-- BEGIN supabase/phase27.sql
-- Phase 27 — Assigned reviewers for project contributions (independent of lead-only review).
-- Additive. Apply after phase26.sql.

alter table public.project_contributions
  add column if not exists assigned_reviewer_id uuid references public.profiles(id) on delete set null;

create index if not exists project_contributions_assigned_reviewer_idx
  on public.project_contributions (assigned_reviewer_id)
  where assigned_reviewer_id is not null;

-- Lead/admin may assign a reviewer; assigned reviewer may clear only via lead reassignment
drop policy if exists "Leads assign contribution reviewers" on public.project_contributions;
create policy "Leads assign contribution reviewers" on public.project_contributions for update
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.lead_id = auth.uid()
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.lead_id = auth.uid()
    )
  );

create or replace function public.review_project_contribution(
  p_contribution_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('verified', 'needs_changes') then raise exception 'Invalid verification status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Verification note is too long'; end if;
  if p_status = 'needs_changes' and safe_note is null then raise exception 'A revision request requires a note'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = contribution_row.project_id and p.lead_id = auth.uid()
    )
    or contribution_row.assigned_reviewer_id = auth.uid()
  ) then
    raise exception 'Only the project lead, assigned reviewer, or an administrator may review contributions';
  end if;

  perform set_config('app.contribution_review', 'true', true);
  update public.project_contributions
  set verification_status = p_status,
      verification_note = safe_note,
      verified_by = auth.uid(),
      verified_at = now(),
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.review_project_contribution(uuid, text, text) from public;
grant execute on function public.review_project_contribution(uuid, text, text) to authenticated;

create or replace function public.assign_contribution_reviewer(
  p_contribution_id uuid,
  p_reviewer_id uuid
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = contribution_row.project_id and p.lead_id = auth.uid()
    )
  ) then
    raise exception 'Only the project lead or an administrator may assign reviewers';
  end if;

  if p_reviewer_id is not null and not exists (
    select 1 from public.profiles where id = p_reviewer_id
  ) then
    raise exception 'Reviewer profile not found';
  end if;

  update public.project_contributions
  set assigned_reviewer_id = p_reviewer_id,
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.assign_contribution_reviewer(uuid, uuid) from public;
grant execute on function public.assign_contribution_reviewer(uuid, uuid) to authenticated;

insert into public.schema_migrations (phase) values ('phase27') on conflict (phase) do nothing;

-- END supabase/phase27.sql

-- BEGIN supabase/phase28.sql
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

insert into public.schema_migrations (phase)
values ('phase28')
on conflict (phase) do nothing;
-- END supabase/phase28.sql

-- BEGIN supabase/phase29.sql
-- Phase 29 — Project weekly commitment (builder discovery honesty).
-- Additive. Apply after phase28.sql.

alter table public.projects
  add column if not exists weekly_commitment_hours integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_weekly_commitment_hours_check'
  ) then
    alter table public.projects
      add constraint projects_weekly_commitment_hours_check
      check (
        weekly_commitment_hours is null
        or (weekly_commitment_hours >= 1 and weekly_commitment_hours <= 60)
      );
  end if;
end $$;

insert into public.schema_migrations (phase)
values ('phase29')
on conflict (phase) do nothing;
-- END supabase/phase29.sql

-- BEGIN supabase/phase30.sql
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
-- END supabase/phase30.sql

-- BEGIN supabase/phase31.sql
-- Phase 31 — Authorization integrity for competitions, invitations, deliverables,
-- contributions, memberships, and program seed catalog.
-- Additive. Apply after phase30.sql.

-- ── Competitions: submitters may withdraw; only admins decide accept/reject ──
drop policy if exists "Members manage own competition submissions" on public.competition_submissions;
drop policy if exists "Admins review competition submissions" on public.competition_submissions;

create policy "Members read own competition submissions" on public.competition_submissions
  for select
  to authenticated
  using (
    submitter_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "Members submit to open competitions" on public.competition_submissions
  for insert
  to authenticated
  with check (
    submitter_id = auth.uid()
    and exists (
      select 1 from public.competitions c
      where c.id = competition_id
        and c.published = true
        and c.status = 'open'
    )
  );

create policy "Members withdraw own competition submissions" on public.competition_submissions
  for update
  to authenticated
  using (submitter_id = auth.uid() and status = 'submitted')
  with check (submitter_id = auth.uid() and status = 'withdrawn');

create or replace function public.review_competition_submission(
  p_submission_id uuid,
  p_status text,
  p_note text default null
)
returns public.competition_submissions
language plpgsql
security definer
set search_path = public
as $$
declare submission_row public.competition_submissions;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_platform_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('accepted', 'rejected', 'submitted') then
    raise exception 'Invalid competition review status';
  end if;
  if safe_note is not null and char_length(safe_note) > 4000 then
    raise exception 'Review note is too long';
  end if;

  update public.competition_submissions
  set status = p_status,
      review_note = safe_note,
      updated_at = now()
  where id = p_submission_id
  returning * into submission_row;
  if not found then raise exception 'Submission not found'; end if;
  return submission_row;
end;
$$;

revoke all on function public.review_competition_submission(uuid, text, text) from public;
grant execute on function public.review_competition_submission(uuid, text, text) to authenticated;

-- ── Invitations: direct accept blocked; accept_invitation remains the only path ──
create or replace function public.guard_invitation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.invitation_accept', true) = 'true' then
    return new;
  end if;

  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    raise exception 'Accept invitations through accept_invitation';
  end if;

  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  if public.is_platform_admin() then
    return new;
  end if;

  if old.invited_by = auth.uid() then
    if new.status not in ('pending', 'revoked') then
      raise exception 'Inviters may only revoke pending invitations';
    end if;
    if new.target_id is distinct from old.target_id
       or new.role_offered is distinct from old.role_offered
       or new.invitation_type is distinct from old.invitation_type then
      raise exception 'Invitation target fields are immutable';
    end if;
    return new;
  end if;

  if old.invitee_id = auth.uid()
     or lower(coalesce(old.email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')) then
    if new.status <> 'declined' or old.status <> 'pending' then
      raise exception 'Invitees may only decline pending invitations';
    end if;
    if new.target_id is distinct from old.target_id
       or new.role_offered is distinct from old.role_offered then
      raise exception 'Invitation target fields are immutable';
    end if;
    return new;
  end if;

  raise exception 'Not authorized to update this invitation';
end;
$$;

drop trigger if exists guard_invitation_update_trigger on public.invitations;
create trigger guard_invitation_update_trigger
  before update on public.invitations
  for each row execute function public.guard_invitation_update();

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
  if inv.invitee_id is distinct from auth.uid()
     and lower(coalesce(inv.email, '')) <> lower(coalesce(auth.jwt() ->> 'email', ''))
     and not public.is_platform_admin() then
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

  perform set_config('app.invitation_accept', 'true', true);
  update public.invitations
    set status = 'accepted',
        accepted_at = now(),
        invitee_id = coalesce(invitee_id, auth.uid())
    where id = inv.id
    returning * into inv;
  return inv;
end;
$$;

revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- ── Deliverables: authors revise content; only leads/admins decide status ──
create or replace function public.guard_project_deliverable_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare is_lead boolean;
begin
  if current_setting('app.deliverable_review', true) = 'true' then
    return new;
  end if;

  select exists (
    select 1 from public.projects p
    where p.id = old.project_id and p.lead_id = auth.uid()
  ) or public.is_platform_admin() into is_lead;

  if coalesce(is_lead, false) then
    return new;
  end if;

  if old.submitted_by = auth.uid() then
    if new.status is distinct from old.status
       and not (old.status in ('draft', 'changes_requested') and new.status = 'submitted')
       and not (old.status = 'submitted' and new.status = 'draft') then
      raise exception 'Deliverable status changes require a project lead';
    end if;
    if new.review_note is distinct from old.review_note
       or new.reviewed_by is distinct from old.reviewed_by then
      raise exception 'Deliverable review fields require a project lead';
    end if;
    return new;
  end if;

  raise exception 'Not authorized to update this deliverable';
end;
$$;

drop trigger if exists guard_project_deliverable_update_trigger on public.project_deliverables;
create trigger guard_project_deliverable_update_trigger
  before update on public.project_deliverables
  for each row execute function public.guard_project_deliverable_update();

create or replace function public.review_project_deliverable(
  p_deliverable_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_deliverables
language plpgsql
security definer
set search_path = public
as $$
declare deliverable_row public.project_deliverables;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('accepted', 'changes_requested', 'submitted') then
    raise exception 'Invalid deliverable review status';
  end if;
  if safe_note is not null and char_length(safe_note) > 4000 then
    raise exception 'Review note is too long';
  end if;

  select * into deliverable_row from public.project_deliverables where id = p_deliverable_id for update;
  if not found then raise exception 'Deliverable not found'; end if;
  if not public.is_platform_admin()
     and not exists (
       select 1 from public.projects p
       where p.id = deliverable_row.project_id and p.lead_id = auth.uid()
     ) then
    raise exception 'Not authorized';
  end if;

  perform set_config('app.deliverable_review', 'true', true);
  update public.project_deliverables
  set status = p_status,
      review_note = safe_note,
      reviewed_by = auth.uid(),
      updated_at = now()
  where id = p_deliverable_id
  returning * into deliverable_row;
  return deliverable_row;
end;
$$;

revoke all on function public.review_project_deliverable(uuid, text, text) from public;
grant execute on function public.review_project_deliverable(uuid, text, text) to authenticated;

-- ── Contributions: drop broad lead UPDATE; assignment stays on the RPC ──
drop policy if exists "Leads assign contribution reviewers" on public.project_contributions;

-- ── Memberships: leads may read; status changes via RPC only ──
drop policy if exists "Leads manage project memberships" on public.project_memberships;
create policy "Leads read project memberships" on public.project_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or public.is_platform_admin()
  );

create or replace function public.set_project_membership_status(
  p_project_id uuid,
  p_user_id uuid,
  p_status text
)
returns public.project_memberships
language plpgsql
security definer
set search_path = public
as $$
declare membership_row public.project_memberships;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('active', 'paused', 'alumni', 'removed') then
    raise exception 'Invalid membership status';
  end if;
  if not public.is_platform_admin()
     and not exists (
       select 1 from public.projects p
       where p.id = p_project_id and p.lead_id = auth.uid()
     ) then
    raise exception 'Not authorized';
  end if;

  update public.project_memberships
  set status = p_status,
      left_at = case when p_status in ('removed', 'alumni') then now() else null end
  where project_id = p_project_id and user_id = p_user_id
  returning * into membership_row;
  if not found then raise exception 'Membership not found'; end if;
  return membership_row;
end;
$$;

revoke all on function public.set_project_membership_status(uuid, uuid, text) from public;
grant execute on function public.set_project_membership_status(uuid, uuid, text) to authenticated;

-- ── Application answers only while the application is still pending ──
drop policy if exists "Applicants insert answers" on public.project_application_answers;
create policy "Applicants insert answers" on public.project_application_answers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_applications a
      join public.project_application_questions q on q.id = question_id
      where a.id = application_id
        and a.user_id = auth.uid()
        and a.status = 'pending'
        and q.project_id = a.project_id
    )
  );

grant update on table public.project_application_answers to authenticated;
drop policy if exists "Applicants revise pending answers" on public.project_application_answers;
create policy "Applicants revise pending answers" on public.project_application_answers
  for update
  to authenticated
  using (
    exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid() and a.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid() and a.status = 'pending'
    )
  );

-- ── Claims: evidence URL required server-side at verify time ──
create or replace function public.review_institutional_claim(
  p_claim_id uuid,
  p_status text
)
returns public.institutional_claims
language plpgsql
security definer
set search_path = public
as $$
declare claim_row public.institutional_claims;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_platform_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('verified', 'retired') then
    raise exception 'Invalid claim review status';
  end if;

  select * into claim_row from public.institutional_claims where id = p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;

  if p_status = 'verified' then
    if claim_row.evidence_url is null
       or claim_row.evidence_url !~* '^https?://'
       or char_length(trim(coalesce(claim_row.evidence_label, ''))) < 2 then
      raise exception 'Verified claims require an https evidence URL and label';
    end if;
  end if;

  update public.institutional_claims
  set status = p_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_claim_id
  returning * into claim_row;
  return claim_row;
end;
$$;

revoke all on function public.review_institutional_claim(uuid, text) from public;
grant execute on function public.review_institutional_claim(uuid, text) to authenticated;

-- ── Published projects: keep experiments/datasets collaborator-scoped ──
drop policy if exists "Collaborators read project experiments" on public.project_experiments;
create policy "Collaborators read project experiments" on public.project_experiments
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_experiments.project_id
        and pm.user_id = auth.uid()
        and pm.status in ('active', 'paused')
    )
  );

drop policy if exists "Collaborators read project datasets" on public.project_datasets;
create policy "Collaborators read project datasets" on public.project_datasets
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_datasets.project_id
        and pm.user_id = auth.uid()
        and pm.status in ('active', 'paused')
    )
  );

-- ── Seed institution program cycles so public CTAs resolve to applyable rows ──
insert into public.programs (
  slug, title, program_type, summary, application_instructions,
  capacity, applications_open_at, applications_close_at, outcomes, published
)
values
  (
    'research-fellowship',
    'Research Fellowship',
    'fellowship',
    'A structured research cycle: clarify a question, run disciplined experiments, and leave a public project record with evidence, limitations, and next decisions.',
    'Submit a 40+ character statement covering the question you would pursue, relevant prior work, and weekly availability.',
    12,
    now() - interval '1 day',
    now() + interval '90 days',
    'Scoped research charter; milestone and contribution history; optional research note; demo or written postmortem.',
    true
  ),
  (
    'startup-incubation',
    'Startup Incubation',
    'incubation',
    'For builders testing whether a technical thread deserves a product prototype and early user conversations — not a fundraising narrative.',
    'Describe the product claim, current prototype state, kill criteria, and founding-team commitment.',
    8,
    now() - interval '1 day',
    now() + interval '90 days',
    'Working prototype; evaluator sessions; go / pivot / stop decision memo.',
    true
  ),
  (
    'ai-builder-cohort',
    'AI Builder Cohort',
    'cohort',
    'A project-driven cohort that turns a scoped technical question into a reproducible prototype, clear documentation, and a final demo.',
    'Name the prototype you intend to ship in 12 weeks and the skills you bring to weekly demos.',
    24,
    now() - interval '1 day',
    now() + interval '90 days',
    'Weekly shipping cadence; peer review of demos; final demo day artifact.',
    true
  )
on conflict (slug) do update
set title = excluded.title,
    program_type = excluded.program_type,
    summary = excluded.summary,
    application_instructions = excluded.application_instructions,
    capacity = excluded.capacity,
    applications_open_at = excluded.applications_open_at,
    applications_close_at = excluded.applications_close_at,
    outcomes = excluded.outcomes,
    published = true,
    updated_at = now();

insert into public.schema_migrations (phase)
values ('phase31')
on conflict (phase) do nothing;
-- END supabase/phase31.sql

-- BEGIN supabase/phase32.sql
-- phase32: contribution self-verify ban + leadership ops counters support
-- Extends review_project_contribution / assign_contribution_reviewer.

create or replace function public.review_project_contribution(
  p_contribution_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('verified', 'needs_changes') then raise exception 'Invalid verification status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Verification note is too long'; end if;
  if p_status = 'needs_changes' and safe_note is null then raise exception 'A revision request requires a note'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  -- Never allow the contributor to verify (or request changes on) their own submission,
  -- even if they are the project lead or a platform administrator.
  if contribution_row.contributor_id = auth.uid() then
    raise exception 'Contributors cannot review their own submissions';
  end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = contribution_row.project_id and p.lead_id = auth.uid()
    )
    or contribution_row.assigned_reviewer_id = auth.uid()
  ) then
    raise exception 'Only the project lead, assigned reviewer, or an administrator may review contributions';
  end if;

  perform set_config('app.contribution_review', 'true', true);
  update public.project_contributions
  set verification_status = p_status,
      verification_note = safe_note,
      verified_by = auth.uid(),
      verified_at = now(),
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.review_project_contribution(uuid, text, text) from public;
grant execute on function public.review_project_contribution(uuid, text, text) to authenticated;

create or replace function public.assign_contribution_reviewer(
  p_contribution_id uuid,
  p_reviewer_id uuid
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = contribution_row.project_id and p.lead_id = auth.uid()
    )
  ) then
    raise exception 'Only the project lead or an administrator may assign reviewers';
  end if;

  if p_reviewer_id is not null and p_reviewer_id = contribution_row.contributor_id then
    raise exception 'Contributors cannot be assigned as reviewers of their own submissions';
  end if;

  if p_reviewer_id is not null and not exists (
    select 1 from public.profiles where id = p_reviewer_id
  ) then
    raise exception 'Reviewer profile not found';
  end if;

  update public.project_contributions
  set assigned_reviewer_id = p_reviewer_id,
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.assign_contribution_reviewer(uuid, uuid) from public;
grant execute on function public.assign_contribution_reviewer(uuid, uuid) to authenticated;

insert into public.schema_migrations (phase) values ('phase32')
on conflict (phase) do nothing;

-- END supabase/phase32.sql

-- BEGIN supabase/phase33.sql
-- phase33: atomic project application submission
-- Inserts the application and its project-specific answers in one transaction.

revoke insert on table public.project_applications from authenticated;
revoke insert on table public.project_application_answers from authenticated;
drop policy if exists "Members apply to projects" on public.project_applications;
drop policy if exists "Applicants insert answers" on public.project_application_answers;

create or replace function public.submit_project_application(
  p_project_id uuid,
  p_pitch text,
  p_answers jsonb default '[]'::jsonb
)
returns public.project_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects;
  application_row public.project_applications;
  safe_pitch text := trim(coalesce(p_pitch, ''));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if char_length(safe_pitch) not between 20 and 4000 then
    raise exception 'Pitch must be between 20 and 4000 characters';
  end if;
  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Application answers must be an array';
  end if;

  select * into project_row
  from public.projects
  where id = p_project_id
  for update;
  if not found then raise exception 'Project not found'; end if;
  if project_row.published is not true or project_row.status <> 'open' then
    raise exception 'This project is not accepting applications';
  end if;
  if project_row.team_count >= project_row.capacity then
    raise exception 'This project is at capacity';
  end if;
  if project_row.lead_id = auth.uid() then
    raise exception 'Project leads cannot apply to their own project';
  end if;
  if exists (
    select 1 from public.project_memberships m
    where m.project_id = p_project_id
      and m.user_id = auth.uid()
      and m.status in ('active', 'paused')
  ) then
    raise exception 'You are already a member of this project';
  end if;
  if exists (
    select 1 from public.project_applications a
    where a.project_id = p_project_id and a.user_id = auth.uid()
  ) then
    raise exception 'You already applied to this project';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
    where not (item ? 'questionId')
       or not (item ? 'answer')
       or jsonb_typeof(item -> 'questionId') <> 'string'
       or jsonb_typeof(item -> 'answer') <> 'string'
       or (item ->> 'questionId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or char_length(trim(item ->> 'answer')) > 4000
  ) then
    raise exception 'Application answers are malformed';
  end if;

  if exists (
    select 1
    from (
      select item ->> 'questionId' as question_id, count(*) as answer_count
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
      group by item ->> 'questionId'
    ) supplied
    where supplied.answer_count > 1
  ) then
    raise exception 'Each application question may be answered once';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
    left join public.project_application_questions q
      on q.id = (item ->> 'questionId')::uuid
      and q.project_id = p_project_id
    where q.id is null
  ) then
    raise exception 'An application answer references an invalid question';
  end if;

  if exists (
    select 1
    from public.project_application_questions q
    where q.project_id = p_project_id
      and q.required is true
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
        where (item ->> 'questionId')::uuid = q.id
          and char_length(trim(item ->> 'answer')) between 1 and 4000
      )
  ) then
    raise exception 'Answer every required application question';
  end if;

  insert into public.project_applications (project_id, user_id, pitch, status)
  values (p_project_id, auth.uid(), safe_pitch, 'pending')
  returning * into application_row;

  insert into public.project_application_answers (application_id, question_id, answer)
  select
    application_row.id,
    (item ->> 'questionId')::uuid,
    trim(item ->> 'answer')
  from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
  where char_length(trim(item ->> 'answer')) between 1 and 4000;

  return application_row;
end;
$$;

revoke all on function public.submit_project_application(uuid, text, jsonb) from public;
grant execute on function public.submit_project_application(uuid, text, jsonb) to authenticated;

insert into public.schema_migrations (phase) values ('phase33')
on conflict (phase) do nothing;

-- END supabase/phase33.sql
