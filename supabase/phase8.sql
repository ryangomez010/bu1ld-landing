-- Phase 8 — additional security constraints (run after phase7.sql)

-- Length limits aligned with src/lib/security.ts LIMITS
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

-- Prevent non-admins from elevating role on insert (defense in depth with client strip)
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
