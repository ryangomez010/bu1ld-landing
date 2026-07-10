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
