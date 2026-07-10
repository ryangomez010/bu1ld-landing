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
