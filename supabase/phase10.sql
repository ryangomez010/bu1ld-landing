-- Phase 10 — membership hardening (run after phase9.sql)
-- Directory privacy, synced paper reads, event RSVPs

alter table public.profiles
  add column if not exists directory_visible boolean not null default true;

-- Tighten directory: only visible profiles (users always read own via other policies)
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
