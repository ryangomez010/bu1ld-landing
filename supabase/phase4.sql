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
