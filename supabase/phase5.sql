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
