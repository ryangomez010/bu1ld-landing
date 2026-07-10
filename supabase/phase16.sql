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
