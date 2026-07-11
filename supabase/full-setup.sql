
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
