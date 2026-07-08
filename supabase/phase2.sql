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
