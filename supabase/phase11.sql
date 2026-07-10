-- Phase 11 — paper notes/progress sync + newsletter subscriptions (run after phase10.sql)

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
